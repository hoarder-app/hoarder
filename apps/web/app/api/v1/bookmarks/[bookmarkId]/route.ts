import { NextRequest } from "next/server";
import { buildHandler } from "@/app/api/v1/utils/handler";

import { zUpdateBookmarksRequestSchema } from "@hoarder/shared/types/bookmarks";

export const dynamic = "force-dynamic";

export const GET = async (req: NextRequest, props: { params: Promise<{ bookmarkId: string }> }) => {
  const params = await props.params;

  return buildHandler({
    req,
    handler: async ({ api }) => {
      const bookmark = await api.bookmarks.getBookmark({
        bookmarkId: params.bookmarkId,
      });
      return { status: 200, resp: bookmark };
    },
  });
};

export const PATCH = async (req: NextRequest, props: { params: Promise<{ bookmarkId: string }> }) => {
  const params = await props.params;

  return buildHandler({
    req,
    bodySchema: zUpdateBookmarksRequestSchema.omit({ bookmarkId: true }),
    handler: async ({ api, body }) => {
      const bookmark = await api.bookmarks.updateBookmark({
        bookmarkId: params.bookmarkId,
        ...body!,
      });
      return { status: 200, resp: bookmark };
    },
  });
};

export const DELETE = async (req: NextRequest, props: { params: Promise<{ bookmarkId: string }> }) => {
  const params = await props.params;

  return buildHandler({
    req,
    handler: async ({ api }) => {
      await api.bookmarks.deleteBookmark({
        bookmarkId: params.bookmarkId,
      });
      return { status: 204 };
    },
  });
};
