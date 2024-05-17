"use client";

import React, { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { TRPCClientError } from "@trpc/client";
import { ExternalLink } from "lucide-react";
import DropZone from "react-dropzone";

import { useCreateBookmarkWithPostHook } from "@hoarder/shared-react/hooks/bookmarks";
import {
  zUploadErrorSchema,
  zUploadResponseSchema,
} from "@hoarder/shared/types/uploads";

import LoadingSpinner from "../ui/spinner";
import { toast } from "../ui/use-toast";

function useUploadAsset({ onComplete }: { onComplete: () => void }) {
  const { mutateAsync: createBookmark } = useCreateBookmarkWithPostHook({
    onSuccess: () => {
      toast({ description: "Bookmark uploaded" });
      onComplete();
    },
    onError: () => {
      toast({ description: "Something went wrong", variant: "destructive" });
    },
  });

  const { mutateAsync: runUpload } = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
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
      const assetType =
        resp.contentType === "application/pdf" ? "pdf" : "image";
      return createBookmark({ ...resp, type: "asset", assetType });
    },
    onError: (error, req) => {
      const err = zUploadErrorSchema.parse(JSON.parse(error.message));
      toast({
        description: `${req.name}: ${err.error}`,
        variant: "destructive",
      });
    },
  });

  return runUpload;
}

function useUploadAssets({
  onFileUpload,
  onFileError,
  onAllUploaded,
  addBookmark,
}: {
  onFileUpload: () => void;
  onFileError: (name: string, e: Error) => void;
  onAllUploaded: () => void;
  addBookmark: (bookmark: { type: "link"; url: string }) => void;
}) {
  const runUpload = useUploadAsset({ onComplete: onFileUpload });

  return async (files: File[]) => {
    if (files.length == 0) {
      return;
    }
    for (const file of files) {
      try {
        if (file.type === "text/html") {
          await handleBookmarkFile(file, addBookmark);
        } else {
          await runUpload(file);
        }
      } catch (e) {
        if (e instanceof TRPCClientError || e instanceof Error) {
          onFileError(file.name, e);
        }
      }
    }
    onAllUploaded();
  };
}

async function handleBookmarkFile(
  file: File,
  addBookmark: (bookmark: { type: "link"; url: string }) => void,
): Promise<void> {
  const textContent = Buffer.from(await file.arrayBuffer()).toString();
  if (!textContent.startsWith("<!DOCTYPE NETSCAPE-Bookmark-file-1>")) {
    toast({
      description:
        "The uploaded html file does not appear to be a bookmark file",
      variant: "destructive",
    });
    throw Error("The uploaded html file does not seem to be a bookmark file");
  }

  const extractedUrls = extractUrls(textContent);

  for (const extractedUrl of extractedUrls) {
    const url = new URL(extractedUrl);
    addBookmark({ type: "link", url: url.toString() });
  }
}

function extractUrls(html: string): string[] {
  const regex = /<a\s+(?:[^>]*?\s+)?href="(http[^"]*)"/gi;
  let match;
  const urls = [];

  while ((match = regex.exec(html)) !== null) {
    urls.push(match[1]);
  }

  return urls;
}

export default function UploadDropzone({
  children,
}: {
  children: React.ReactNode;
}) {
  const { mutate: addBookmark } = useCreateBookmarkWithPostHook({
    onSuccess: (resp) => {
      if (resp.alreadyExists) {
        toast({
          description: (
            <div className="flex items-center gap-1">
              Bookmark already exists.
              <Link
                className="flex underline-offset-4 hover:underline"
                href={`/dashboard/preview/${resp.id}`}
              >
                Open <ExternalLink className="ml-1 size-4" />
              </Link>
            </div>
          ),
          variant: "default",
        });
      } else {
        toast({ description: "Bookmark uploaded" });
      }
    },
    onError: () => {
      toast({ description: "Something went wrong", variant: "destructive" });
    },
  });

  const [numUploading, setNumUploading] = useState(0);
  const [numUploaded, setNumUploaded] = useState(0);
  const uploadAssets = useUploadAssets({
    onFileUpload: () => {
      setNumUploaded((c) => c + 1);
    },
    onFileError: () => {
      setNumUploaded((c) => c + 1);
    },
    onAllUploaded: () => {
      setNumUploading(0);
      setNumUploaded(0);
      return;
    },
    addBookmark: addBookmark,
  });

  const [isDragging, setDragging] = useState(false);
  const onDrop = (acceptedFiles: File[]) => {
    uploadAssets(acceptedFiles);
    setNumUploading(acceptedFiles.length);
    setDragging(false);
  };

  return (
    <DropZone
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
              "fixed inset-0 z-50 flex h-full w-full items-center justify-center bg-gray-200 opacity-90",
              isDragging || numUploading > 0 ? undefined : "hidden",
            )}
          >
            {numUploading > 0 ? (
              <div className="flex items-center justify-center gap-2">
                <p className="text-2xl font-bold text-gray-700">
                  Uploading {numUploaded} / {numUploading}
                </p>
                <LoadingSpinner />
              </div>
            ) : (
              <p className="text-2xl font-bold text-gray-700">
                Drop Your Image / Bookmark file
              </p>
            )}
          </div>
          {children}
        </div>
      )}
    </DropZone>
  );
}
