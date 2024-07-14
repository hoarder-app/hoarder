import assert from "node:assert";
import { and, asc, count, eq, gt, lt, or } from "drizzle-orm";

import { buildDBClient } from "./db";
import { SqliteQueueOptions } from "./options";
import { Job, tasksTable } from "./schema";

// generate random id
function generateAllocationId() {
  return Math.random().toString(36).substring(2, 15);
}

export class SqliteQueue<T> {
  queueName: string;
  db: ReturnType<typeof buildDBClient>;
  options: SqliteQueueOptions;

  constructor(
    name: string,
    db: ReturnType<typeof buildDBClient>,
    options: SqliteQueueOptions,
  ) {
    this.queueName = name;
    this.options = options;
    this.db = db;
  }

  name() {
    return this.queueName;
  }

  async enqueue(payload: T): Promise<Job> {
    const job = await this.db
      .insert(tasksTable)
      .values({
        queue: this.queueName,
        payload: JSON.stringify(payload),
        numRunsLeft: this.options.defaultJobArgs.numRetries + 1,
        maxNumRuns: this.options.defaultJobArgs.numRetries + 1,
        allocationId: generateAllocationId(),
      })
      .returning();

    return job[0];
  }

  async stats() {
    const res = await this.db
      .select({ status: tasksTable.status, count: count() })
      .from(tasksTable)
      .where(eq(tasksTable.queue, this.queueName))
      .groupBy(tasksTable.status);

    return res.reduce(
      (acc, r) => {
        acc[r.status] += r.count;
        return acc;
      },
      {
        pending: 0,
        pending_retry: 0,
        running: 0,
        failed: 0,
      },
    );
  }

  async attemptDequeue(options: { timeoutSecs: number }): Promise<Job | null> {
    return await this.db.transaction(async (txn) => {
      const jobs = await txn
        .select()
        .from(tasksTable)
        .where(
          and(
            eq(tasksTable.queue, this.queueName),
            gt(tasksTable.numRunsLeft, 0),
            or(
              // Not picked by a worker yet
              eq(tasksTable.status, "pending"),

              // Failed but still has attempts left
              eq(tasksTable.status, "pending_retry"),

              // Expired and still has attempts left
              and(
                eq(tasksTable.status, "running"),
                lt(tasksTable.expireAt, new Date()),
              ),
            ),
          ),
        )
        .orderBy(asc(tasksTable.createdAt))
        .limit(1);

      if (jobs.length == 0) {
        return null;
      }
      assert(jobs.length == 1);
      const job = jobs[0];

      const result = await txn
        .update(tasksTable)
        .set({
          status: "running",
          numRunsLeft: job.numRunsLeft - 1,
          allocationId: generateAllocationId(),
          expireAt: new Date(new Date().getTime() + options.timeoutSecs * 1000),
        })
        .where(
          and(
            eq(tasksTable.id, job.id),

            // The compare and swap is necessary to avoid race conditions
            eq(tasksTable.allocationId, job.allocationId),
          ),
        )
        .returning();
      if (result.length == 0) {
        return null;
      }
      assert(result.length == 1);
      return result[0];
    });
  }

  async finalize(
    id: number,
    alloctionId: string,
    status: "completed" | "pending_retry" | "failed",
  ) {
    if (status == "completed") {
      await this.db
        .delete(tasksTable)
        .where(
          and(eq(tasksTable.id, id), eq(tasksTable.allocationId, alloctionId)),
        );
    } else {
      await this.db
        .update(tasksTable)
        .set({ status: status, expireAt: null })
        .where(
          and(eq(tasksTable.id, id), eq(tasksTable.allocationId, alloctionId)),
        );
    }
  }
}
