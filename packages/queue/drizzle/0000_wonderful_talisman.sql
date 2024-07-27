CREATE TABLE `tasks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`queue` text NOT NULL,
	`payload` text NOT NULL,
	`createdAt` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`expireAt` integer,
	`allocationId` text NOT NULL,
	`numRunsLeft` integer NOT NULL,
	`maxNumRuns` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `tasks_queue_idx` ON `tasks` (`queue`);--> statement-breakpoint
CREATE INDEX `tasks_status_idx` ON `tasks` (`status`);--> statement-breakpoint
CREATE INDEX `tasks_expire_at_idx` ON `tasks` (`expireAt`);--> statement-breakpoint
CREATE INDEX `tasks_num_runs_left_idx` ON `tasks` (`numRunsLeft`);--> statement-breakpoint
CREATE INDEX `tasks_max_num_runs_idx` ON `tasks` (`maxNumRuns`);--> statement-breakpoint
CREATE INDEX `tasks_allocation_id_idx` ON `tasks` (`allocationId`);