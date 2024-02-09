import { authOptions } from "@/lib/auth";
import { deleteBookmark, updateBookmark } from "@/lib/services/bookmarks";
import { ZBookmark, zUpdateBookmarksRequestSchema } from "@/lib/types/api/bookmarks";
import { Prisma } from "@remember/db";

import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { bookmarkId: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response(null, { status: 401 });
  }

  const updateJson = await request.json();
  const update = zUpdateBookmarksRequestSchema.safeParse(updateJson);
  if (!update.success) {
    return new Response(null, { status: 400 });
  }

  try {
    const bookmark: ZBookmark = await updateBookmark(
      params.bookmarkId,
      session.user.id,
      update.data,
    );
    return NextResponse.json(bookmark);
  } catch (e: unknown) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2025" // RecordNotFound
    ) {
      return new Response(null, { status: 404 });
    } else {
      throw e;
    }
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { bookmarkId: string } },
) {
  // TODO: We probably should be using an API key here instead of the session;
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response(null, { status: 401 });
  }

  try {
    await deleteBookmark(params.bookmarkId, session.user.id);
  } catch (e: unknown) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2025" // RecordNotFound
    ) {
      return new Response(null, { status: 404 });
    } else {
      throw e;
    }
  }

  return new Response(null, { status: 204 });
}
