import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

interface NewLinkRequest {
    url: string,
}

export async function POST(request: NextRequest) {
    // TODO: We probably should be using an API key here instead of the session;
    const session = await getServerSession(authOptions);
    if (!session) {
        return new Response(null, { status: 401 });
    }

    // TODO: We need proper type assertion here
    const body: NewLinkRequest = await request.json();

    const link = await prisma.bookmarkedLink.create({
        data: {
            url: body.url,
            userId: session.user.id,
        }
    })

    return NextResponse.json(link, { status: 201 });
}

export async function GET() {
    // TODO: We probably should be using an API key here instead of the session;
    const session = await getServerSession(authOptions);
    if (!session) {
        return new Response(null, { status: 401 });
    }
    const links = await prisma.bookmarkedLink.findMany({
        where: {
            userId: session.user.id,
        },
        include: {
            details: {
                select: {
                    title: true,
                    description: true,
                    imageUrl: true,
                }
            },
        }
    })

    return NextResponse.json({links});
}
