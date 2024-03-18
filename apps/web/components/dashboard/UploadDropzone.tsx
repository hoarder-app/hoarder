"use client";

import React, { useState } from "react";
import { api } from "@/lib/trpc";
import { useMutation } from "@tanstack/react-query";
import DropZone from "react-dropzone";

import {
  zUploadErrorSchema,
  zUploadResponseSchema,
} from "@hoarder/trpc/types/uploads";

import { toast } from "../ui/use-toast";

export default function UploadDropzone({
  children,
}: {
  children: React.ReactNode;
}) {
  const invalidateAllBookmarks =
    api.useUtils().bookmarks.getBookmarks.invalidate;

  const { mutate: createBookmark } = api.bookmarks.createBookmark.useMutation({
    onSuccess: () => {
      toast({ description: "Bookmark uploaded" });
      invalidateAllBookmarks();
    },
    onError: () => {
      toast({ description: "Something went wrong", variant: "destructive" });
    },
  });

  const { mutate: uploadAsset } = useMutation({
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

  const [_isDragging, setDragging] = useState(false);
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
          {children}
        </div>
      )}
    </DropZone>
  );
}
