"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { useClientConfig } from "@/lib/clientConfig";
import {
  FileDown,
  Link,
  List,
  ListX,
  MoreHorizontal,
  Pencil,
  RotateCw,
  Tags,
  Trash2,
} from "lucide-react";

import type {
  ZBookmark,
  ZBookmarkedLink,
} from "@hoarder/shared/types/bookmarks";
import {
  useDeleteBookmark,
  useRecrawlBookmark,
  useUpdateBookmark,
} from "@hoarder/shared-react/hooks//bookmarks";
import { useRemoveBookmarkFromList } from "@hoarder/shared-react/hooks//lists";
import { useBookmarkGridContext } from "@hoarder/shared-react/hooks/bookmark-grid-context";
import { BookmarkTypes } from "@hoarder/shared/types/bookmarks";

import { BookmarkedTextEditor } from "./BookmarkedTextEditor";
import { ArchivedActionIcon, FavouritedActionIcon } from "./icons";
import { useManageListsModal } from "./ManageListsModal";
import { useTagModel } from "./TagModal";

export default function BookmarkOptions({ bookmark }: { bookmark: ZBookmark }) {
  const { toast } = useToast();
  const linkId = bookmark.id;

  const demoMode = !!useClientConfig().demoMode;

  const { setOpen: setTagModalIsOpen, content: tagModal } =
    useTagModel(bookmark);
  const { setOpen: setManageListsModalOpen, content: manageListsModal } =
    useManageListsModal(bookmark.id);

  const [isTextEditorOpen, setTextEditorOpen] = useState(false);

  const { listId } = useBookmarkGridContext() ?? {};

  const onError = () => {
    toast({
      variant: "destructive",
      title: "Something went wrong",
      description: "There was a problem with your request.",
    });
  };
  const deleteBookmarkMutator = useDeleteBookmark({
    onSuccess: () => {
      toast({
        description: "The bookmark has been deleted!",
      });
    },
    onError,
  });

  const updateBookmarkMutator = useUpdateBookmark({
    onSuccess: () => {
      toast({
        description: "The bookmark has been updated!",
      });
    },
    onError,
  });

  const crawlBookmarkMutator = useRecrawlBookmark({
    onSuccess: () => {
      toast({
        description: "Re-fetch has been enqueued!",
      });
    },
    onError,
  });

  const fullPageArchiveBookmarkMutator = useRecrawlBookmark({
    onSuccess: () => {
      toast({
        description: "Full Page Archive creation has been triggered",
      });
    },
    onError,
  });

  const removeFromListMutator = useRemoveBookmarkFromList({
    onSuccess: () => {
      toast({
        description: "The bookmark has been deleted from the list",
      });
    },
    onError,
  });

  return (
    <>
      {tagModal}
      {manageListsModal}
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
          {bookmark.content.type === BookmarkTypes.TEXT && (
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
            <FavouritedActionIcon
              className="mr-2 size-4"
              favourited={bookmark.favourited}
            />
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
            <ArchivedActionIcon
              className="mr-2 size-4"
              archived={bookmark.archived}
            />
            <span>{bookmark.archived ? "Un-archive" : "Archive"}</span>
          </DropdownMenuItem>

          {bookmark.content.type === BookmarkTypes.LINK && (
            <DropdownMenuItem
              onClick={() => {
                fullPageArchiveBookmarkMutator.mutate({
                  bookmarkId: bookmark.id,
                  archiveFullPage: true,
                });
              }}
            >
              <FileDown className="mr-2 size-4" />
              <span>Download Full Page Archive</span>
            </DropdownMenuItem>
          )}

          {bookmark.content.type === BookmarkTypes.LINK && (
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

          <DropdownMenuItem onClick={() => setManageListsModalOpen(true)}>
            <List className="mr-2 size-4" />
            <span>Manage Lists</span>
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

          {bookmark.content.type === BookmarkTypes.LINK && (
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
