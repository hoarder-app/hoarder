"use client";

import React from "react";
import { ActionButton } from "@/components/ui/action-button";
import ActionConfirmingDialog from "@/components/ui/action-confirming-dialog";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import InfoTooltip from "@/components/ui/info-tooltip";
import { Separator } from "@/components/ui/separator";
import { Toggle } from "@/components/ui/toggle";
import { toast } from "@/components/ui/use-toast";
import { api } from "@/lib/trpc";
import { ArrowDownAZ, Combine } from "lucide-react";

import type { ZGetTagResponse } from "@hoarder/shared/types/tags";
import { useDeleteUnusedTags } from "@hoarder/shared-react/hooks/tags";

import { TagPill } from "./TagPill";

function DeleteAllUnusedTags({ numUnusedTags }: { numUnusedTags: number }) {
  const { mutate, isPending } = useDeleteUnusedTags({
    onSuccess: () => {
      toast({
        description: `Deleted all ${numUnusedTags} unused tags`,
      });
    },
    onError: () => {
      toast({
        description: "Something went wrong",
        variant: "destructive",
      });
    },
  });
  return (
    <ActionConfirmingDialog
      title="Delete all unused tags?"
      description={`Are you sure you want to delete the ${numUnusedTags} unused tags?`}
      actionButton={() => (
        <ActionButton
          variant="destructive"
          loading={isPending}
          onClick={() => mutate()}
        >
          DELETE THEM ALL
        </ActionButton>
      )}
    >
      <Button variant="destructive" disabled={numUnusedTags == 0}>
        Delete All Unused Tags
      </Button>
    </ActionConfirmingDialog>
  );
}

const byUsageSorter = (a: ZGetTagResponse, b: ZGetTagResponse) => {
  // Sort by name if the usage is the same to get a stable result
  if (b.count == a.count) {
    return byNameSorter(a, b);
  }
  return b.count - a.count;
};
const byNameSorter = (a: ZGetTagResponse, b: ZGetTagResponse) =>
  a.name.localeCompare(b.name, undefined, { sensitivity: "base" });

export default function AllTagsView({
  initialData,
}: {
  initialData: ZGetTagResponse[];
}) {
  const [draggingEnabled, setDraggingEnabled] = React.useState(false);
  const [sortByName, setSortByName] = React.useState(false);

  function toggleSortByName(): void {
    setSortByName(!sortByName);
  }

  function toggleDraggingEnabled(): void {
    setDraggingEnabled(!draggingEnabled);
  }

  const { data } = api.tags.list.useQuery(undefined, {
    initialData: { tags: initialData },
  });
  // Sort tags by usage desc
  const allTags = data.tags.sort(sortByName ? byNameSorter : byUsageSorter);

  const humanTags = allTags.filter((t) => (t.countAttachedBy.human ?? 0) > 0);
  const aiTags = allTags.filter((t) => (t.countAttachedBy.ai ?? 0) > 0);
  const emptyTags = allTags.filter((t) => t.count === 0);

  const tagsToPill = (tags: typeof allTags) => {
    let tagPill;
    if (tags.length) {
      tagPill = (
        <div className="flex flex-wrap gap-3">
          {tags.map((t) => (
            <TagPill
              key={t.id}
              id={t.id}
              name={t.name}
              count={t.count}
              isDraggable={draggingEnabled}
            />
          ))}
        </div>
      );
    } else {
      tagPill = "No Tags";
    }
    return tagPill;
  };
  return (
    <>
      <div className="flex justify-end gap-x-2">
        <Toggle
          variant="outline"
          aria-label="Toggle bold"
          pressed={draggingEnabled}
          onPressedChange={toggleDraggingEnabled}
        >
          <Combine className="mr-2 size-4" />
          Drag & Drop Merging
          <InfoTooltip size={15} className="my-auto ml-2" variant="explain">
            <p>Drag and drop tags on each other to merge them</p>
          </InfoTooltip>
        </Toggle>
        <Toggle
          variant="outline"
          aria-label="Toggle bold"
          pressed={sortByName}
          onPressedChange={toggleSortByName}
        >
          <ArrowDownAZ className="mr-2 size-4" /> Sort by Name
        </Toggle>
      </div>
      <span className="flex items-center gap-2">
        <p className="text-lg">Your Tags</p>
        <InfoTooltip size={15} className="my-auto" variant="explain">
          <p>Tags that were attached at least once by you</p>
        </InfoTooltip>
      </span>
      {tagsToPill(humanTags)}
      <Separator />
      <span className="flex items-center gap-2">
        <p className="text-lg">AI Tags</p>
        <InfoTooltip size={15} className="my-auto" variant="explain">
          <p>Tags that were only attached automatically (by AI)</p>
        </InfoTooltip>
      </span>
      {tagsToPill(aiTags)}
      <Separator />
      <span className="flex items-center gap-2">
        <p className="text-lg">Unused Tags</p>
        <InfoTooltip size={15} className="my-auto" variant="explain">
          <p>Tags that are not attached to any bookmarks</p>
        </InfoTooltip>
      </span>
      <Collapsible>
        <div className="space-x-1 pb-2">
          <CollapsibleTrigger asChild>
            <Button variant="secondary" disabled={emptyTags.length == 0}>
              {emptyTags.length > 0
                ? `Show ${emptyTags.length} unused tags`
                : "You don't have any unused tags"}
            </Button>
          </CollapsibleTrigger>
          {emptyTags.length > 0 && (
            <DeleteAllUnusedTags numUnusedTags={emptyTags.length} />
          )}
        </div>
        <CollapsibleContent>{tagsToPill(emptyTags)}</CollapsibleContent>
      </Collapsible>
    </>
  );
}
