import type { ActionMeta } from "react-select";
import { toast } from "@/components/ui/use-toast";
import { api } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";
import CreateableSelect from "react-select/creatable";

import type { ZBookmark } from "@hoarder/trpc/types/bookmarks";
import type { ZAttachedByEnum } from "@hoarder/trpc/types/tags";

interface EditableTag {
  attachedBy: ZAttachedByEnum;
  value?: string;
  label: string;
}

export function TagsEditor({ bookmark }: { bookmark: ZBookmark }) {
  const bookmarkInvalidationFunction =
    api.useUtils().bookmarks.getBookmark.invalidate;

  const { mutate, isPending: isMutating } =
    api.bookmarks.updateTags.useMutation({
      onSuccess: () => {
        toast({
          description: "Tags has been updated!",
        });
        bookmarkInvalidationFunction({ bookmarkId: bookmark.id });
        // TODO(bug) Invalidate the tag views as well
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: "Something went wrong",
          description: "There was a problem with your request.",
        });
      },
    });

  const { data: existingTags, isLoading: isExistingTagsLoading } =
    api.tags.list.useQuery();

  const onChange = (
    _option: readonly EditableTag[],
    actionMeta: ActionMeta<EditableTag>,
  ) => {
    switch (actionMeta.action) {
      case "remove-value": {
        if (actionMeta.removedValue.value) {
          mutate({
            bookmarkId: bookmark.id,
            attach: [],
            detach: [{ tagId: actionMeta.removedValue.value }],
          });
        }
        break;
      }
      case "create-option": {
        mutate({
          bookmarkId: bookmark.id,
          attach: [{ tag: actionMeta.option.label }],
          detach: [],
        });
        break;
      }
      case "select-option": {
        if (actionMeta.option) {
          mutate({
            bookmarkId: bookmark.id,
            attach: [
              { tag: actionMeta.option.label, tagId: actionMeta.option?.value },
            ],
            detach: [],
          });
        }
        break;
      }
    }
  };

  return (
    <CreateableSelect
      onChange={onChange}
      options={
        existingTags?.tags.map((t) => ({
          label: t.name,
          value: t.id,
          attachedBy: "human" as const,
        })) ?? []
      }
      value={bookmark.tags.map((t) => ({
        label: t.name,
        value: t.id,
        attachedBy: t.attachedBy,
      }))}
      isMulti
      closeMenuOnSelect={false}
      isClearable={false}
      isLoading={isExistingTagsLoading || isMutating}
      styles={{
        multiValueRemove: () => ({
          "background-color": "transparent",
        }),
        valueContainer: (styles) => ({
          ...styles,
          padding: "0.5rem",
        }),
      }}
      components={{
        MultiValueContainer: ({ children, data }) => (
          <div
            className={cn(
              "flex min-h-8 space-x-1 rounded px-2",
              (data as { attachedBy: string }).attachedBy == "ai"
                ? "bg-gradient-to-tr from-purple-500 to-purple-400 text-white"
                : "bg-gray-200",
            )}
          >
            {children}
          </div>
        ),
        MultiValueLabel: ({ children, data }) => (
          <div className="m-auto flex gap-2">
            {(data as { attachedBy: string }).attachedBy == "ai" && (
              <Sparkles className="m-auto size-4" />
            )}
            {children}
          </div>
        ),
      }}
      classNames={{
        multiValueRemove: () => "my-auto",
        valueContainer: () => "gap-2",
        menuList: () => "text-sm",
      }}
    />
  );
}
