CREATE TABLE `bookmarkEmbeddings` (
	`id` text PRIMARY KEY NOT NULL,
	`bookmarkId` text NOT NULL,
	`userId` text NOT NULL,
	`embedding` text NOT NULL,
	`embeddingType` text NOT NULL,
	`fromOffset` integer,
	`toOffset` integer,
	FOREIGN KEY (`bookmarkId`) REFERENCES `bookmarks`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `bookmarkEmbeddings_bookmarkId_idx` ON `bookmarkEmbeddings` (`bookmarkId`);--> statement-breakpoint
CREATE INDEX `bookmarkEmbeddings_userId_idx` ON `bookmarkEmbeddings` (`userId`);