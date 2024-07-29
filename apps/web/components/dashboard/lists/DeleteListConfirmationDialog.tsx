"use client";

import { usePathname, useRouter } from "next/navigation";
import { ActionButton } from "@/components/ui/action-button";
import ActionConfirmingDialog from "@/components/ui/action-confirming-dialog";
import { toast } from "@/components/ui/use-toast";
import { useTheme } from "next-themes";

import type { ZBookmarkList } from "@hoarder/shared/types/lists";
import { useDeleteBookmarkList } from "@hoarder/shared-react/hooks/lists";

export default function DeleteListConfirmationDialog({
  list,
  children,
  open,
  setOpen,
}: {
  list: ZBookmarkList;
  children?: React.ReactNode;
  open: boolean;
  setOpen: (v: boolean) => void;
}) {
  const currentPath = usePathname();
  const router = useRouter();
  const { resolvedTheme } = useTheme();

  const { mutate: deleteList, isPending } = useDeleteBookmarkList({
    onSuccess: () => {
      toast({
        description: `List "${list.icon} ${list.name}" is deleted!`,
      });
      setOpen(false);
      if (currentPath.includes(list.id)) {
        router.push("/dashboard/lists");
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
      open={open}
      setOpen={setOpen}
      title={
        <span
          className={resolvedTheme === "dark" ? "text-white" : "text-gray-900"}
        >
          Delete {list.icon} {list.name}?
        </span>
      }
      description={
        <p
          className={resolvedTheme === "dark" ? "text-white" : "text-gray-900"}
        >
          Are you sure you want to delete {list.icon} {list.name}?
        </p>
      }
      actionButton={() => (
        <ActionButton
          type="button"
          variant="destructive"
          loading={isPending}
          onClick={() => deleteList({ listId: list.id })}
          className={`${
            resolvedTheme === "dark"
              ? "rounded-lg bg-orange-600 text-white hover:bg-orange-700"
              : "rounded-lg bg-orange-500 text-white hover:bg-orange-600"
          }`}
        >
          Delete
        </ActionButton>
      )}
    >
      {children}
    </ActionConfirmingDialog>
  );
}
