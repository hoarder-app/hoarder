CREATE TABLE `mobilePairingToken` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`tokenHash` text NOT NULL,
	`expires` integer NOT NULL,
	`usedAt` integer,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `mobilePairingToken_tokenHash_unique` ON `mobilePairingToken` (`tokenHash`);--> statement-breakpoint
CREATE INDEX `mobilePairingToken_userId_idx` ON `mobilePairingToken` (`userId`);