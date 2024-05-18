import { DraggableData, DraggableEvent } from "react-draggable";

export interface DragState {
  // The id of the element that is being dragged
  dragSourceId: string | null;
  // The id of the element that is currently being hovered over
  dragTargetId: string | null;
  // The position of the elements being dragged such that on drag over, we can revert the position.
  initialX: number;
  initialY: number;
}

export interface DragAndDropFunctions {
  handleDragStart: (e: DraggableEvent, data: DraggableData) => void;
  handleDrag: (e: DraggableEvent) => void;
  handleDragEnd: () => void;
  dragState: DragState;
}

export function useDragAndDrop(
  dragSourceIdAttribute: string,
  dragTargetIdAttribute: string,
  callback: (dragSourceId: string, dragTargetId: string) => void,
): DragAndDropFunctions {
  const initialState: DragState = {
    dragSourceId: null,
    dragTargetId: null,
    initialX: 0,
    initialY: 0,
  };

  let currentState: DragState = initialState;

  function handleDragStart(e: DraggableEvent, data: DraggableData): void {
    const { node } = data;
    const id = node.getAttribute(dragSourceIdAttribute);

    currentState = {
      ...initialState,
      dragSourceId: id,
      initialX: data.x,
      initialY: data.y,
    };
  }

  function handleDrag(e: DraggableEvent): void {
    const { dragTargetId } = currentState;
    const { target } = e;

    // Important according to the sample I found
    e.preventDefault();

    if (target) {
      const id = (target as HTMLElement).getAttribute(dragTargetIdAttribute);

      if (id !== dragTargetId) {
        currentState.dragTargetId = id;
      }
    }
  }

  function handleDragEnd(): void {
    const { dragSourceId, dragTargetId } = currentState;

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
        console.log(dragSourceId, dragTargetId);
        callback(dragSourceId, dragTargetId);
      }, 0);
    }

    currentState = initialState;
  }

  return {
    dragState: currentState,
    handleDragStart,
    handleDrag,
    handleDragEnd,
  };
}
