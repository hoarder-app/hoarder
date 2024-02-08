import { authOptions } from "@/lib/auth";
import { bookmarkLink, getLinks } from "@/lib/services/links";

import {
  zNewBookmarkedLinkRequestSchema,
  ZGetLinksResponse,
  ZBookmarkedLink,
} from "@/lib/types/api/links";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  // TODO: We probably should be using an API key here instead of the session;
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response(null, { status: 401 });
  }

  const linkRequest = zNewBookmarkedLinkRequestSchema.safeParse(
    await request.json(),
  );

  if (!linkRequest.success) {
    return NextResponse.json(
      {
        error: linkRequest.error.toString(),
      },
      { status: 400 },
    );
  }

  const link = await bookmarkLink(linkRequest.data.url, session.user.id);

  let response: ZBookmarkedLink = { ...link };
  return NextResponse.json(response, { status: 201 });
}

export async function GET() {
  // TODO: We probably should be using an API key here instead of the session;
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response(null, { status: 401 });
  }

  const links = await getLinks(session.user.id);

  let response: ZGetLinksResponse = { links };
  return NextResponse.json(response);
}
