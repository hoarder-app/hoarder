import { router } from "../trpc";
import { bookmarksAppRouter } from "./bookmarks";
export const appRouter = router({
  bookmarks: bookmarksAppRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;
