import { useMutation } from "@tanstack/react-query";

import { BookmarkTypes, ZBookmark } from "@hoarder/shared/types/bookmarks";
import {
  zUploadErrorSchema,
  zUploadResponseSchema,
} from "@hoarder/shared/types/uploads";

import type { Settings } from "./settings";
import { api } from "./trpc";

export function useUploadAsset(
  settings: Settings,
  options: {
    onSuccess?: (bookmark: ZBookmark & { alreadyExists: boolean }) => void;
    onError?: (e: string) => void;
  },
) {
  const invalidateAllBookmarks =
    api.useUtils().bookmarks.getBookmarks.invalidate;

  const { mutate: createBookmark, isPending: isCreatingBookmark } =
    api.bookmarks.createBookmark.useMutation({
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

  const { mutate: uploadAsset, isPending: isUploading } = useMutation({
    mutationFn: async (file: { type: string; name: string; uri: string }) => {
      const formData = new FormData();
      // @ts-expect-error This is a valid api in react native
      formData.append("file", {
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
      return zUploadResponseSchema.parse(await resp.json());
    },
    onSuccess: (resp) => {
      const assetId = resp.assetId;
      const assetType =
        resp.contentType === "application/pdf" ? "pdf" : "image";
      createBookmark({ type: BookmarkTypes.ASSET, assetId, assetType });
    },
    onError: (e) => {
      if (options.onError) {
        const err = zUploadErrorSchema.parse(JSON.parse(e.message));
        options.onError(err.error);
      }
    },
  });

  return {
    uploadAsset,
    isPending: isUploading || isCreatingBookmark,
  };
}
