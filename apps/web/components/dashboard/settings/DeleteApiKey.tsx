"use client";

import { useRouter } from "next/navigation";
import { ActionButton } from "@/components/ui/action-button";
import ActionConfirmingDialog from "@/components/ui/action-confirming-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { api } from "@/lib/trpc";
import { Trash } from "lucide-react";
import { useTheme } from "next-themes";

export default function DeleteApiKey({
  name,
  id,
}: {
  name: string;
  id: string;
}) {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const mutator = api.apiKeys.revoke.useMutation({
    onSuccess: () => {
      toast({
        description: "Key was successfully deleted",
      });
      router.refresh();
    },
  });

  return (
    <ActionConfirmingDialog
      title={
        <span
          className={resolvedTheme === "dark" ? "text-white" : "text-gray-900"}
        >
          Delete 🚀 {name}?
        </span>
      }
      description={
        <p
          className={resolvedTheme === "dark" ? "text-white" : "text-gray-900"}
        >
          Are you sure you want to delete 🚀 {name}? Any service using this API
          key will lose access.
        </p>
      }
      actionButton={(setDialogOpen) => (
        <ActionButton
          type="button"
          variant="destructive"
          loading={mutator.isPending}
          onClick={() =>
            mutator.mutate({ id }, { onSuccess: () => setDialogOpen(false) })
          }
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
      <Button
        variant="outline"
        className={`${
          resolvedTheme === "dark"
            ? "border-gray-600 text-gray-300 hover:bg-gray-700"
            : "border-gray-300 text-gray-700 hover:bg-gray-200"
        }`}
      >
        <Trash
          size={18}
          color={resolvedTheme === "dark" ? "#ffffff" : "#ff0000"}
        />
      </Button>
    </ActionConfirmingDialog>
  );
}
