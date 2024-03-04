"use client";

import { useToast } from "@/components/ui/use-toast";
import { api } from "@/lib/trpc";
import { ZBookmark, ZBookmarkedLink } from "@/lib/types/api/bookmarks";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Archive,
  Link,
  List,
  MoreHorizontal,
  Pencil,
  RotateCw,
  Star,
  Tags,
  Trash2,
} from "lucide-react";
import { useTagModel } from "./TagModal";
import { useState } from "react";
import { BookmarkedTextEditor } from "./BookmarkedTextEditor";
import { useAddToListModal } from "./AddToListModal";

export default function BookmarkOptions({ bookmark }: { bookmark: ZBookmark }) {
  const { toast } = useToast();
  const linkId = bookmark.id;

  const {setOpen: setTagModalIsOpen, content: tagModal} = useTagModel(bookmark);
  const {setOpen: setAddToListModalOpen, content: addToListModal} = useAddToListModal(
    bookmark.id,
  );

  const [isTextEditorOpen, setTextEditorOpen] = useState(false);

  const invalidateBookmarksCache = api.useUtils().bookmarks.getBookmarks.invalidate;

  const onError = () => {
    toast({
      variant: "destructive",
      title: "Something went wrong",
      description: "There was a problem with your request.",
    });
  };
  const onSettled = () => {
    invalidateBookmarksCache();
  };
  const deleteBookmarkMutator = api.bookmarks.deleteBookmark.useMutation({
    onSuccess: () => {
      toast({
        description: "The bookmark has been deleted!",
      });
    },
    onError,
    onSettled,
  });

  const updateBookmarkMutator = api.bookmarks.updateBookmark.useMutation({
    onSuccess: () => {
      toast({
        description: "The bookmark has been updated!",
      });
    },
    onError,
    onSettled,
  });

  const crawlBookmarkMutator = api.bookmarks.recrawlBookmark.useMutation({
    onSuccess: () => {
      toast({
        description: "Re-fetch has been enqueued!",
      });
    },
    onError,
    onSettled,
  });

  return (
    <>
      {tagModal}
      {addToListModal}
      <BookmarkedTextEditor
        bookmark={bookmark}
        open={isTextEditorOpen}
        setOpen={setTextEditorOpen}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="px-1 focus-visible:ring-0 focus-visible:ring-offset-0"
          >
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-fit">
          {bookmark.content.type === "text" && (
            <DropdownMenuItem onClick={() => setTextEditorOpen(true)}>
              <Pencil className="mr-2 size-4" />
              <span>Edit</span>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={() =>
              updateBookmarkMutator.mutate({
                bookmarkId: linkId,
                favourited: !bookmark.favourited,
              })
            }
          >
            <Star className="mr-2 size-4" />
            <span>{bookmark.favourited ? "Un-favourite" : "Favourite"}</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              updateBookmarkMutator.mutate({
                bookmarkId: linkId,
                archived: !bookmark.archived,
              })
            }
          >
            <Archive className="mr-2 size-4" />
            <span>{bookmark.archived ? "Un-archive" : "Archive"}</span>
          </DropdownMenuItem>
          {bookmark.content.type === "link" && (
            <DropdownMenuItem
              onClick={() => {
                navigator.clipboard.writeText(
                  (bookmark.content as ZBookmarkedLink).url,
                );
                toast({
                  description: "Link was added to your clipboard!",
                });
              }}
            >
              <Link className="mr-2 size-4" />
              <span>Copy Link</span>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => setTagModalIsOpen(true)}>
            <Tags className="mr-2 size-4" />
            <span>Edit Tags</span>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => setAddToListModalOpen(true)}>
            <List className="mr-2 size-4" />
            <span>Add to List</span>
          </DropdownMenuItem>

          {bookmark.content.type === "link" && (
            <DropdownMenuItem
              onClick={() =>
                crawlBookmarkMutator.mutate({ bookmarkId: bookmark.id })
              }
            >
              <RotateCw className="mr-2 size-4" />
              <span>Refresh</span>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            className="text-destructive"
            onClick={() =>
              deleteBookmarkMutator.mutate({ bookmarkId: bookmark.id })
            }
          >
            <Trash2 className="mr-2 size-4" />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
