import { NextRequest, NextResponse } from "next/server";

export const GET = async (_req: NextRequest) => {
  const webAppStatus = { status: "ok", message: "Web app is working" };

  return NextResponse.json({
    webApp: webAppStatus,
  });
};