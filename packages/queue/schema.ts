import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

function createdAtField() {
  return integer("createdAt", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date());
}

export const tasksTable = sqliteTable(
  "tasks",
  {
    id: integer("id").notNull().primaryKey({ autoIncrement: true }),
    queue: text("queue").notNull(),
    payload: text("payload").notNull(),
    createdAt: createdAtField(),
    status: text("status", {
      enum: ["pending", "running", "pending_retry", "failed"],
    })
      .notNull()
      .default("pending"),
    expireAt: integer("expireAt", { mode: "timestamp" }),
    allocationId: text("allocationId").notNull(),
    numRunsLeft: integer("numRunsLeft").notNull(),
    maxNumRuns: integer("maxNumRuns").notNull(),
  },
  (tasks) => ({
    queueIdx: index("tasks_queue_idx").on(tasks.queue),
    statusIdx: index("tasks_status_idx").on(tasks.status),
    expireAtIdx: index("tasks_expire_at_idx").on(tasks.expireAt),
    numRunsLeftIdx: index("tasks_num_runs_left_idx").on(tasks.numRunsLeft),
    maxNumRunsIdx: index("tasks_max_num_runs_idx").on(tasks.maxNumRuns),
    allocationIdIdx: index("tasks_allocation_id_idx").on(tasks.allocationId),
  }),
);

export type Job = typeof tasksTable.$inferSelect;
