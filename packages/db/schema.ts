import {
  integer,
  sqliteTable,
  text,
  primaryKey,
  unique,
} from "drizzle-orm/sqlite-core";
import type { AdapterAccount } from "@auth/core/adapters";
import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";

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
    name: text("name").notNull().unique(),
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

export const bookmarks = sqliteTable("bookmarks", {
  id: text("id")
    .notNull()
    .primaryKey()
    .$defaultFn(() => createId()),
  createdAt: createdAtField(),
  archived: integer("archived", { mode: "boolean" }).notNull().default(false),
  favourited: integer("favourited", { mode: "boolean" })
    .notNull()
    .default(false),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
});

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
  crawledAt: integer("crawledAt", { mode: "timestamp" }),
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
    attachedBy: text("attachedBy", { enum: ["ai", "human"] }),
  },
  (tb) => ({
    pk: primaryKey({ columns: [tb.bookmarkId, tb.tagId] }),
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
  tagsOnBookmarks: many(tagsOnBookmarks),
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
