"use client";

import { useContext, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { useClientConfig } from "@/lib/clientConfig";
import { BookmarkListContext } from "@/lib/hooks/list-context";
import { api } from "@/lib/trpc";
import {
  Archive,
  Link,
  List,
  ListX,
  MoreHorizontal,
  Pencil,
  RotateCw,
  Star,
  Tags,
  Trash2,
} from "lucide-react";

import type { ZBookmark, ZBookmarkedLink } from "@hoarder/trpc/types/bookmarks";

import { useAddToListModal } from "./AddToListModal";
import { BookmarkedTextEditor } from "./BookmarkedTextEditor";
import { useTagModel } from "./TagModal";

export default function BookmarkOptions({ bookmark }: { bookmark: ZBookmark }) {
  const { toast } = useToast();
  const linkId = bookmark.id;

  const demoMode = useClientConfig().demoMode;

  const { setOpen: setTagModalIsOpen, content: tagModal } =
    useTagModel(bookmark);
  const { setOpen: setAddToListModalOpen, content: addToListModal } =
    useAddToListModal(bookmark.id);

  const [isTextEditorOpen, setTextEditorOpen] = useState(false);

  const { listId } = useContext(BookmarkListContext);

  const invalidateAllBookmarksCache =
    api.useUtils().bookmarks.getBookmarks.invalidate;

  const invalidateBookmarkCache =
    api.useUtils().bookmarks.getBookmark.invalidate;

  const onError = () => {
    toast({
      variant: "destructive",
      title: "Something went wrong",
      description: "There was a problem with your request.",
    });
  };
  const deleteBookmarkMutator = api.bookmarks.deleteBookmark.useMutation({
    onSuccess: () => {
      toast({
        description: "The bookmark has been deleted!",
      });
    },
    onError,
    onSettled: () => {
      invalidateAllBookmarksCache();
    },
  });

  const updateBookmarkMutator = api.bookmarks.updateBookmark.useMutation({
    onSuccess: () => {
      toast({
        description: "The bookmark has been updated!",
      });
    },
    onError,
    onSettled: () => {
      invalidateBookmarkCache({ bookmarkId: bookmark.id });
      invalidateAllBookmarksCache();
    },
  });

  const crawlBookmarkMutator = api.bookmarks.recrawlBookmark.useMutation({
    onSuccess: () => {
      toast({
        description: "Re-fetch has been enqueued!",
      });
    },
    onError,
    onSettled: () => {
      invalidateBookmarkCache({ bookmarkId: bookmark.id });
    },
  });

  const removeFromListMutator = api.lists.removeFromList.useMutation({
    onSuccess: (_resp, req) => {
      invalidateAllBookmarksCache({ listId: req.listId });
      toast({
        description: "The bookmark has been deleted from the list",
      });
    },
    onError,
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
            disabled={demoMode}
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
            disabled={demoMode}
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

          {listId && (
            <DropdownMenuItem
              disabled={demoMode}
              onClick={() =>
                removeFromListMutator.mutate({
                  listId,
                  bookmarkId: bookmark.id,
                })
              }
            >
              <ListX className="mr-2 size-4" />
              <span>Remove from List</span>
            </DropdownMenuItem>
          )}

          {bookmark.content.type === "link" && (
            <DropdownMenuItem
              disabled={demoMode}
              onClick={() =>
                crawlBookmarkMutator.mutate({ bookmarkId: bookmark.id })
              }
            >
              <RotateCw className="mr-2 size-4" />
              <span>Refresh</span>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            disabled={demoMode}
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
