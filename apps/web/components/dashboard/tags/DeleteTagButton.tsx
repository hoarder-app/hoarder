"use client";

import { useRouter } from "next/navigation";
import { ActionButton } from "@/components/ui/action-button";
import ActionConfirmingDialog from "@/components/ui/action-confirming-dialog";
import { toast } from "@/components/ui/use-toast";

import { useDeleteTag } from "@hoarder/shared-react/hooks/tags";

export default function DeleteTagButton({
  tagName,
  tagId,
  children,
  navigateOnDelete = false,
}: {
  tagName: string;
  tagId: string;
  children: React.ReactNode;
  navigateOnDelete?: boolean;
}) {
  const router = useRouter();
  const { mutate: deleteTag, isPending } = useDeleteTag({
    onSuccess: () => {
      toast({
        description: `Tag "${tagName}" has been deleted!`,
      });
      if (navigateOnDelete) {
        router.push("/dashboard/tags");
      }
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
      actionButton={(setDialogOpen) => (
        <ActionButton
          type="button"
          variant="destructive"
          loading={isPending}
          onClick={() => {
            deleteTag({ tagId: tagId });
            setDialogOpen(false);
          }}
        >
          Delete
        </ActionButton>
      )}
    >
      {children}
    </ActionConfirmingDialog>
  );
}
