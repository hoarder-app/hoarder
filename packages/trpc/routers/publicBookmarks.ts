import { z } from "zod";

import {
  MAX_NUM_BOOKMARKS_PER_PAGE,
  zPublicBookmarkSchema,
  zSortOrder,
} from "@karakeep/shared/types/bookmarks";
import { zBookmarkListSchema } from "@karakeep/shared/types/lists";
import { zCursorV2 } from "@karakeep/shared/types/pagination";

import { publicProcedure, router } from "../index";
import { List } from "../models/lists";

export const publicBookmarks = router({
  getPublicBookmarksInList: publicProcedure
    .input(
      z.object({
        listId: z.string(),
        cursor: zCursorV2.nullish(),
        limit: z.number().max(MAX_NUM_BOOKMARKS_PER_PAGE).default(20),
        sortOrder: zSortOrder.exclude(["relevance"]).optional().default("desc"),
      }),
    )
    .output(
      z.object({
        list: zBookmarkListSchema
          .pick({
            name: true,
            description: true,
            icon: true,
          })
          .merge(z.object({ numItems: z.number() })),
        bookmarks: z.array(zPublicBookmarkSchema),
        nextCursor: zCursorV2.nullable(),
      }),
    )
    .query(async ({ input, ctx }) => {
      return await List.getPublicListContents(
        ctx,
        input.listId,
        /* token */ null,
        {
          limit: input.limit,
          order: input.sortOrder,
          cursor: input.cursor,
        },
      );
    }),
});
