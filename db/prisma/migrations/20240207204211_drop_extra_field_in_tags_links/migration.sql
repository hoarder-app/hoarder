/*
  Warnings:

  - You are about to drop the column `bookmarkTagsId` on the `TagsOnLinks` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TagsOnLinks" (
    "linkId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "attachedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TagsOnLinks_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "BookmarkedLink" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TagsOnLinks_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "BookmarkTags" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_TagsOnLinks" ("attachedAt", "linkId", "tagId") SELECT "attachedAt", "linkId", "tagId" FROM "TagsOnLinks";
DROP TABLE "TagsOnLinks";
ALTER TABLE "new_TagsOnLinks" RENAME TO "TagsOnLinks";
CREATE UNIQUE INDEX "TagsOnLinks_linkId_tagId_key" ON "TagsOnLinks"("linkId", "tagId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
