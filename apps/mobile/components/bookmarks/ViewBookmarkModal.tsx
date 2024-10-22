import React from "react";
import { Keyboard, Text } from "react-native";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetModalProps,
  BottomSheetScrollView,
  BottomSheetView,
  TouchableWithoutFeedback,
} from "@gorhom/bottom-sheet";

import { useUpdateBookmark } from "@hoarder/shared-react/hooks/bookmarks";
import { isBookmarkStillTagging } from "@hoarder/shared-react/utils/bookmarkUtils";
import { BookmarkTypes, ZBookmark } from "@hoarder/shared/types/bookmarks";

import { Input } from "../ui/Input";
import PageTitle from "../ui/PageTitle";
import { Skeleton } from "../ui/Skeleton";
import TagPill from "./TagPill";

function TagList({ bookmark }: { bookmark: ZBookmark }) {
  return (
    <BottomSheetView className="flex flex-row items-center gap-4">
      <Text>Tags</Text>
      {isBookmarkStillTagging(bookmark) ? (
        <>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </>
      ) : bookmark.tags.length > 0 ? (
        <BottomSheetView className="flex flex-row flex-wrap gap-2">
          {bookmark.tags.map((t) => (
            <TagPill key={t.id} tag={t} />
          ))}
        </BottomSheetView>
      ) : (
        <Text>No tags</Text>
      )}
    </BottomSheetView>
  );
}

function NotesEditor({ bookmark }: { bookmark: ZBookmark }) {
  const { mutate, isPending } = useUpdateBookmark();
  return (
    <BottomSheetView className="flex flex-row items-center gap-4">
      <Text>Notes</Text>

      <Input
        className="flex-1"
        editable={!isPending}
        multiline={true}
        numberOfLines={3}
        loading={isPending}
        placeholder="Notes"
        textAlignVertical="top"
        onEndEditing={(ev) =>
          mutate({
            bookmarkId: bookmark.id,
            note: ev.nativeEvent.text,
          })
        }
        defaultValue={bookmark.note ?? ""}
      />
    </BottomSheetView>
  );
}

const ViewBookmarkModal = React.forwardRef<
  BottomSheetModal,
  Omit<
    BottomSheetModalProps,
    "children" | "backdropComponent" | "onDismiss"
  > & {
    bookmark: ZBookmark;
  }
>(({ bookmark, ...props }, ref) => {
  let title = null;
  switch (bookmark.content.type) {
    case BookmarkTypes.LINK:
      title = bookmark.title ?? bookmark.content.title;
      break;
    case BookmarkTypes.TEXT:
      title = bookmark.title;
      break;
    case BookmarkTypes.ASSET:
      title = bookmark.title ?? bookmark.content.fileName;
      break;
  }
  return (
    <BottomSheetModal
      ref={ref}
      backdropComponent={(props) => (
        <BottomSheetBackdrop
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          {...props}
        />
      )}
      {...props}
    >
      <BottomSheetScrollView className="flex flex-1">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <BottomSheetView className="flex flex-1">
            <PageTitle title={title ?? "Untitled"} className="line-clamp-2" />
            <BottomSheetView className="gap-4 px-4">
              <TagList bookmark={bookmark} />
              <NotesEditor bookmark={bookmark} />
            </BottomSheetView>
          </BottomSheetView>
        </TouchableWithoutFeedback>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

ViewBookmarkModal.displayName = "ViewBookmarkModal";

export default ViewBookmarkModal;
