import { authOptions } from "@/lib/auth";
import { bookmarkLink, getBookmarks } from "@/lib/services/bookmarks";

import {
  zNewBookmarkRequestSchema,
  ZGetBookmarksResponse,
  ZBookmark,
  zGetBookmarksRequestSchema,
} from "@/lib/types/api/bookmarks";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  // TODO: We probably should be using an API key here instead of the session;
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response(null, { status: 401 });
  }

  const linkRequest = zNewBookmarkRequestSchema.safeParse(await request.json());

  if (!linkRequest.success) {
    return NextResponse.json(
      {
        error: linkRequest.error.toString(),
      },
      { status: 400 },
    );
  }

  const bookmark = await bookmarkLink(linkRequest.data.url, session.user.id);

  const response: ZBookmark = { ...bookmark };
  return NextResponse.json(response, { status: 201 });
}

export async function GET(request: NextRequest) {
  // TODO: We probably should be using an API key here instead of the session;
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response(null, { status: 401 });
  }

  const query = request.nextUrl.searchParams;
  const params = zGetBookmarksRequestSchema.safeParse(query);

  if (!params.success) {
    return new Response(null, { status: 400 });
  }

  const bookmarks = await getBookmarks(session.user.id, params.data);

  const response: ZGetBookmarksResponse = { bookmarks };
  return NextResponse.json(response);
}
