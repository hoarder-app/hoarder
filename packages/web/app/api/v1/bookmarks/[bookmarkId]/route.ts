import { authOptions } from "@/lib/auth";
import { deleteBookmark } from "@/lib/services/bookmarks";
import { Prisma } from "@remember/db";

import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

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

  return new Response(null, { status: 201 });
}
