"use client";

import { useRouter } from "next/navigation";
import { ActionButton } from "@/components/ui/action-button";
import ActionConfirmingDialog from "@/components/ui/action-confirming-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { api } from "@/lib/trpc";
import { Trash2 } from "lucide-react";

export default function DeleteTagButton({
  tagName,
  tagId,
}: {
  tagName: string;
  tagId: string;
}) {
  const router = useRouter();

  const apiUtils = api.useUtils();

  const { mutate: deleteTag, isPending } = api.tags.delete.useMutation({
    onSuccess: () => {
      apiUtils.tags.list.invalidate();
      apiUtils.bookmarks.getBookmark.invalidate();
      toast({
        description: `Tag "${tagName}" has been deleted!`,
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
      title={`Delete ${tagName}?`}
      description={`Are you sure you want to delete the tag "${tagName}"?`}
      actionButton={() => (
        <ActionButton
          type="button"
          variant="destructive"
          loading={isPending}
          onClick={() => deleteTag({ tagId: tagId })}
        >
          Delete
        </ActionButton>
      )}
    >
      <Button className="mt-auto flex gap-2" variant="destructiveOutline">
        <Trash2 className="size-5" />
        <span className="hidden md:block">Delete Tag</span>
      </Button>
    </ActionConfirmingDialog>
  );
}
