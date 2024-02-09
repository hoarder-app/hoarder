/*
  Warnings:

  - You are about to drop the `BookmarkedLinkDetails` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TagsOnLinks` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `createdAt` on the `BookmarkedLink` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `BookmarkedLink` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "TagsOnLinks_linkId_tagId_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "BookmarkedLinkDetails";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "TagsOnLinks";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Bookmark" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "favourited" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Bookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TagsOnBookmarks" (
    "bookmarkId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "attachedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attachedBy" TEXT NOT NULL,
    CONSTRAINT "TagsOnBookmarks_bookmarkId_fkey" FOREIGN KEY ("bookmarkId") REFERENCES "Bookmark" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TagsOnBookmarks_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "BookmarkTags" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BookmarkedLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "imageUrl" TEXT,
    "favicon" TEXT,
    "crawledAt" DATETIME,
    CONSTRAINT "BookmarkedLink_id_fkey" FOREIGN KEY ("id") REFERENCES "Bookmark" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_BookmarkedLink" ("id", "url") SELECT "id", "url" FROM "BookmarkedLink";
DROP TABLE "BookmarkedLink";
ALTER TABLE "new_BookmarkedLink" RENAME TO "BookmarkedLink";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE UNIQUE INDEX "TagsOnBookmarks_bookmarkId_tagId_key" ON "TagsOnBookmarks"("bookmarkId", "tagId");
