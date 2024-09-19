import { NextRequest, NextResponse } from "next/server";

export const GET = async (_req: NextRequest) => {
  return NextResponse.json({
    status: "ok",
    message: "Web app is working",
  });
};
