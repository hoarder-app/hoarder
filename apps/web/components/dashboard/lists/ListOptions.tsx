"use client";

import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
          <span>Edit</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="flex gap-2"
          onClick={() => setNewNestedListModalOpen(true)}
        >
          <Plus className="size-4" />
          <span>New nested list</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="flex gap-2"
          onClick={() => setDeleteListDialogOpen(true)}
        >
          <Trash2 className="size-4" />
          <span>Delete</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
