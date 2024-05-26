import type { AdapterAccount } from "@auth/core/adapters";
import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import {
  AnySQLiteColumn,
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  unique,
} from "drizzle-orm/sqlite-core";

function createdAtField() {
  return integer("createdAt", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date());
}

export const users = sqliteTable("user", {
  id: text("id")
    .notNull()
    .primaryKey()
    .$defaultFn(() => createId()),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("emailVerified", { mode: "timestamp_ms" }),
  image: text("image"),
  password: text("password"),
  role: text("role", { enum: ["admin", "user"] }).default("user"),
});

export const accounts = sqliteTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccount["type"]>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  }),
);

export const sessions = sqliteTable("session", {
  sessionToken: text("sessionToken")
    .notNull()
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
});

export const verificationTokens = sqliteTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  }),
);

export const apiKeys = sqliteTable(
  "apiKey",
  {
    id: text("id")
      .notNull()
      .primaryKey()
      .$defaultFn(() => createId()),
    name: text("name").notNull(),
    createdAt: createdAtField(),
    keyId: text("keyId").notNull().unique(),
    keyHash: text("keyHash").notNull(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (ak) => ({
    unq: unique().on(ak.name, ak.userId),
  }),
);

export const bookmarks = sqliteTable(
  "bookmarks",
  {
    id: text("id")
      .notNull()
      .primaryKey()
      .$defaultFn(() => createId()),
    createdAt: createdAtField(),
    title: text("title"),
    archived: integer("archived", { mode: "boolean" }).notNull().default(false),
    favourited: integer("favourited", { mode: "boolean" })
      .notNull()
      .default(false),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    taggingStatus: text("taggingStatus", {
      enum: ["pending", "failure", "success"],
    }).default("pending"),
    note: text("note"),
  },
  (b) => ({
    userIdIdx: index("bookmarks_userId_idx").on(b.userId),
    archivedIdx: index("bookmarks_archived_idx").on(b.archived),
    favIdx: index("bookmarks_favourited_idx").on(b.favourited),
    createdAtIdx: index("bookmarks_createdAt_idx").on(b.createdAt),
  }),
);

export const bookmarkLinks = sqliteTable("bookmarkLinks", {
  id: text("id")
    .notNull()
    .primaryKey()
    .$defaultFn(() => createId())
    .references(() => bookmarks.id, { onDelete: "cascade" }),
  url: text("url").notNull(),

  // Crawled info
  title: text("title"),
  description: text("description"),
  imageUrl: text("imageUrl"),
  favicon: text("favicon"),
  content: text("content"),
  htmlContent: text("htmlContent"),
  screenshotAssetId: text("screenshotAssetId"),
  fullPageArchiveAssetId: text("fullPageArchiveAssetId"),
  imageAssetId: text("imageAssetId"),
  crawledAt: integer("crawledAt", { mode: "timestamp" }),
  crawlStatus: text("crawlStatus", {
    enum: ["pending", "failure", "success"],
  }).default("pending"),
}, (bl) => {
  return {
    urlIdx: index("bookmarkLinks_url_idx").on(bl.url),
  };
});

export const bookmarkTexts = sqliteTable("bookmarkTexts", {
  id: text("id")
    .notNull()
    .primaryKey()
    .$defaultFn(() => createId())
    .references(() => bookmarks.id, { onDelete: "cascade" }),
  text: text("text"),
});

export const bookmarkAssets = sqliteTable("bookmarkAssets", {
  id: text("id")
    .notNull()
    .primaryKey()
    .$defaultFn(() => createId())
    .references(() => bookmarks.id, { onDelete: "cascade" }),
  assetType: text("assetType", { enum: ["image", "pdf"] }).notNull(),
  assetId: text("assetId").notNull(),
  content: text("content"),
  metadata: text("metadata"),
  fileName: text("fileName"),
});

export const bookmarkTags = sqliteTable(
  "bookmarkTags",
  {
    id: text("id")
      .notNull()
      .primaryKey()
      .$defaultFn(() => createId()),
    name: text("name").notNull(),
    createdAt: createdAtField(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (bt) => ({
    uniq: unique().on(bt.userId, bt.name),
    nameIdx: index("bookmarkTags_name_idx").on(bt.name),
    userIdIdx: index("bookmarkTags_userId_idx").on(bt.userId),
  }),
);

export const tagsOnBookmarks = sqliteTable(
  "tagsOnBookmarks",
  {
    bookmarkId: text("bookmarkId")
      .notNull()
      .references(() => bookmarks.id, { onDelete: "cascade" }),
    tagId: text("tagId")
      .notNull()
      .references(() => bookmarkTags.id, { onDelete: "cascade" }),

    attachedAt: integer("attachedAt", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
    attachedBy: text("attachedBy", { enum: ["ai", "human"] }).notNull(),
  },
  (tb) => ({
    pk: primaryKey({ columns: [tb.bookmarkId, tb.tagId] }),
    tagIdIdx: index("tagsOnBookmarks_tagId_idx").on(tb.bookmarkId),
    bookmarkIdIdx: index("tagsOnBookmarks_bookmarkId_idx").on(tb.bookmarkId),
  }),
);

export const bookmarkLists = sqliteTable(
  "bookmarkLists",
  {
    id: text("id")
      .notNull()
      .primaryKey()
      .$defaultFn(() => createId()),
    name: text("name").notNull(),
    icon: text("icon").notNull(),
    createdAt: createdAtField(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    parentId: text("parentId")
      .references((): AnySQLiteColumn => bookmarkLists.id, { onDelete: "set null" }),
  },
  (bl) => ({
    userIdIdx: index("bookmarkLists_userId_idx").on(bl.userId),
  }),
);

export const bookmarksInLists = sqliteTable(
  "bookmarksInLists",
  {
    bookmarkId: text("bookmarkId")
      .notNull()
      .references(() => bookmarks.id, { onDelete: "cascade" }),
    listId: text("listId")
      .notNull()
      .references(() => bookmarkLists.id, { onDelete: "cascade" }),
    addedAt: integer("addedAt", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
  },
  (tb) => ({
    pk: primaryKey({ columns: [tb.bookmarkId, tb.listId] }),
    bookmarkIdIdx: index("bookmarksInLists_bookmarkId_idx").on(tb.bookmarkId),
    listIdIdx: index("bookmarksInLists_listId_idx").on(tb.listId),
  }),
);

// Relations

export const userRelations = relations(users, ({ many }) => ({
  tags: many(bookmarkTags),
  bookmarks: many(bookmarks),
}));

export const bookmarkRelations = relations(bookmarks, ({ many, one }) => ({
  user: one(users, {
    fields: [bookmarks.userId],
    references: [users.id],
  }),
  link: one(bookmarkLinks, {
    fields: [bookmarks.id],
    references: [bookmarkLinks.id],
  }),
  text: one(bookmarkTexts, {
    fields: [bookmarks.id],
    references: [bookmarkTexts.id],
  }),
  asset: one(bookmarkAssets, {
    fields: [bookmarks.id],
    references: [bookmarkAssets.id],
  }),
  tagsOnBookmarks: many(tagsOnBookmarks),
  bookmarksInLists: many(bookmarksInLists),
}));

export const bookmarkTagsRelations = relations(
  bookmarkTags,
  ({ many, one }) => ({
    user: one(users, {
      fields: [bookmarkTags.userId],
      references: [users.id],
    }),
    tagsOnBookmarks: many(tagsOnBookmarks),
  }),
);

export const tagsOnBookmarksRelations = relations(
  tagsOnBookmarks,
  ({ one }) => ({
    tag: one(bookmarkTags, {
      fields: [tagsOnBookmarks.tagId],
      references: [bookmarkTags.id],
    }),
    bookmark: one(bookmarks, {
      fields: [tagsOnBookmarks.bookmarkId],
      references: [bookmarks.id],
    }),
  }),
);

export const apiKeyRelations = relations(apiKeys, ({ one }) => ({
  user: one(users, {
    fields: [apiKeys.userId],
    references: [users.id],
  }),
}));

export const bookmarkListsRelations = relations(
  bookmarkLists,
  ({ one, many }) => ({
    bookmarksInLists: many(bookmarksInLists),
    user: one(users, {
      fields: [bookmarkLists.userId],
      references: [users.id],
    }),
    parent: one(bookmarkLists, {
      fields: [bookmarkLists.parentId],
      references: [bookmarkLists.id],
    }),
  }),
);

export const bookmarksInListsRelations = relations(
  bookmarksInLists,
  ({ one }) => ({
    bookmark: one(bookmarks, {
      fields: [bookmarksInLists.bookmarkId],
      references: [bookmarks.id],
    }),
    list: one(bookmarkLists, {
      fields: [bookmarksInLists.listId],
      references: [bookmarkLists.id],
    }),
  }),
);
