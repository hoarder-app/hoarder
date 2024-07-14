/* eslint-disable @typescript-eslint/require-await */
import { Semaphore } from "async-mutex";
import { eq } from "drizzle-orm";
import { describe, expect, test } from "vitest";
import { z } from "zod";

import {
  buildDBClient,
  DequeuedJob,
  DequeuedJobError,
  Runner,
  RunnerOptions,
  SqliteQueue,
} from "./";
import { tasksTable } from "./schema";

class Baton {
  semaphore: Semaphore;
  constructor() {
    this.semaphore = new Semaphore(0);
    this.reset();
  }
  post() {
    this.semaphore.setValue(100000);
  }

  async wait() {
    await this.semaphore.acquire();
  }

  reset() {
    this.semaphore.setValue(-Infinity);
  }
}

class Barrier {
  semaphore: Semaphore;
  baton: Baton;
  constructor(numParticipants: number) {
    this.semaphore = new Semaphore(numParticipants * -1 + 1);
    this.baton = new Baton();
    this.reset(numParticipants * -1 + 1);
  }

  async notifyReachedAndWait() {
    this.semaphore.release();
    await this.baton.wait();
  }

  async waitUntilAllReached() {
    await this.semaphore.waitForUnlock();
  }

  allowParticipantsToProceed() {
    this.baton.post();
  }

  reset(numParticipants: number) {
    this.semaphore.setValue(numParticipants);
    this.baton.reset();
  }
}

const defaultRunnerOpts = {
  pollIntervalMs: 100,
  timeoutSecs: 100,
  concurrency: 2,
  validator: z.object({
    increment: z.number(),
    succeedAfter: z.number().optional().default(0),
    blockForSec: z.number().optional().default(0),
  }),
};

interface Work {
  increment: number;
  succeedAfter?: number;
  blockForSec?: number;
}

interface Results {
  result: number;
  numCalled: number;
  numCompleted: number;
  numFailed: number;
}

async function waitUntilAllSettled(queue: SqliteQueue<Work>) {
  let stats = await queue.stats();
  while (stats.running > 0 || stats.pending > 0 || stats.pending_retry > 0) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    stats = await queue.stats();
    console.log(stats);
  }
}

function buildRunner(
  queue: SqliteQueue<Work>,
  opts: RunnerOptions<Work>,
  barrier: Barrier,
  inputResults?: Results,
) {
  const results = inputResults ?? {
    result: 0,
    numCalled: 0,
    numCompleted: 0,
    numFailed: 0,
  };
  const runner = new Runner<Work>(
    queue,
    {
      run: async (job: DequeuedJob<Work>) => {
        console.log("STARTED:", job);
        results.numCalled++;
        await barrier.notifyReachedAndWait();
        if (job.runNumber < (job.data.succeedAfter ?? 0)) {
          throw new Error("Failed");
        }
        if (job.data.blockForSec !== undefined) {
          await new Promise((resolve) =>
            setTimeout(resolve, job.data.blockForSec! * 1000),
          );
        }
        results.result += job.data.increment;
      },
      onComplete: async (job: DequeuedJob<Work>) => {
        console.log("COMPLETED:", job);
        results.numCompleted++;
      },
      onError: async (job: DequeuedJobError<Work>) => {
        console.log("FAILED:", job);
        results.numFailed++;
      },
    },
    opts,
  );

  return { runner, results };
}

