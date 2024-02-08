-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BookmarkedLinkDetails" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT,
    "description" TEXT,
    "imageUrl" TEXT,
    "favicon" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BookmarkedLinkDetails_id_fkey" FOREIGN KEY ("id") REFERENCES "BookmarkedLink" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_BookmarkedLinkDetails" ("createdAt", "description", "id", "imageUrl", "title") SELECT "createdAt", "description", "id", "imageUrl", "title" FROM "BookmarkedLinkDetails";
DROP TABLE "BookmarkedLinkDetails";
ALTER TABLE "new_BookmarkedLinkDetails" RENAME TO "BookmarkedLinkDetails";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
