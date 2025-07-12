import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useShowArchived } from "@/components/utils/useShowArchived";
import { useTranslation } from "@/lib/i18n/client";
import {
  FolderInput,
  Lock,
  LockOpen,
  Pencil,
  Plus,
  Share,
  Square,
  SquareCheck,
  Trash2,
} from "lucide-react";

import { useEditBookmarkList } from "@karakeep/shared-react/hooks/lists";
import { ZBookmarkList } from "@karakeep/shared/types/lists";

import { EditListModal } from "../lists/EditListModal";
import DeleteListConfirmationDialog from "./DeleteListConfirmationDialog";
import { LockedListAuthModal } from "./LockedListAuthModal";
import { MergeListModal } from "./MergeListModal";
import { ShareListModal } from "./ShareListModal";

export function ListOptions({
  list,
  isOpen,
  onOpenChange,
  children,
}: {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  list: ZBookmarkList;
  children?: React.ReactNode;
}) {
  const { t } = useTranslation();
  const { showArchived, onClickShowArchived } = useShowArchived();

  const [deleteListDialogOpen, setDeleteListDialogOpen] = useState(false);
  const [newNestedListModalOpen, setNewNestedListModalOpen] = useState(false);
  const [mergeListModalOpen, setMergeListModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [unlockModalOpen, setUnlockModalOpen] = useState(false);

  const { mutate: editList } = useEditBookmarkList();

  const handleToggleLock = () => {
    if (list.locked) {
      // Unlocking - require password verification
      setUnlockModalOpen(true);
    } else {
      // Locking - open edit modal to set password
      setEditModalOpen(true);
    }
  };

  const handleUnlockConfirmed = (_password: string) => {
    // Remove the lock after password verification
    editList({
      listId: list.id,
      locked: false,
    });
    setUnlockModalOpen(false);
  };

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={onOpenChange}>
        <ShareListModal
          open={shareModalOpen}
          setOpen={setShareModalOpen}
          list={list}
        />
        <EditListModal
          open={newNestedListModalOpen}
          setOpen={setNewNestedListModalOpen}
          prefill={{
            parentId: list.id,
          }}
        />
        <EditListModal
          open={editModalOpen}
          setOpen={setEditModalOpen}
          list={list}
        />
        <MergeListModal
          open={mergeListModalOpen}
          setOpen={setMergeListModalOpen}
          list={list}
        />
        <DeleteListConfirmationDialog
          list={list}
          open={deleteListDialogOpen}
          setOpen={setDeleteListDialogOpen}
        />
        <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem
            className="flex gap-2"
            onClick={() => setEditModalOpen(true)}
          >
            <Pencil className="size-4" />
            <span>{t("actions.edit")}</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="flex gap-2"
            onClick={() => setShareModalOpen(true)}
          >
            <Share className="size-4" />
            <span>{t("lists.share_list")}</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="flex gap-2" onClick={handleToggleLock}>
            {list.locked ? (
              <LockOpen className="size-4" />
            ) : (
              <Lock className="size-4" />
            )}
            <span>{list.locked ? "Unlock List" : "Lock List"}</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="flex gap-2"
            onClick={() => setNewNestedListModalOpen(true)}
          >
            <Plus className="size-4" />
            <span>{t("lists.new_nested_list")}</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="flex gap-2"
            onClick={() => setMergeListModalOpen(true)}
          >
            <FolderInput className="size-4" />
            <span>{t("lists.merge_list")}</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="flex gap-2"
            onClick={onClickShowArchived}
          >
            {showArchived ? (
              <SquareCheck className="size-4" />
            ) : (
              <Square className="size-4" />
            )}
            <span>{t("actions.toggle_show_archived")}</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="flex gap-2"
            onClick={() => setDeleteListDialogOpen(true)}
          >
            <Trash2 className="size-4" />
            <span>{t("actions.delete")}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <LockedListAuthModal
        open={unlockModalOpen}
        onOpenChange={setUnlockModalOpen}
        listId={list.id}
        listName={list.name}
        onAuthenticated={handleUnlockConfirmed}
      />
    </>
  );
}
