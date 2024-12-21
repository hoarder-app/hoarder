"use client";

import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "@/lib/i18n/client";
import { Pencil, Plus, Trash2 } from "lucide-react";

import { ZBookmarkList } from "@hoarder/shared/types/lists";

import { EditListModal } from "../lists/EditListModal";
import DeleteListConfirmationDialog from "./DeleteListConfirmationDialog";

export function ListOptions({
  list,
  children,
}: {
  list: ZBookmarkList;
  children?: React.ReactNode;
}) {
  const { t } = useTranslation();

  const [deleteListDialogOpen, setDeleteListDialogOpen] = useState(false);
  const [newNestedListModalOpen, setNewNestedListModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  return (
    <DropdownMenu>
      <EditListModal
        open={newNestedListModalOpen}
        setOpen={setNewNestedListModalOpen}
        parent={list}
      />
      <EditListModal
        open={editModalOpen}
        setOpen={setEditModalOpen}
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
          onClick={() => setNewNestedListModalOpen(true)}
        >
          <Plus className="size-4" />
          <span>{t("lists.new_nested_list")}</span>
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
  );
}
