-- CreateTable
CREATE TABLE "BookmarkedLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    CONSTRAINT "BookmarkedLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BookmarkedLinkDetails" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BookmarkedLinkDetails_id_fkey" FOREIGN KEY ("id") REFERENCES "BookmarkedLink" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BookmarkTags" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    CONSTRAINT "BookmarkTags_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TagsOnLinks" (
    "linkId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "attachedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bookmarkTagsId" TEXT NOT NULL,
    CONSTRAINT "TagsOnLinks_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "BookmarkedLink" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TagsOnLinks_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "BookmarkTags" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "BookmarkTags_name_key" ON "BookmarkTags"("name");

-- CreateIndex
CREATE UNIQUE INDEX "TagsOnLinks_linkId_tagId_key" ON "TagsOnLinks"("linkId", "tagId");
