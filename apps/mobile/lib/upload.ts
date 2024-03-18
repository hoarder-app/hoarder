import { useMutation } from "@tanstack/react-query";

import type { Settings } from "./settings";
import { api } from "./trpc";
import type { ZBookmark } from "@hoarder/trpc/types/bookmarks";

export function useUploadAsset(
  settings: Settings,
  options: { onSuccess?: (bookmark: ZBookmark) => void; onError?: (e: string) => void },
) {
  const invalidateAllBookmarks =
    api.useUtils().bookmarks.getBookmarks.invalidate;

  const {
    mutate: createBookmark,
    isPending: isCreatingBookmark,
  } = api.bookmarks.createBookmark.useMutation({
    onSuccess: (d) => {
      invalidateAllBookmarks();
      if (options.onSuccess) {
        options.onSuccess(d);
      }
    },
    onError: (e) => {
      if (options.onError) {
        options.onError(e.message);
      }
    },
  });

  const {
    mutate: uploadAsset,
    isPending: isUploading,
  } = useMutation({
    mutationFn: async (file: { type: string; name: string; uri: string }) => {
      const formData = new FormData();
      formData.append("image", {
        uri: file.uri,
        name: file.name,
        type: file.type,
      });
      const resp = await fetch(`${settings.address}/api/assets`, {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${settings.apiKey}`,
        },
      });
      if (!resp.ok) {
        throw new Error(await resp.text());
      }
      return await resp.json();
    },
    onSuccess: (resp) => {
      const assetId = resp.assetId;
      createBookmark({ type: "asset", assetId, assetType: "image" });
    },
    onError: (e) => {
      if (options.onError) {
        options.onError(e.message);
      }
    },
  });

  return {
    uploadAsset,
    isPending: isUploading || isCreatingBookmark,
  };
}
