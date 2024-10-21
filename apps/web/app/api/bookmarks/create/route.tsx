import { redirect } from "next/navigation";
import { api, createContextFromRequest } from "@/server/api/client";
import { TRPCError } from "@trpc/server";

import { BookmarkTypes } from "@hoarder/shared/types/bookmarks";
import { ZUploadResponse } from "@hoarder/shared/types/uploads";

import { POST as apiUploadAssets } from "../../assets/route";

export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  const ctx = await createContextFromRequest(request);
  if (!ctx.user) {
    redirect("/signin");
  }

  try {
    const uploadResponse = await apiUploadAssets(request.clone());

    if (!uploadResponse.ok) {
      throw uploadResponse;
    }

    const assets = (await uploadResponse.json()) as ZUploadResponse;

    const promises = assets.map(
      async (asset) =>
        await api.bookmarks.createBookmark({
          ...asset,
          type: BookmarkTypes.ASSET,
          assetType: asset.contentType === "application/pdf" ? "pdf" : "image",
        }),
    );

    await Promise.all(promises);
  } catch (err) {
    let error = "Unknown error";

    if (err instanceof Response) {
      const data = (await err.json()) as unknown;

      error =
        typeof data === "object" &&
        data !== null &&
        "message" in data &&
        typeof data.message === "string"
          ? data.message
          : error;
    }
    if (err instanceof TRPCError) {
      error = err.message ?? error;
    }

    const params = new URLSearchParams({ error });
    redirect("/dashboard/bookmarks?" + params.toString());
  }

  const formData = await request.formData();
  const text = formData.get("text");

  if (typeof text === "string") {
    await api.bookmarks.createBookmark({ type: BookmarkTypes.TEXT, text });
  }

  redirect("/dashboard/bookmarks");
}
