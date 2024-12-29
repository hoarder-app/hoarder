import {
  extendZodWithOpenApi,
  OpenAPIRegistry,
} from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import {
  zGetTagResponseSchema,
  zUpdateTagRequestSchema,
} from "@hoarder/shared/types/tags";

import { BearerAuth } from "./common";
import { PaginatedBookmarksSchema, PaginationSchema } from "./pagination";

export const registry = new OpenAPIRegistry();
extendZodWithOpenApi(z);

export const TagSchema = zGetTagResponseSchema.openapi("Tag");

export const TagIdSchema = registry.registerParameter(
  "TagId",
  z.string().openapi({
    param: {
      name: "tagId",
      in: "path",
    },
    example: "ieidlxygmwj87oxz5hxttoc8",
  }),
);

registry.registerPath({
  method: "get",
  path: "/tags",
  description: "Get all tags",
  summary: "Get all tags",
  tags: ["Tags"],
  security: [{ [BearerAuth.name]: [] }],
  request: {},
  responses: {
    200: {
      description: "Object with all tags data.",
      content: {
        "application/json": {
          schema: z.object({
            tags: z.array(TagSchema),
          }),
        },
      },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/tags/{tagId}",
  description: "Get tag by its id",
  summary: "Get a single tag",
  tags: ["Tags"],
  security: [{ [BearerAuth.name]: [] }],
  request: {
    params: z.object({ tagId: TagIdSchema }),
  },
  responses: {
    200: {
      description: "Object with list data.",
      content: {
        "application/json": {
          schema: TagSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: "delete",
  path: "/tags/{tagId}",
  description: "Delete tag by its id",
  summary: "Delete a tag",
  tags: ["Tags"],
  security: [{ [BearerAuth.name]: [] }],
  request: {
    params: z.object({ tagId: TagIdSchema }),
  },
  responses: {
    204: {
      description: "No content - the bookmark was deleted",
    },
  },
});

registry.registerPath({
  method: "patch",
  path: "/tags/{tagId}",
  description: "Update tag by its id",
  summary: "Update a tag",
  tags: ["Tags"],
  security: [{ [BearerAuth.name]: [] }],
  request: {
    params: z.object({ tagId: TagIdSchema }),
    body: {
      description:
        "The data to update. Only the fields you want to update need to be provided.",
      content: {
        "application/json": {
          schema: zUpdateTagRequestSchema.omit({ tagId: true }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "The updated tag",
      content: {
        "application/json": {
          schema: TagSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/tags/{tagId}/bookmarks",
  description: "Get the bookmarks with the tag",
  summary: "Get a bookmarks with the tag",
  tags: ["Tags"],
  security: [{ [BearerAuth.name]: [] }],
  request: {
    params: z.object({ tagId: TagIdSchema }),
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
