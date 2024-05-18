import React from "react";
import { toast } from "@/components/ui/use-toast";
import { useDragAndDrop } from "@/lib/drag-and-drop";
import { Slot } from "@radix-ui/react-slot";
import * as LucideReact from "lucide-react";
import Draggable from "react-draggable";

import { useAddBookmarkToList } from "@hoarder/shared-react/hooks/lists";
import { ZBookmark } from "@hoarder/shared/types/bookmarks";

import AssetCard from "./AssetCard";
import LinkCard from "./LinkCard";
import TextCard from "./TextCard";

export function BookmarkCard({ children }: { children: React.ReactNode }) {
  return (
    <Slot className="mb-4 border border-border bg-card duration-300 ease-in hover:shadow-lg hover:transition-all">
      {children}
    </Slot>
  );
}
export default function Bookmark({ bookmark }: { bookmark: ZBookmark }) {
  const [draggingState, setDraggingState] = React.useState({
    isDragging: false,
    initialX: 0,
    initialY: 0,
  });

  const { mutate: addToList } = useAddBookmarkToList({
    onSuccess: () => {
      toast({
        description: "List has been updated!",
      });
    },
    onError: (e) => {
      if (e.data?.code == "BAD_REQUEST") {
        toast({
          variant: "destructive",
          description: e.message,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Something went wrong",
        });
      }
    },
  });

  const dragAndDropFunction = useDragAndDrop(
    "data-list-id",
    (dragTargetId: string) => {
      addToList({
        bookmarkId: bookmark.id,
        listId: dragTargetId,
      });
    },
    setDraggingState,
  );

  let comp;
  switch (bookmark.content.type) {
    case "link":
      comp = <LinkCard bookmark={{ ...bookmark, content: bookmark.content }} />;
      break;
    case "text":
      comp = <TextCard bookmark={{ ...bookmark, content: bookmark.content }} />;
      break;
    case "asset":
      comp = (
        <AssetCard bookmark={{ ...bookmark, content: bookmark.content }} />
      );
      break;
  }

  return (
    <div>
      <Draggable
        handle=".handle"
        key={bookmark.id}
        axis="both"
        disabled={false}
        onStart={dragAndDropFunction.handleDragStart}
        onStop={dragAndDropFunction.handleDragEnd}
        position={{ x: 0, y: 0 }}
        defaultClassNameDragging={"pointer-events-none opacity-60 z-10"}
      >
        {draggingState.isDragging ? (
          <div
            style={{
              left: draggingState.initialX - 20,
              top: draggingState.initialY - 20,
            }}
            className="z-100 absolute mb-4 rounded-lg border border-border bg-card p-5 shadow-md"
          >
            <LucideReact.Bookmark></LucideReact.Bookmark>
          </div>
        ) : (
          <div data-bookmark-id={bookmark.id}>
            <BookmarkCard key={bookmark.id}>{comp}</BookmarkCard>
          </div>
        )}
      </Draggable>
      {draggingState.isDragging ? (
        <div data-bookmark-id={bookmark.id}>
          <BookmarkCard key={bookmark.id}>{comp}</BookmarkCard>
        </div>
      ) : (
        ""
      )}
    </div>
  );
}
