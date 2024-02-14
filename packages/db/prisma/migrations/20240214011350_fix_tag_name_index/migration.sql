/*
  Warnings:

  - A unique constraint covering the columns `[userId,name]` on the table `BookmarkTags` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "BookmarkTags_name_key";

-- CreateIndex
CREATE UNIQUE INDEX "BookmarkTags_userId_name_key" ON "BookmarkTags"("userId", "name");
