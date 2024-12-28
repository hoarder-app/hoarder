import { z } from "zod";

export const USER_LOCAL_SETTINGS_COOKIE_NAME = "hoarder-user-local-settings";

const zBookmarkGridLayout = z.enum(["grid", "list", "masonry", "compact"]);
export type BookmarksLayoutTypes = z.infer<typeof zBookmarkGridLayout>;

export const zUserLocalSettings = z.object({
  bookmarkGridLayout: zBookmarkGridLayout.optional().default("masonry"),
  lang: z.string().optional().default("en"),
});

export type UserLocalSettings = z.infer<typeof zUserLocalSettings>;

export function parseUserLocalSettings(str: string | undefined) {
  try {
    return zUserLocalSettings.parse(JSON.parse(str ?? "{}"));
  } catch (e) {
    return undefined;
  }
}

export function defaultUserLocalSettings() {
  return zUserLocalSettings.parse({});
}
