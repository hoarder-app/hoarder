import React, { useState } from "react";
import { Keyboard, Pressable, Text } from "react-native";
import ImageView from "react-native-image-viewing";
import { useAssetUrl } from "@/lib/hooks";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetModalProps,
  BottomSheetScrollView,
  BottomSheetView,
  TouchableWithoutFeedback,
} from "@gorhom/bottom-sheet";

import {
  useUpdateBookmark,
  useUpdateBookmarkText,
} from "@hoarder/shared-react/hooks/bookmarks";
import { isBookmarkStillTagging } from "@hoarder/shared-react/utils/bookmarkUtils";
import { BookmarkTypes, ZBookmark } from "@hoarder/shared/types/bookmarks";

import { Input } from "../ui/Input";
import PageTitle from "../ui/PageTitle";
import { Skeleton } from "../ui/Skeleton";
import { useToast } from "../ui/Toast";
import BookmarkAssetImage from "./BookmarkAssetImage";
import BookmarkTextMarkdown from "./BookmarkTextMarkdown";
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

function BookmarkTextView({ bookmark }: { bookmark: ZBookmark }) {
  if (bookmark.content.type !== BookmarkTypes.TEXT) {
    throw new Error("Wrong content type rendered");
  }
  const { toast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(bookmark.content.text);

  const { mutate, isPending } = useUpdateBookmarkText({
    onError: () => {
      toast({
        message: "Something went wrong",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      setIsEditing(false);
    },
  });

  return (
    <BottomSheetView>
      {isEditing ? (
        <Input
          loading={isPending}
          editable={!isPending}
          onBlur={() =>
            mutate({
              bookmarkId: bookmark.id,
              text: content,
            })
          }
          value={content}
          onChangeText={setContent}
          multiline
          autoFocus
        />
      ) : (
        <Pressable onPress={() => setIsEditing(true)}>
          <BottomSheetView className="rounded-xl border border-accent p-2">
            <BookmarkTextMarkdown text={content} />
          </BottomSheetView>
        </Pressable>
      )}
    </BottomSheetView>
  );
}

function BookmarkAssetView({ bookmark }: { bookmark: ZBookmark }) {
  const [imageZoom, setImageZoom] = useState(false);
  if (bookmark.content.type !== BookmarkTypes.ASSET) {
    throw new Error("Wrong content type rendered");
  }
  const assetSource = useAssetUrl(bookmark.content.assetId);
  return (
    <BottomSheetView className="flex gap-2">
      <ImageView
        visible={imageZoom}
        imageIndex={0}
        onRequestClose={() => setImageZoom(false)}
        doubleTapToZoomEnabled={true}
        images={[assetSource]}
      />

      <Pressable onPress={() => setImageZoom(true)}>
        <BookmarkAssetImage
          assetId={bookmark.content.assetId}
          className="h-56 min-h-56 w-full object-cover"
        />
      </Pressable>
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
  let comp;
  let title = null;
  switch (bookmark.content.type) {
    case BookmarkTypes.LINK:
      comp = null;
      break;
    case BookmarkTypes.TEXT:
      title = bookmark.title;
      comp = <BookmarkTextView bookmark={bookmark} />;
      break;
    case BookmarkTypes.ASSET:
      title = bookmark.title ?? bookmark.content.fileName;
      comp = <BookmarkAssetView bookmark={bookmark} />;
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
            <PageTitle title={title ?? "Untitled"} />
            <BottomSheetView className="gap-4 px-4">
              {comp}
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
