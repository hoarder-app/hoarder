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
import { toast } from "@/components/ui/use-toast";
import { api } from "@/lib/trpc";
import Draggable, { DraggableData, DraggableEvent } from "react-draggable";

import type { ZGetTagResponse } from "@hoarder/shared/types/tags";
import {
  useDeleteUnusedTags,
  useMergeTag,
} from "@hoarder/shared-react/hooks/tags";

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
interface DragState {
  dragId: string | null;
  dragOverId: string | null;
  // The position of the elements being dragged such that on drag over, we can revert the position.
  initialX: number;
  initialY: number;
}

const initialState: DragState = {
  dragId: null,
  dragOverId: null,
  initialX: 0,
  initialY: 0,
};
let currentState: DragState = initialState;

const byUsageSorter = (a: ZGetTagResponse, b: ZGetTagResponse) =>
  b.count - a.count;
const byNameSorter = (a: ZGetTagResponse, b: ZGetTagResponse) =>
  a.name.localeCompare(b.name, undefined, { sensitivity: "base" });

export default function AllTagsView({
  initialData,
}: {
  initialData: ZGetTagResponse[];
}) {
  const [draggingEnabled, toggleDraggingEnabled] = React.useState(false);
  const [sortByName, toggleSortByName] = React.useState(false);

  function handleSortByNameChange(): void {
    toggleSortByName(!sortByName);
  }

  function handleDraggableChange(): void {
    toggleDraggingEnabled(!draggingEnabled);
  }

  function handleDragStart(e: DraggableEvent, data: DraggableData): void {
    const { node } = data;
    const id = node.getAttribute("data-id");

    currentState = {
      ...initialState,
      dragId: id,
      initialX: data.x,
      initialY: data.y,
    };
  }

  function handleDrag(e: DraggableEvent): void {
    const { dragOverId } = currentState;
    const { target } = e;

    // Important according to the sample I found
    e.preventDefault();

    if (target) {
      const id = (target as HTMLElement).getAttribute("data-id");

      if (id !== dragOverId) {
        currentState.dragOverId = id;
      }
    }
  }

  function handleDragEnd(): void {
    const { dragId, dragOverId } = currentState;

    if (dragId && dragOverId && dragId !== dragOverId) {
      /*  
            As Draggable tries to setState when the 
            component is unmounted, it is needed to
            push onCombine to the event loop queue.
            onCombine would be run after setState on
            Draggable so it would fix the issue until
            they fix it on their end.
        */
      setTimeout(() => {
        mergeTag({
          fromTagIds: [dragId],
          intoTagId: dragOverId,
        });
      }, 0);
    }

    currentState = initialState;
  }

  const { mutate: mergeTag } = useMergeTag({
    onSuccess: () => {
      toast({
        description: "Tags have been merged!",
      });
    },
    onError: (e) => {
      if (e.data?.code == "BAD_REQUEST") {
        if (e.data.zodError) {
          toast({
            variant: "destructive",
            description: Object.values(e.data.zodError.fieldErrors)
              .flat()
              .join("\n"),
          });
        } else {
          toast({
            variant: "destructive",
            description: e.message,
          });
        }
      } else {
        toast({
          variant: "destructive",
          title: "Something went wrong",
        });
      }
    },
  });

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
            <Draggable
              key={t.id}
              axis="both"
              onStart={handleDragStart}
              onDrag={handleDrag}
              onStop={handleDragEnd}
              disabled={!draggingEnabled}
              defaultClassNameDragging={
                "position-relative z-10 pointer-events-none"
              }
              position={
                !currentState.dragId
                  ? {
                      x: currentState.initialX ?? 0,
                      y: currentState.initialY ?? 0,
                    }
                  : undefined
              }
            >
              <div className="group relative flex cursor-grab" data-id={t.id}>
                <TagPill
                  id={t.id}
                  name={t.name}
                  count={t.count}
                  isDraggable={draggingEnabled}
                />
              </div>
            </Draggable>
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
      <label>
        <input
          type="checkbox"
          checked={draggingEnabled}
          onChange={handleDraggableChange}
        />
        Allow Merging via Drag&Drop
      </label>
      <br />
      <label>
        <input
          type="checkbox"
          checked={sortByName}
          onChange={handleSortByNameChange}
        />
        Sort by Name
      </label>
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
