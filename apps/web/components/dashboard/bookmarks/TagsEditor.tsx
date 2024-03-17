import type { KeyboardEvent } from "react";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { api } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Sparkles, X } from "lucide-react";

import type { ZBookmark } from "@hoarder/trpc/types/bookmarks";
import type { ZAttachedByEnum } from "@hoarder/trpc/types/tags";

interface EditableTag {
  attachedBy: ZAttachedByEnum;
  id?: string;
  name: string;
}

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
      className="h-8 w-full border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
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

export function TagsEditor({ bookmark }: { bookmark: ZBookmark }) {
  const [tags, setTags] = useState<Map<string, EditableTag>>(new Map());
  useEffect(() => {
    const m = new Map<string, EditableTag>();
    for (const t of bookmark.tags) {
      m.set(t.name, { attachedBy: t.attachedBy, id: t.id, name: t.name });
    }
    setTags(m);
  }, [bookmark.tags]);

  const bookmarkInvalidationFunction =
    api.useUtils().bookmarks.getBookmark.invalidate;

  const { mutate } = api.bookmarks.updateTags.useMutation({
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

  return (
    <div className="flex flex-wrap gap-2 rounded border p-2">
      {[...tags.values()].map((t) => (
        <TagPill
          key={t.name}
          tag={t}
          deleteCB={() => {
            setTags((m) => {
              const newMap = new Map(m);
              newMap.delete(t.name);
              if (t.id) {
                mutate({
                  bookmarkId: bookmark.id,
                  attach: [],
                  detach: [{ tagId: t.id }],
                });
              }
              return newMap;
            });
          }}
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
              mutate({
                bookmarkId: bookmark.id,
                attach: [{ tag: val }],
                detach: [],
              });
              return newMap;
            });
          }}
        />
      </div>
    </div>
  );
}
