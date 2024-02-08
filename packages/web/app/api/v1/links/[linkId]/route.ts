import { authOptions } from "@/lib/auth";
import { unbookmarkLink } from "@/lib/services/links";
import { Prisma } from "@remember/db";

import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { linkId: string } },
) {
  // TODO: We probably should be using an API key here instead of the session;
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response(null, { status: 401 });
  }

  try {
    await unbookmarkLink(params.linkId, session.user.id);
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
