"use client";

import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";
import { api } from "@/lib/trpc";
import { ActionButton } from "@/components/ui/action-button";
import { useState } from "react";

export default function DeleteApiKey({
  name,
  id,
}: {
  name: string;
  id: string;
}) {
  const [isDialogOpen, setDialogOpen] = useState(false);
  const router = useRouter();
  const mutator = api.apiKeys.revoke.useMutation({
    onSuccess: () => {
      toast({
        description: "Key was successfully deleted",
      });
      setDialogOpen(false);
      router.refresh();
    },
  });

  return (
    <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">
          <Trash className="size-5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete API Key</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the API key &quot;{name}&quot;? Any
            service using this API key will lose access.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-end">
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Close
            </Button>
          </DialogClose>
          <ActionButton
            type="button"
            variant="destructive"
            loading={mutator.isPending}
            onClick={() => mutator.mutate({ id })}
          >
            Delete
          </ActionButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
