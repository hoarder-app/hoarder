CREATE TABLE `linkBookmarkAssets` (
      `id` text NOT NULL,
      `assetType` text NOT NULL,
      `assetId` text NOT NULL,
      FOREIGN KEY (`id`) REFERENCES `bookmarks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `linkBookmarkAssets` (`id`, `assetType`, `assetId`)
SELECT `id`, 'screenshot', `screenshotAssetId`
FROM `bookmarkLinks`
WHERE screenshotAssetId IS NOT NULL;
--> statement-breakpoint
INSERT INTO `linkBookmarkAssets` (`id`, `assetType`, `assetId`)
SELECT `id`, 'fullPageArchive', `fullPageArchiveAssetId`
FROM `bookmarkLinks`
WHERE `fullPageArchiveAssetId` IS NOT NULL;
--> statement-breakpoint
INSERT INTO `linkBookmarkAssets` (`id`, `assetType`, `assetId`)
SELECT `id`, 'image', `imageAssetId`
FROM `bookmarkLinks`
WHERE `imageAssetId` IS NOT NULL;