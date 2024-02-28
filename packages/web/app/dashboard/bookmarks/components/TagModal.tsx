import { ActionButton } from "@/components/ui/action-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { api } from "@/lib/trpc";
import { ZBookmark } from "@/lib/types/api/bookmarks";
import { ZAttachedByEnum } from "@/lib/types/api/tags";
import { cn } from "@/lib/utils";
import { Sparkles, X } from "lucide-react";
import { useState, KeyboardEvent } from "react";

type EditableTag = { attachedBy: ZAttachedByEnum; id?: string; name: string };

function TagAddInput({ addTag }: { addTag: (tag: string) => void }) {
  const onKeyUp = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      addTag(e.currentTarget.value);
      e.currentTarget.value = "";
    }
  };
  return (
    <Input
      onKeyUp={onKeyUp}
      className="h-8 w-full border-none focus-visible:ring-0 focus-visible:ring-offset-0"
    />
  );
}

function TagPill({
  tag,
  deleteCB,
}: {
  tag: { attachedBy: ZAttachedByEnum; id?: string; name: string };
  deleteCB: () => void;
}) {
  const isAttachedByAI = tag.attachedBy == "ai";
  return (
    <div
      className={cn(
        "flex min-h-8 space-x-1 rounded px-2",
        isAttachedByAI
          ? "bg-gradient-to-tr from-purple-500 to-purple-400 text-white"
          : "bg-gray-200",
      )}
    >
      {isAttachedByAI && <Sparkles className="m-auto size-4" />}
      <p className="m-auto">{tag.name}</p>
      <button className="m-auto size-4" onClick={deleteCB}>
        <X className="size-4" />
      </button>
    </div>
  );
}

function TagEditor({
  tags,
  setTags,
}: {
  tags: Map<string, EditableTag>;
  setTags: (
    cb: (m: Map<string, EditableTag>) => Map<string, EditableTag>,
  ) => void;
}) {
  return (
    <div className="mt-4 flex flex-wrap gap-2 rounded border p-2">
      {[...tags.values()].map((t) => (
        <TagPill
          key={t.name}
          tag={t}
          deleteCB={() =>
            setTags((m) => {
              const newMap = new Map(m);
              newMap.delete(t.name);
              return newMap;
            })
          }
        />
      ))}
      <div className="flex-1">
        <TagAddInput
          addTag={(val) => {
            setTags((m) => {
              if (m.has(val)) {
                // Tag already exists
                // Do nothing
                return m;
              }
              const newMap = new Map(m);
              newMap.set(val, { attachedBy: "human", name: val });
              return newMap;
            });
          }}
        />
      </div>
    </div>
  );
}

export default function TagModal({
  bookmark,
  open,
  setOpen,
}: {
  bookmark: ZBookmark;
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const [tags, setTags] = useState(() => {
    const m = new Map<string, EditableTag>();
    for (const t of bookmark.tags) {
      m.set(t.name, { attachedBy: t.attachedBy, id: t.id, name: t.name });
    }
    return m;
  });

  const bookmarkInvalidationFunction =
    api.useUtils().bookmarks.getBookmark.invalidate;

  const { mutate, isPending } = api.bookmarks.updateTags.useMutation({
    onSuccess: () => {
      toast({
        description: "Tags has been updated!",
      });
      bookmarkInvalidationFunction({ bookmarkId: bookmark.id });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: "There was a problem with your request.",
      });
    },
  });

  const onSaveButton = () => {
    const exitingTags = new Set(bookmark.tags.map((t) => t.name));

    const attach = [];
    const detach = [];
    for (const t of tags.values()) {
      if (!exitingTags.has(t.name)) {
        attach.push({ tag: t.name });
      }
    }
    for (const t of bookmark.tags) {
      if (!tags.has(t.name)) {
        detach.push({ tagId: t.id });
      }
    }
    mutate({
      bookmarkId: bookmark.id,
      attach,
      detach,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Tags</DialogTitle>
        </DialogHeader>
        <TagEditor tags={tags} setTags={setTags} />
        <DialogFooter className="sm:justify-end">
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Close
            </Button>
          </DialogClose>
          <ActionButton
            type="button"
            loading={isPending}
            onClick={onSaveButton}
          >
            Save
          </ActionButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function useTagModel(bookmark: ZBookmark) {
  const [open, setOpen] = useState(false);

  return [
    open,
    setOpen,
    <TagModal
      key={bookmark.id}
      bookmark={bookmark}
      open={open}
      setOpen={setOpen}
    />,
  ] as const;
}
