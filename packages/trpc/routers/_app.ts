import { router } from "../index";
import { adminAppRouter } from "./admin";
import { apiKeysAppRouter } from "./apiKeys";
import { bookmarksAppRouter } from "./bookmarks";
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
});
// export type definition of API
export type AppRouter = typeof appRouter;
