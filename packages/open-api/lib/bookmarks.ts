import {
  extendZodWithOpenApi,
  OpenAPIRegistry,
} from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import {
  zBareBookmarkSchema,
  zManipulatedTagSchema,
  zNewBookmarkRequestSchema,
  zUpdateBookmarksRequestSchema,
} from "@hoarder/shared/types/bookmarks";

import { BearerAuth } from "./common";
import {
  BookmarkSchema,
  PaginatedBookmarksSchema,
  PaginationSchema,
} from "./pagination";
import { TagIdSchema } from "./tags";

export const registry = new OpenAPIRegistry();
extendZodWithOpenApi(z);

export const BookmarkIdSchema = registry.registerParameter(
  "BookmarkId",
  z.string().openapi({
    param: {
      name: "bookmarkId",
      in: "path",
    },
    example: "ieidlxygmwj87oxz5hxttoc8",
  }),
);

registry.registerPath({
  method: "get",
  path: "/bookmarks",
  description: "Get all bookmarks",
  summary: "Get all bookmarks",
  security: [{ [BearerAuth.name]: [] }],
  request: {
    query: z
      .object({
        archived: z.boolean().optional(),
        favourited: z.boolean().optional(),
      })
      .merge(PaginationSchema),
  },
  responses: {
    200: {
      description: "Object with all bookmarks data.",
      content: {
        "application/json": {
          schema: PaginatedBookmarksSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/bookmarks",
  description: "Create a new bookmark",
  summary: "Create a new bookmark",
  security: [{ [BearerAuth.name]: [] }],
  request: {
    body: {
      description: "The bookmark to create",
      content: {
        "application/json": {
          schema: zNewBookmarkRequestSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "The created bookmark",
      content: {
        "application/json": {
          schema: BookmarkSchema,
        },
      },
    },
  },
});
registry.registerPath({
  method: "get",
  path: "/bookmarks/{bookmarkId}",
  description: "Get bookmark by its id",
  summary: "Get a single bookmark",
  security: [{ [BearerAuth.name]: [] }],
  request: {
    params: z.object({ bookmarkId: BookmarkIdSchema }),
  },
  responses: {
    200: {
      description: "Object with bookmark data.",
      content: {
        "application/json": {
          schema: BookmarkSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: "delete",
  path: "/bookmarks/{bookmarkId}",
  description: "Delete bookmark by its id",
  summary: "Delete a bookmark",
  security: [{ [BearerAuth.name]: [] }],
  request: {
    params: z.object({ bookmarkId: BookmarkIdSchema }),
  },
  responses: {
    204: {
      description: "No content - the bookmark was deleted",
    },
  },
});

registry.registerPath({
  method: "patch",
  path: "/bookmarks/{bookmarkId}",
  description: "Update bookmark by its id",
  summary: "Update a bookmark",
  security: [{ [BearerAuth.name]: [] }],
  request: {
    params: z.object({ bookmarkId: BookmarkIdSchema }),
    body: {
      description:
        "The data to update. Only the fields you want to update need to be provided.",
      content: {
        "application/json": {
          schema: zUpdateBookmarksRequestSchema.omit({ bookmarkId: true }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "The updated bookmark",
      content: {
        "application/json": {
          schema: zBareBookmarkSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/bookmarks/{bookmarkId}/tags",
  description: "Attach tags to a bookmark",
  summary: "Attach tags to a bookmark",
  security: [{ [BearerAuth.name]: [] }],
  request: {
    params: z.object({ bookmarkId: BookmarkIdSchema }),
    body: {
      description: "The tags to attach.",
      content: {
        "application/json": {
          schema: z.object({ tags: z.array(zManipulatedTagSchema) }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "The list of attached tag ids",
      content: {
        "application/json": {
          schema: z.object({ attached: z.array(TagIdSchema) }),
        },
      },
    },
  },
});

registry.registerPath({
  method: "delete",
  path: "/bookmarks/{bookmarkId}/tags",
  description: "Detach tags from a bookmark",
  summary: "Detach tags from a bookmark",
  security: [{ [BearerAuth.name]: [] }],
  request: {
    params: z.object({ bookmarkId: BookmarkIdSchema }),
    body: {
      description: "The tags to detach.",
      content: {
        "application/json": {
          schema: z.object({ tags: z.array(zManipulatedTagSchema) }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "The list of detached tag ids",
      content: {
        "application/json": {
          schema: z.object({ detached: z.array(TagIdSchema) }),
        },
      },
    },
  },
});
