import {
  extendZodWithOpenApi,
  OpenAPIRegistry,
} from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import {
  zBookmarkListSchema,
  zNewBookmarkListSchema,
} from "@hoarder/shared/types/lists";

import { BookmarkIdSchema } from "./bookmarks";
import { BearerAuth } from "./common";
import { PaginatedBookmarksSchema, PaginationSchema } from "./pagination";

export const registry = new OpenAPIRegistry();
extendZodWithOpenApi(z);

export const ListIdSchema = registry.registerParameter(
  "ListId",
  z.string().openapi({
    param: {
      name: "listId",
      in: "path",
    },
    example: "ieidlxygmwj87oxz5hxttoc8",
  }),
);

export const ListSchema = zBookmarkListSchema.openapi("List");

registry.registerPath({
  method: "get",
  path: "/lists",
  description: "Get all lists",
  summary: "Get all lists",
  tags: ["Lists"],
  security: [{ [BearerAuth.name]: [] }],
  request: {},
  responses: {
    200: {
      description: "Object with all lists data.",
      content: {
        "application/json": {
          schema: z.object({
            lists: z.array(ListSchema),
          }),
        },
      },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/lists",
  description: "Create a new list",
  summary: "Create a new list",
  tags: ["Lists"],
  security: [{ [BearerAuth.name]: [] }],
  request: {
    body: {
      description: "The list to create",
      content: {
        "application/json": {
          schema: zNewBookmarkListSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "The created list",
      content: {
        "application/json": {
          schema: ListSchema,
        },
      },
    },
  },
});
registry.registerPath({
  method: "get",
  path: "/lists/{listId}",
  description: "Get list by its id",
  summary: "Get a single list",
  tags: ["Lists"],
  security: [{ [BearerAuth.name]: [] }],
  request: {
    params: z.object({ listId: ListIdSchema }),
  },
  responses: {
    200: {
      description: "Object with list data.",
      content: {
        "application/json": {
          schema: ListSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: "delete",
  path: "/lists/{listId}",
  description: "Delete list by its id",
  summary: "Delete a list",
  tags: ["Lists"],
  security: [{ [BearerAuth.name]: [] }],
  request: {
    params: z.object({ listId: ListIdSchema }),
  },
  responses: {
    204: {
      description: "No content - the bookmark was deleted",
    },
  },
});

registry.registerPath({
  method: "patch",
  path: "/list/{listId}",
  description: "Update list by its id",
  summary: "Update a list",
  tags: ["Lists"],
  security: [{ [BearerAuth.name]: [] }],
  request: {
    params: z.object({ listId: ListIdSchema }),
    body: {
      description:
        "The data to update. Only the fields you want to update need to be provided.",
      content: {
        "application/json": {
          schema: zNewBookmarkListSchema.partial(),
        },
      },
    },
  },
  responses: {
    200: {
      description: "The updated list",
      content: {
        "application/json": {
          schema: ListSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/lists/{listId}/bookmarks",
  description: "Get the bookmarks in a list",
  summary: "Get a bookmarks in a list",
  tags: ["Lists"],
  security: [{ [BearerAuth.name]: [] }],
  request: {
    params: z.object({ listId: ListIdSchema }),
    query: PaginationSchema,
  },
  responses: {
    200: {
      description: "Object with list data.",
      content: {
        "application/json": {
          schema: PaginatedBookmarksSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: "put",
  path: "/lists/{listId}/bookmarks/{bookmarkId}",
  description: "Add the bookmarks to a list",
  summary: "Add a bookmark to a list",
  tags: ["Lists"],
  security: [{ [BearerAuth.name]: [] }],
  request: {
    params: z.object({ listId: ListIdSchema, bookmarkId: BookmarkIdSchema }),
  },
  responses: {
    204: {
      description: "No content - the bookmark was added",
    },
  },
});

registry.registerPath({
  method: "delete",
  path: "/lists/{listId}/bookmarks/{bookmarkId}",
  description: "Remove the bookmarks from a list",
  summary: "Remove a bookmark from a list",
  tags: ["Lists"],
  security: [{ [BearerAuth.name]: [] }],
  request: {
    params: z.object({ listId: ListIdSchema, bookmarkId: BookmarkIdSchema }),
  },
  responses: {
    204: {
      description: "No content - the bookmark was added",
    },
  },
});
