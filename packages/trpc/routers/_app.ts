import { router } from "../index";
import { adminAppRouter } from "./admin";
import { apiKeysAppRouter } from "./apiKeys";
import { bookmarksAppRouter } from "./bookmarks";
import { feedsAppRouter } from "./feeds";
import { highlightsAppRouter } from "./highlights";
import { listsAppRouter } from "./lists";
import { promptsAppRouter } from "./prompts";
import { tagsAppRouter } from "./tags";
import { usersAppRouter } from "./users";

export const appRouter = router({
  bookmarks: bookmarksAppRouter,
  apiKeys: apiKeysAppRouter,
  users: usersAppRouter,
  lists: listsAppRouter,
  tags: tagsAppRouter,
  prompts: promptsAppRouter,
  admin: adminAppRouter,
  feeds: feedsAppRouter,
  highlights: highlightsAppRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;