describe("SqiteQueueRunner", () => {
  test("should run jobs with correct concurrency", async () => {
    const queue = new SqliteQueue<Work>(
      "queue1",
      buildDBClient(":memory:", true),
      {
        defaultJobArgs: {
          numRetries: 0,
        },
      },
    );

    const barrier = new Barrier(2);
    const { runner, results } = buildRunner(
      queue,
      { ...defaultRunnerOpts, concurrency: 2 },
      barrier,
    );

    queue.enqueue({ increment: 1 });
    queue.enqueue({ increment: 2 });
    queue.enqueue({ increment: 3 });

    expect(await queue.stats()).toEqual({
      pending: 3,
      running: 0,
      pending_retry: 0,
      failed: 0,
    });

    const runnerPromise = runner.runUntilEmpty();

    // Wait until all runners reach the synchronization point
    await barrier.waitUntilAllReached();

    // Ensure that we have two "running" jobs given the concurrency of 2
    expect(await queue.stats()).toEqual({
      pending: 1,
      running: 2,
      pending_retry: 0,
      failed: 0,
    });

    // Allow jobs to proceed
    barrier.allowParticipantsToProceed();

    // Wait until all jobs are consumed
    await runnerPromise;

    expect(await queue.stats()).toEqual({
      pending: 0,
      running: 0,
      pending_retry: 0,
      failed: 0,
    });

    expect(results.result).toEqual(6);
    expect(results.numCalled).toEqual(3);
    expect(results.numCompleted).toEqual(3);
    expect(results.numFailed).toEqual(0);
  });

  test("should retry errors", async () => {
    const queue = new SqliteQueue<Work>(
      "queue1",
      buildDBClient(":memory:", true),
      {
        defaultJobArgs: {
          numRetries: 2,
        },
      },
    );

    const barrier = new Barrier(0);
    barrier.allowParticipantsToProceed();
    const { runner, results } = buildRunner(queue, defaultRunnerOpts, barrier);

    queue.enqueue({ increment: 1, succeedAfter: 2 });
    queue.enqueue({ increment: 1, succeedAfter: 10 });
    queue.enqueue({ increment: 3, succeedAfter: 0 });

    const runnerPromise = runner.runUntilEmpty();

    // Wait until all jobs are consumed
    await runnerPromise;

    expect(await queue.stats()).toEqual({
      pending: 0,
      pending_retry: 0,
      running: 0,
      failed: 1,
    });

    expect(results.result).toEqual(4);
    expect(results.numCalled).toEqual(7);
    expect(results.numCompleted).toEqual(2);
    expect(results.numFailed).toEqual(1);
  });

  test("timeouts are respected", async () => {
    const queue = new SqliteQueue<Work>(
      "queue1",
      buildDBClient(":memory:", true),
      {
        defaultJobArgs: {
          numRetries: 1,
        },
      },
    );

    const barrier = new Barrier(1);
    barrier.allowParticipantsToProceed();
    const { runner: runner, results } = buildRunner(
      queue,
      { ...defaultRunnerOpts, concurrency: 1, timeoutSecs: 1 },
      barrier,
    );

    queue.enqueue({ increment: 1, blockForSec: 10 });
    await runner.runUntilEmpty();

    expect(await queue.stats()).toEqual({
      pending: 0,
      pending_retry: 0,
      running: 0,
      failed: 1,
    });

    expect(results.result).toEqual(0);
    expect(results.numCalled).toEqual(2);
    expect(results.numCompleted).toEqual(0);
    expect(results.numFailed).toEqual(1);
  });

  test("serialization errors", async () => {
    const queue = new SqliteQueue<Work>(
      "queue1",
      buildDBClient(":memory:", true),
      {
        defaultJobArgs: {
          numRetries: 1,
        },
      },
    );

    const job = await queue.enqueue({ increment: 1 });
    // Corrupt the payload
    await queue.db
      .update(tasksTable)
      .set({ payload: "{}" })
      .where(eq(tasksTable.id, job.id));

    const barrier = new Barrier(1);
    barrier.allowParticipantsToProceed();
    const { runner, results } = buildRunner(
      queue,
      { ...defaultRunnerOpts, concurrency: 1 },
      barrier,
    );

    const p = runner.run();
    await waitUntilAllSettled(queue);
    runner.stop();
    await p;

    expect(await queue.stats()).toEqual({
      pending: 0,
      pending_retry: 0,
      running: 0,
      failed: 1,
    });

    expect(results.result).toEqual(0);
    expect(results.numCalled).toEqual(0);
    expect(results.numCompleted).toEqual(0);
    expect(results.numFailed).toEqual(1);
  });

  test("concurrent runners", async () => {
    const queue = new SqliteQueue<Work>(
      "queue1",
      buildDBClient(":memory:", true),
      {
        defaultJobArgs: {
          numRetries: 0,
        },
      },
    );

    await queue.enqueue({ increment: 1 });
    await queue.enqueue({ increment: 2 });
    await queue.enqueue({ increment: 3 });

    const barrier = new Barrier(3);
    const { runner: runner1, results } = buildRunner(
      queue,
      { ...defaultRunnerOpts, concurrency: 1 },
      barrier,
    );
    const { runner: runner2 } = buildRunner(
      queue,
      { ...defaultRunnerOpts, concurrency: 1 },
      barrier,
      results,
    );
    const { runner: runner3 } = buildRunner(
      queue,
      { ...defaultRunnerOpts, concurrency: 1 },
      barrier,
      results,
    );

    const runPromises = Promise.all([
      runner1.run(),
      runner2.run(),
      runner3.run(),
    ]);

    await barrier.waitUntilAllReached();

    expect(await queue.stats()).toEqual({
      pending: 0,
      pending_retry: 0,
      running: 3,
      failed: 0,
    });

    barrier.allowParticipantsToProceed();

    runner1.stop();
    runner2.stop();
    runner3.stop();

    await runPromises;

    expect(results.result).toEqual(6);
    expect(results.numCalled).toEqual(3);
    expect(results.numCompleted).toEqual(3);
    expect(results.numFailed).toEqual(0);
  });

  test("large test", async () => {
    const db = buildDBClient(":memory:", true);
    const queue1 = new SqliteQueue<Work>("queue1", db, {
      defaultJobArgs: {
        numRetries: 0,
      },
    });
    const queue2 = new SqliteQueue<Work>("queue2", db, {
      defaultJobArgs: {
        numRetries: 0,
      },
    });

    const barrier = new Barrier(0);
    barrier.allowParticipantsToProceed();
    const results = {
      result: 0,
      numCalled: 0,
      numCompleted: 0,
      numFailed: 0,
    };
    const runners = [];
    const runnerPromises = [];

    for (let i = 0; i < 10; i++) {
      const { runner } = buildRunner(
        i % 2 == 0 ? queue1 : queue2,
        { ...defaultRunnerOpts, concurrency: 2 },
        barrier,
        results,
      );
      runners.push(runner);
      runnerPromises.push(runner.run());
    }

    {
      const enqueuePromises = [];
      for (let i = 0; i < 1000; i++) {
        enqueuePromises.push(
          (i % 2 == 0 ? queue1 : queue2).enqueue({ increment: i }),
        );
      }
      await Promise.all(enqueuePromises);
    }

    await Promise.all([
      waitUntilAllSettled(queue1),
      waitUntilAllSettled(queue2),
    ]);

    runners.forEach((runner) => runner.stop());
    await Promise.all(runnerPromises);

    expect(results.result).toEqual(499500);
    expect(results.numCalled).toEqual(1000);
    expect(results.numCompleted).toEqual(1000);
    expect(results.numFailed).toEqual(0);
  });
});
