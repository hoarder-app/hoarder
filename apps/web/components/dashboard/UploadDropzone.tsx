"use client";

import React, { useState } from "react";
import { api } from "@/lib/trpc";
import { useMutation } from "@tanstack/react-query";
import DropZone from "react-dropzone";

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
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append("image", file);
      return fetch("/api/assets", {
        method: "POST",
        body: formData,
      });
    },
    onSuccess: async (x) => {
      const resp = await x.json();
      const assetId = resp.assetId;
      createBookmark({ type: "asset", assetId, assetType: "image" });
    },
    onError: (x) => {
      toast({ description: JSON.stringify(x) });
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
          <div hidden={!isDragging}>Dragging</div>
          {children}
        </div>
      )}
    </DropZone>
  );
}
