import React from "react";
import { DraggableData, DraggableEvent } from "react-draggable";

export function useDragAndDrop(
  dragSourceIdAttribute: string,
  dragTargetIdAttribute: string,
  onDragOver: (dragSourceId: string, dragTargetId: string) => void,
) {
  const [dragSourceId, setDragSourceId] = React.useState<string | null>(null);

  const handleDragStart = React.useCallback(
    (_e: DraggableEvent, { node }: DraggableData) => {
      const id = node.getAttribute(dragSourceIdAttribute);
      setDragSourceId(id);
    },
    [],
  );

  const handleDragEnd = React.useCallback(
    (e: DraggableEvent) => {
      const { target } = e;
      const dragTargetId = (target as HTMLElement).getAttribute(
        dragTargetIdAttribute,
      );

      if (dragSourceId && dragTargetId && dragSourceId !== dragTargetId) {
        /*
          As Draggable tries to setState when the 
          component is unmounted, it is needed to
          push onCombine to the event loop queue.
          onCombine would be run after setState on
          Draggable so it would fix the issue until
          they fix it on their end.
      */
        setTimeout(() => {
          onDragOver(dragSourceId, dragTargetId);
        }, 0);
      }
      setDragSourceId(null);
    },
    [dragSourceId, onDragOver],
  );

  return {
    handleDragStart,
    handleDragEnd,
  };
}
