"use client";

import { useRouter } from "next/navigation";
import { ActionButton } from "@/components/ui/action-button";
import ActionConfirmingDialog from "@/components/ui/action-confirming-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { api } from "@/lib/trpc";
import { Trash2 } from "lucide-react";

import type { ZBookmarkList } from "@hoarder/trpc/types/lists";

export default function DeleteListButton({ list }: { list: ZBookmarkList }) {
  const router = useRouter();

  const listsInvalidationFunction = api.useUtils().lists.list.invalidate;
  const { mutate: deleteList, isPending } = api.lists.delete.useMutation({
    onSuccess: () => {
      listsInvalidationFunction();
      toast({
        description: `List "${list.icon} ${list.name}" is deleted!`,
      });
      router.push("/");
    },
    onError: () => {
      toast({
        variant: "destructive",
        description: `Something went wrong`,
      });
    },
  });
  return (
    <ActionConfirmingDialog
      title={`Delete ${list.icon} ${list.name}?`}
      description={`Are you sure you want to delete ${list.icon} ${list.name}?`}
      actionButton={() => (
        <ActionButton
          type="button"
          variant="destructive"
          loading={isPending}
          onClick={() => deleteList({ listId: list.id })}
        >
          Delete
        </ActionButton>
      )}
    >
      <Button className="mt-auto flex gap-2" variant="destructiveOutline">
        <Trash2 className="size-5" />
        <span className="hidden md:block">Delete List</span>
      </Button>
    </ActionConfirmingDialog>
  );
}
