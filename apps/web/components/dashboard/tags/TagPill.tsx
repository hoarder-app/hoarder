import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import { useDragAndDrop } from "@/lib/drag-and-drop";
import { X } from "lucide-react";
import Draggable from "react-draggable";

import { useMergeTag } from "@hoarder/shared-react/hooks/tags";

import DeleteTagConfirmationDialog from "./DeleteTagConfirmationDialog";

export function TagPill({
  id,
  name,
  count,
  isDraggable,
}: {
  id: string;
  name: string;
  count: number;
  isDraggable: boolean;
}) {
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

  const dragAndDropFunction = useDragAndDrop(
    "data-id",
    (dragTargetId: string) => {
      mergeTag({
        fromTagIds: [id],
        intoTagId: dragTargetId,
      });
    },
  );

  return (
    <Draggable
      key={id}
      axis="both"
      onStart={dragAndDropFunction.handleDragStart}
      onStop={dragAndDropFunction.handleDragEnd}
      disabled={!isDraggable}
      defaultClassNameDragging={"position-relative z-10 pointer-events-none"}
      position={{ x: 0, y: 0 }}
    >
      <div className="group relative flex">
        <Link
          className={
            "flex gap-2 rounded-md border border-border bg-background px-2 py-1 text-foreground hover:bg-foreground hover:text-background"
          }
          href={`/dashboard/tags/${id}`}
          data-id={id}
        >
          {name} <Separator orientation="vertical" /> {count}
        </Link>

        <DeleteTagConfirmationDialog tag={{ name, id }}>
          <Button
            size="none"
            variant="secondary"
            className="-translate-1/2 absolute -right-1 -top-1 hidden rounded-full group-hover:block"
          >
            <X className="size-3" />
          </Button>
        </DeleteTagConfirmationDialog>
      </div>
    </Draggable>
  );
}
