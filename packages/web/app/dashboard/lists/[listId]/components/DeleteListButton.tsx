"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";
import { api } from "@/lib/trpc";
import { ActionButton } from "@/components/ui/action-button";
import { useState } from "react";
import { ZBookmarkList } from "@hoarder/trpc/types/lists";

export default function DeleteListButton({ list }: { list: ZBookmarkList }) {
  const [isDialogOpen, setDialogOpen] = useState(false);

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
    <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button className="mt-auto flex gap-2" variant="destructive">
          <Trash className="size-5" />
          <span className="hidden md:block">Delete List</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Delete {list.icon} {list.name}?
          </DialogTitle>
        </DialogHeader>
        <span>
          Are you sure you want to delete {list.icon} {list.name}?
        </span>
        <DialogFooter className="sm:justify-end">
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Close
            </Button>
          </DialogClose>
          <ActionButton
            type="button"
            variant="destructive"
            loading={isPending}
            onClick={() => deleteList({ listId: list.id })}
          >
            Delete
          </ActionButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
