"use client";

import { useCallback, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "@/lib/i18n/client";
import { Combine, Square, SquareCheck, Trash2 } from "lucide-react";

import DeleteTagConfirmationDialog from "./DeleteTagConfirmationDialog";
import { MergeTagModal } from "./MergeTagModal";

export function TagOptions({
  tag,
  children,
}: {
  tag: { id: string; name: string };
  children?: React.ReactNode;
}) {
  const { t } = useTranslation();
  const [deleteTagDialogOpen, setDeleteTagDialogOpen] = useState(false);
  const [mergeTagDialogOpen, setMergeTagDialogOpen] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(name, value);

      return params.toString();
    },
    [searchParams],
  );

  const includeArchived = searchParams.get("includeArchived");

  return (
    <DropdownMenu>
      <DeleteTagConfirmationDialog
        tag={tag}
        open={deleteTagDialogOpen}
        setOpen={setDeleteTagDialogOpen}
      />
      <MergeTagModal
        open={mergeTagDialogOpen}
        setOpen={setMergeTagDialogOpen}
        tag={tag}
      />
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem
          className="flex gap-2"
          onClick={() => setMergeTagDialogOpen(true)}
        >
          <Combine className="size-4" />
          <span>{t("actions.merge")}</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="flex gap-2"
          onClick={() => {
            const newIncludeArchived = includeArchived
              ? includeArchived !== "true"
              : false;
            router.replace(
              pathname +
                "?" +
                createQueryString(
                  "includeArchived",
                  newIncludeArchived.toString(),
                ),
            );
          }}
        >
          {includeArchived === null || includeArchived === "true" ? (
            <SquareCheck className="size-4" />
          ) : (
            <Square className="size-4" />
          )}
          <span>{t("actions.toggle_show_archived")}</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="flex gap-2"
          onClick={() => setDeleteTagDialogOpen(true)}
        >
          <Trash2 className="size-4" />
          <span>{t("actions.delete")}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
