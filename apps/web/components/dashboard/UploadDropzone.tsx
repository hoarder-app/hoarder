"use client";

import React, { useState } from "react";
import { api } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import DropZone from "react-dropzone";

import {
  zUploadErrorSchema,
  zUploadResponseSchema,
} from "@hoarder/trpc/types/uploads";

import LoadingSpinner from "../ui/spinner";
import { toast } from "../ui/use-toast";

export default function UploadDropzone({
  children,
}: {
  children: React.ReactNode;
}) {
  const invalidateAllBookmarks =
    api.useUtils().bookmarks.getBookmarks.invalidate;

  const { mutate: createBookmark, isPending: isCreating } =
    api.bookmarks.createBookmark.useMutation({
      onSuccess: () => {
        toast({ description: "Bookmark uploaded" });
        invalidateAllBookmarks();
      },
      onError: () => {
        toast({ description: "Something went wrong", variant: "destructive" });
      },
    });

  const { mutate: uploadAsset, isPending: isUploading } = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("image", file);
      const resp = await fetch("/api/assets", {
        method: "POST",
        body: formData,
      });
      if (!resp.ok) {
        throw new Error(await resp.text());
      }
      return zUploadResponseSchema.parse(await resp.json());
    },
    onSuccess: async (resp) => {
      const assetId = resp.assetId;
      createBookmark({ type: "asset", assetId, assetType: "image" });
    },
    onError: (error) => {
      const err = zUploadErrorSchema.parse(JSON.parse(error.message));
      toast({ description: err.error, variant: "destructive" });
    },
  });

  const [isDragging, setDragging] = useState(false);
  const onDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    setDragging(false);
    uploadAsset(file);
  };

  return (
    <DropZone
      multiple={false}
      noClick
      onDrop={onDrop}
      onDragEnter={() => setDragging(true)}
      onDragLeave={() => setDragging(false)}
    >
      {({ getRootProps, getInputProps }) => (
        <div {...getRootProps()}>
          <input {...getInputProps()} hidden />
          <div
            className={cn(
              "fixed inset-0 flex h-full w-full items-center justify-center bg-gray-200 opacity-90",
              isDragging || isUploading || isCreating ? undefined : "hidden",
            )}
          >
            {isUploading || isCreating ? (
              <div className="flex items-center justify-center gap-2">
                <p className="text-2xl font-bold text-gray-700">Uploading</p>
                <LoadingSpinner />
              </div>
            ) : (
              <p className="text-2xl font-bold text-gray-700">
                Drop Your Image
              </p>
            )}
          </div>
          {children}
        </div>
      )}
    </DropZone>
  );
}
