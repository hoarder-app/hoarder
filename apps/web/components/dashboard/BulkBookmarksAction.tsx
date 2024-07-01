"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ActionButtonWithTooltip } from "@/components/ui/action-button";
import { Button, ButtonWithTooltip } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import bulkActions from "@/store/useBulkBookmarksAction";
import { Archive, ArchiveRestore, Pencil, Star, Trash2, X } from "lucide-react";
import { useTheme } from "next-themes";

import {
  useDeleteBookmark,
  useUpdateBookmark,
} from "@hoarder/shared-react/hooks/bookmarks";

function DeleteModal({
  open,
  setOpen,
  deleteBookmarks,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  deleteBookmarks: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Bookmarks</DialogTitle>
          <DialogClose />
        </DialogHeader>
        <p>Are you sure you want to delete these bookmarks?</p>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              deleteBookmarks();
              setOpen(false);
            }}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function BulkBookmarksAction() {
  const { theme } = useTheme();
  const { selectedBookmarks, isBulkEditEnabled } = bulkActions();
  const setIsBulkEditEnabled = bulkActions(
    (state) => state.setIsBulkEditEnabled,
  );
  const { toast } = useToast();
  const pathname = usePathname();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isButtonLoading, setIsButtonLoading] = useState(false);

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

  interface UpdateBookmarkProps {
    favourited?: boolean;
    archived?: boolean;
  }

  const updateBookmarks = ({
    favourited,
    archived,
  }: UpdateBookmarkProps): void => {
    setIsButtonLoading(true);
    selectedBookmarks.map((item) => {
      updateBookmarkMutator.mutate({
        bookmarkId: item.id,
        favourited: favourited ?? item.favourited,
        archived: archived ?? item.archived,
      });
    });
    toast({
      description: `${selectedBookmarks.length} bookmarks have been updated!`,
    });
    setIsButtonLoading(false);
  };

  const deleteBookmarks = () => {
    setIsButtonLoading(true);
    selectedBookmarks.map((item) => {
      deleteBookmarkMutator.mutate({ bookmarkId: item.id });
    });
    toast({
      description: `${selectedBookmarks.length} bookmarks have been deleted!`,
    });
    setIsButtonLoading(false);
  };

  const alreadyFavourited =
    (selectedBookmarks.length &&
      selectedBookmarks.every((item) => item.favourited === true)) ||
    pathname.includes("favourites");

  const alreadyArchived =
    (selectedBookmarks.length &&
      selectedBookmarks.every((item) => item.archived === true)) ||
    pathname.includes("archive");

  const actionList = [
    {
      name: alreadyFavourited ? "Unfavourite" : "Favourite",
      icon: (
        <Star
          color={
            alreadyFavourited ? "#ebb434" : theme === "dark" ? "#fff" : "#000"
          }
          fill={alreadyFavourited ? "#ebb434" : "transparent"}
          size={18}
        />
      ),
      action: () => updateBookmarks({ favourited: !alreadyFavourited }),
    },
    {
      name: alreadyArchived ? "Un-arhcive" : "Archive",
      icon: alreadyArchived ? (
        <ArchiveRestore size={18} />
      ) : (
        <Archive size={18} />
      ),
      action: () => updateBookmarks({ archived: !alreadyArchived }),
    },
    {
      name: "Delete",
      icon: <Trash2 size={18} />,
      action: () => setShowDeleteModal(true),
    },
    {
      name: "Close bulk edit",
      icon: <X size={18} />,
      action: () => setIsBulkEditEnabled(false),
    },
  ];

  const getUIWidth = () => {
    const SINGLE_ACTION_WIDTH = 50;
    const ALL_ACTIONS_WIDTH = `${actionList.length * SINGLE_ACTION_WIDTH}px`;
    const PENCIL_ICON_WIDTH = `${SINGLE_ACTION_WIDTH}px`;
    return isBulkEditEnabled ? ALL_ACTIONS_WIDTH : PENCIL_ICON_WIDTH;
  };

  const BulkEditButton = () => {
    return (
      <div>
        <ButtonWithTooltip
          tooltip="Bulk Edit"
          delayDuration={100}
          variant="ghost"
          onClick={() => setIsBulkEditEnabled(true)}
        >
          <Pencil size={18} />
        </ButtonWithTooltip>
      </div>
    );
  };

  return (
    <div className="transition-all" style={{ width: getUIWidth() }}>
      {showDeleteModal && (
        <DeleteModal
          open={showDeleteModal}
          setOpen={setShowDeleteModal}
          deleteBookmarks={deleteBookmarks}
        />
      )}

      {!isBulkEditEnabled ? (
        <BulkEditButton />
      ) : (
        <div className="flex">
          {actionList.map(({ name, icon: Icon, action }) => (
            <ActionButtonWithTooltip
              tooltip={name}
              delayDuration={100}
              loading={isButtonLoading}
              variant="ghost"
              key={name}
              onClick={action}
            >
              {Icon}
            </ActionButtonWithTooltip>
          ))}
        </div>
      )}
    </div>
  );
}
