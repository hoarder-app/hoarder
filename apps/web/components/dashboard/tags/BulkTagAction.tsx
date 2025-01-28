"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  ActionButton,
  ActionButtonWithTooltip,
} from "@/components/ui/action-button";
import ActionConfirmingDialog from "@/components/ui/action-confirming-dialog";
import InfoTooltip from "@/components/ui/info-tooltip";
import { Toggle } from "@/components/ui/toggle";
import { useToast } from "@/components/ui/use-toast";
import useBulkTagActionsStore from "@/lib/bulkTagActions";
import { useTranslation } from "@/lib/i18n/client";
import { CheckCheck, Pencil, Trash2, X } from "lucide-react";

import { useDeleteTag } from "@hoarder/shared-react/hooks/tags";
import { limitConcurrency } from "@hoarder/shared/concurrency";

const MAX_CONCURRENT_BULK_ACTIONS = 50;

export default function BulkTagAction() {
  const { t } = useTranslation();
  const { toast } = useToast();

  const { selectedTags, isBulkEditEnabled } = useBulkTagActionsStore();
  const setIsBulkEditEnabled = useBulkTagActionsStore(
    (state) => state.setIsBulkEditEnabled,
  );
  const selectAllTags = useBulkTagActionsStore((state) => state.selectAll);
  const unSelectAllTags = useBulkTagActionsStore((state) => state.unSelectAll);
  const isEverythingSelected = useBulkTagActionsStore(
    (state) => state.isEverythingSelected,
  );

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const pathname = usePathname();
  const [currentPathname, setCurrentPathname] = useState("");

  useEffect(() => {
    if (pathname !== currentPathname) {
      setCurrentPathname(pathname);
      setIsBulkEditEnabled(false);
    }
  }, [pathname, currentPathname]);

  const onError = () => {
    toast({
      variant: "destructive",
      title: "Something went wrong",
      description: "There was a problem with your request.",
    });
  };

  const deleteTagMutator = useDeleteTag({
    onSuccess: () => {
      setIsBulkEditEnabled(false);
    },
    onError,
  });

  const deleteSelectedTags = async () => {
    await Promise.all(
      limitConcurrency(
        selectedTags.map(
          (item) => () => deleteTagMutator.mutateAsync({ tagId: item.id }),
        ),
        MAX_CONCURRENT_BULK_ACTIONS,
      ),
    );
    toast({
      description: `${selectedTags.length} tags have been deleted!`,
    });
    setIsDeleteDialogOpen(false);
  };

  const actionList = [
    {
      name: isEverythingSelected()
        ? t("actions.unselect_all")
        : t("actions.select_all"),
      icon: (
        <p className="flex items-center gap-2">
          ( <CheckCheck size={18} /> {selectedTags.length} )
        </p>
      ),
      action: () =>
        isEverythingSelected() ? unSelectAllTags() : selectAllTags(),
      alwaysEnable: true,
    },
    {
      name: t("actions.delete"),
      icon: <Trash2 size={18} color="red" />,
      action: () => setIsDeleteDialogOpen(true),
    },
    {
      name: t("actions.close_bulk_edit"),
      icon: <X size={18} />,
      action: () => setIsBulkEditEnabled(false),
      alwaysEnable: true,
    },
  ];

  return (
    <div>
      <ActionConfirmingDialog
        open={isDeleteDialogOpen}
        setOpen={setIsDeleteDialogOpen}
        title={"Delete Tags"}
        description={<p>Are you sure you want to delete these tags?</p>}
        actionButton={() => (
          <ActionButton
            type="button"
            variant="destructive"
            loading={deleteTagMutator.isPending}
            onClick={() => deleteSelectedTags()}
          >
            {t("actions.delete")}
          </ActionButton>
        )}
      />

      {!isBulkEditEnabled ? (
        <Toggle
          variant="outline"
          aria-label="Toggle bulk edit"
          pressed={isBulkEditEnabled}
          onPressedChange={setIsBulkEditEnabled}
        >
          <Pencil className="mr-2 size-4" />
          Bulk Edit
          <InfoTooltip size={15} className="my-auto ml-2" variant="explain">
            <p>Bulk Edit Tags</p>
          </InfoTooltip>
        </Toggle>
      ) : (
        <div className="flex items-center">
          {actionList.map(({ name, icon: Icon, action, alwaysEnable }) => (
            <ActionButtonWithTooltip
              tooltip={name}
              disabled={!selectedTags.length && !alwaysEnable}
              delayDuration={100}
              variant="ghost"
              loading={false}
              key={name}
              onClick={action}
            >
              {Icon}
            </ActionButtonWithTooltip>
          ))}
        </div>
      )}
    </div>
  );
}
