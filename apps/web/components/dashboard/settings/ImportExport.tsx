"use client";

import assert from "assert";
import { useRouter } from "next/navigation";
import FilePickerButton from "@/components/ui/file-picker-button";
import { toast } from "@/components/ui/use-toast";
import { parseNetscapeBookmarkFile } from "@/lib/netscapeBookmarkParser";
import { useMutation } from "@tanstack/react-query";
import { Upload } from "lucide-react";

import { useCreateBookmarkWithPostHook } from "@hoarder/shared-react/hooks/bookmarks";
import {
  useAddBookmarkToList,
  useCreateBookmarkList,
} from "@hoarder/shared-react/hooks/lists";
import { BookmarkTypes } from "@hoarder/shared/types/bookmarks";

export function Import() {
  const router = useRouter();
  const { mutateAsync: createBookmark } = useCreateBookmarkWithPostHook();

  const { mutateAsync: createList } = useCreateBookmarkList();
  const { mutateAsync: addToList } = useAddBookmarkToList();

  const { mutateAsync: runUploadBookmarkFile } = useMutation({
    mutationFn: async (file: File) => {
      return await parseNetscapeBookmarkFile(file);
    },
    onSuccess: async (resp) => {
      const results = await Promise.allSettled(
        resp.map((url) =>
          createBookmark({ type: BookmarkTypes.LINK, url: url.toString() }),
        ),
      );

      const failed = results.filter((r) => r.status == "rejected");
      const successes = results.filter(
        (r) => r.status == "fulfilled" && !r.value.alreadyExists,
      );
      const alreadyExisted = results.filter(
        (r) => r.status == "fulfilled" && r.value.alreadyExists,
      );

      if (successes.length > 0 || alreadyExisted.length > 0) {
        toast({
          description: `Imported ${successes.length} bookmarks and skipped ${alreadyExisted.length} bookmarks that already existed`,
          variant: "default",
        });
      }

      if (failed.length > 0) {
        toast({
          description: `Failed to import ${failed.length} bookmarks`,
          variant: "destructive",
        });
      }

      const importList = await createList({
        name: `Imported Bookmarks`,
        icon: "⬆️",
      });

      if (successes.length > 0) {
        await Promise.allSettled(
          successes.map((r) => {
            assert(r.status == "fulfilled");
            addToList({ bookmarkId: r.value.id, listId: importList.id });
          }),
        );
      }

      router.push(`/dashboard/lists/${importList.id}`);
    },
    onError: (error) => {
      toast({
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div>
      <FilePickerButton
        accept=".html"
        multiple={false}
        className="flex items-center gap-2"
        onFileSelect={runUploadBookmarkFile}
      >
        <Upload />
        <p>Import Bookmarks from HTML file</p>
      </FilePickerButton>
    </div>
  );
}

export default function ImportExport() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="mb-4 text-lg font-medium">Import Bookmarks</div>
      </div>
      <div className="mt-2">
        <Import />
      </div>
    </div>
  );
}
