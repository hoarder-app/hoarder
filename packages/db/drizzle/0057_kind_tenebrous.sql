ALTER TABLE `bookmarkLists` ADD `locked` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `bookmarkLists` ADD `passwordHash` text;