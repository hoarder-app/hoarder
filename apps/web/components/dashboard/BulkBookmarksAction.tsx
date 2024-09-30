"use client";

import React, { useEffect, useState } from "react";
import {
  ActionButton,
  ActionButtonWithTooltip,
} from "@/components/ui/action-button";
import ActionConfirmingDialog from "@/components/ui/action-confirming-dialog";
import { useToast } from "@/components/ui/use-toast";
import useBulkActionsStore from "@/lib/bulkActions";
import {
  CheckCheck,
  FileDown,
  Hash,
  Link,
  List,
  Pencil,
  RotateCw,
  Trash2,
  X,
} from "lucide-react";

import {
  useDeleteBookmark,
  useRecrawlBookmark,
  useUpdateBookmark,
} from "@hoarder/shared-react/hooks/bookmarks";
import { BookmarkTypes } from "@hoarder/shared/types/bookmarks";

import BulkManageListsModal from "./bookmarks/BulkManageListsModal";
import BulkTagModal from "./bookmarks/BulkTagModal";
import { ArchivedActionIcon, FavouritedActionIcon } from "./bookmarks/icons";

export default function BulkBookmarksAction() {
  const { selectedBookmarks, isBulkEditEnabled } = useBulkActionsStore();
  const setIsBulkEditEnabled = useBulkActionsStore(
    (state) => state.setIsBulkEditEnabled,
  );
  const selectAllBookmarks = useBulkActionsStore((state) => state.selectAll);
  const unSelectAllBookmarks = useBulkActionsStore(
    (state) => state.unSelectAll,
  );
  const isEverythingSelected = useBulkActionsStore(
    (state) => state.isEverythingSelected,
  );
  const { toast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [manageListsModal, setManageListsModalOpen] = useState(false);
  const [bulkTagModal, setBulkTagModalOpen] = useState(false);

  useEffect(() => {
    setIsBulkEditEnabled(false); // turn off toggle + clear selected bookmarks on mount
  }, []);

  const onError = () => {
    toast({
      variant: "destructive",
      title: "Something went wrong",
      description: "There was a problem with your request.",
    });
  };

  const deleteBookmarkMutator = useDeleteBookmark({
    onSuccess: () => {
      setIsBulkEditEnabled(false);
    },
    onError,
  });

  const updateBookmarkMutator = useUpdateBookmark({
    onSuccess: () => {
      setIsBulkEditEnabled(false);
    },
    onError,
  });

  const recrawlBookmarkMutator = useRecrawlBookmark({
    onSuccess: () => {
      setIsBulkEditEnabled(false);
    },
    onError,
  });

  interface UpdateBookmarkProps {
    favourited?: boolean;
    archived?: boolean;
  }

  const recrawlBookmarks = async (archiveFullPage: boolean) => {
    const links = selectedBookmarks.filter(
      (item) => item.content.type === BookmarkTypes.LINK,
    );
    await Promise.all(
      links.map((item) =>
        recrawlBookmarkMutator.mutateAsync({
          bookmarkId: item.id,
          archiveFullPage,
        }),
      ),
    );
    toast({
      description: `${links.length} bookmarks will be ${archiveFullPage ? "re-crawled and archived!" : "refreshed!"}`,
    });
  };

  function isClipboardAvailable() {
    if (typeof window === "undefined") {
      return false;
    }
    return window && window.navigator && window.navigator.clipboard;
  }

  const copyLinks = async () => {
    if (!isClipboardAvailable()) {
      toast({
        description: `Copying is only available over https`,
      });
      return;
    }
    const copyString = selectedBookmarks
      .map((item) => {
        return item.content.type === BookmarkTypes.LINK && item.content.url;
      })
      .filter(Boolean)
      .join("\n");

    await navigator.clipboard.writeText(copyString);

    toast({
      description: `Added ${selectedBookmarks.length} bookmark links into the clipboard!`,
    });
  };

  const updateBookmarks = async ({
    favourited,
    archived,
  }: UpdateBookmarkProps) => {
    await Promise.all(
      selectedBookmarks.map((item) =>
        updateBookmarkMutator.mutateAsync({
          bookmarkId: item.id,
          favourited,
          archived,
        }),
      ),
    );
    toast({
      description: `${selectedBookmarks.length} bookmarks have been updated!`,
    });
  };

  const deleteBookmarks = async () => {
    await Promise.all(
      selectedBookmarks.map((item) =>
        deleteBookmarkMutator.mutateAsync({ bookmarkId: item.id }),
      ),
    );
    toast({
      description: `${selectedBookmarks.length} bookmarks have been deleted!`,
    });
    setIsDeleteDialogOpen(false);
  };

  const alreadyFavourited =
    selectedBookmarks.length &&
    selectedBookmarks.every((item) => item.favourited === true);

  const alreadyArchived =
    selectedBookmarks.length &&
    selectedBookmarks.every((item) => item.archived === true);

  const actionList = [
    {
      name: isClipboardAvailable()
        ? "Copy Links"
        : "Copying is only available over https",
      icon: <Link size={18} />,
      action: () => copyLinks(),
      isPending: false,
      hidden: !isBulkEditEnabled,
    },
    {
      name: "Add to List",
      icon: <List size={18} />,
      action: () => setManageListsModalOpen(true),
      isPending: false,
      hidden: !isBulkEditEnabled,
    },
    {
      name: "Edit Tags",
      icon: <Hash size={18} />,
      action: () => setBulkTagModalOpen(true),
      isPending: false,
      hidden: !isBulkEditEnabled,
    },
    {
      name: alreadyFavourited ? "Unfavourite" : "Favourite",
      icon: <FavouritedActionIcon favourited={!!alreadyFavourited} size={18} />,
      action: () => updateBookmarks({ favourited: !alreadyFavourited }),
      isPending: updateBookmarkMutator.isPending,
      hidden: !isBulkEditEnabled,
    },
    {
      name: alreadyArchived ? "Un-archive" : "Archive",
      icon: <ArchivedActionIcon size={18} archived={!!alreadyArchived} />,
      action: () => updateBookmarks({ archived: !alreadyArchived }),
      isPending: updateBookmarkMutator.isPending,
      hidden: !isBulkEditEnabled,
    },
    {
      name: "Download Full Page Archive",
      icon: <FileDown size={18} />,
      action: () => recrawlBookmarks(true),
      isPending: recrawlBookmarkMutator.isPending,
      hidden: !isBulkEditEnabled,
    },
    {
      name: "Refresh",
      icon: <RotateCw size={18} />,
      action: () => recrawlBookmarks(false),
      isPending: recrawlBookmarkMutator.isPending,
      hidden: !isBulkEditEnabled,
    },
    {
      name: "Delete",
      icon: <Trash2 size={18} color="red" />,
      action: () => setIsDeleteDialogOpen(true),
      hidden: !isBulkEditEnabled,
    },
    {
      name: isEverythingSelected() ? "Unselect All" : "Select All",
      icon: (
        <p className="flex items-center gap-2">
          ( <CheckCheck size={18} /> {selectedBookmarks.length} )
        </p>
      ),
      action: () =>
        isEverythingSelected() ? unSelectAllBookmarks() : selectAllBookmarks(),
      alwaysEnable: true,
      hidden: !isBulkEditEnabled,
    },
    {
      name: "Close bulk edit",
      icon: <X size={18} />,
      action: () => setIsBulkEditEnabled(false),
      alwaysEnable: true,
      hidden: !isBulkEditEnabled,
    },
    {
      name: "Bulk Edit",
      icon: <Pencil size={18} />,
      action: () => setIsBulkEditEnabled(true),
      alwaysEnable: true,
      hidden: isBulkEditEnabled,
    },
  ];

  return (
    <div>
      <ActionConfirmingDialog
        open={isDeleteDialogOpen}
        setOpen={setIsDeleteDialogOpen}
        title={"Delete Bookmarks"}
        description={<p>Are you sure you want to delete these bookmarks?</p>}
        actionButton={() => (
          <ActionButton
            type="button"
            variant="destructive"
            loading={deleteBookmarkMutator.isPending}
            onClick={() => deleteBookmarks()}
          >
            Delete
          </ActionButton>
        )}
      />
      <BulkManageListsModal
        bookmarkIds={selectedBookmarks.map((b) => b.id)}
        open={manageListsModal}
        setOpen={setManageListsModalOpen}
      />
      <BulkTagModal
        bookmarkIds={selectedBookmarks.map((b) => b.id)}
        open={bulkTagModal}
        setOpen={setBulkTagModalOpen}
      />
      <div className="flex items-center">
        {actionList.map(
          ({ name, icon: Icon, action, isPending, hidden, alwaysEnable }) => (
            <ActionButtonWithTooltip
              className={hidden ? "hidden" : "block"}
              tooltip={name}
              disabled={!selectedBookmarks.length && !alwaysEnable}
              delayDuration={100}
              loading={!!isPending}
              variant="ghost"
              key={name}
              onClick={action}
            >
              {Icon}
            </ActionButtonWithTooltip>
          ),
        )}
      </div>
    </div>
  );
}
