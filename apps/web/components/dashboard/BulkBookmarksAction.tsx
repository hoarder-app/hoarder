"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
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
import bulkActions from "@/store/bulkBookmarksAction";
import { Archive, ArchiveRestore, Pencil, Star, Trash2, X } from "lucide-react";

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
  const { selectedBookmarks, isBulkEditEnabled } = bulkActions();
  const handleBulkEdit = bulkActions((state) => state.handleBulkEdit);
  const { toast } = useToast();
  const pathname = usePathname();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    handleBulkEdit(false); // turn off toggle + clear selected bookmarks on mount
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
      handleBulkEdit(false);
    },
    onError,
  });

  const updateBookmarkMutator = useUpdateBookmark({
    onSuccess: () => {
      handleBulkEdit(false);
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
  };

  const deleteBookmarks = () => {
    selectedBookmarks.map((item) => {
      deleteBookmarkMutator.mutate({ bookmarkId: item.id });
    });
    toast({
      description: `${selectedBookmarks.length} bookmarks have been deleted!`,
    });
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
          color={alreadyFavourited ? "#ebb434" : "#000"}
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
      action: () => handleBulkEdit(false),
    },
  ];

  if (!isBulkEditEnabled) {
    return (
      <div>
        <ButtonWithTooltip
          tooltip="Bulk Edit"
          delayDuration={100}
          variant="ghost"
          onClick={() => handleBulkEdit(true)}
        >
          <Pencil size={18} />
        </ButtonWithTooltip>
      </div>
    );
  }

  return (
    <div>
      {showDeleteModal && (
        <DeleteModal
          open={showDeleteModal}
          setOpen={setShowDeleteModal}
          deleteBookmarks={deleteBookmarks}
        />
      )}
      <div className="flex">
        {actionList.map(({ name, icon: Icon, action }) => (
          <ButtonWithTooltip
            tooltip={name}
            delayDuration={100}
            variant="ghost"
            key={name}
            onClick={action}
          >
            {Icon}
          </ButtonWithTooltip>
        ))}
      </div>
    </div>
  );
}
