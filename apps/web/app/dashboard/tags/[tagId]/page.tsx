import { notFound } from "next/navigation";
import Bookmarks from "@/components/dashboard/bookmarks/Bookmarks";
import EditableTagName from "@/components/dashboard/tags/EditableTagName";
import { TagOptions } from "@/components/dashboard/tags/TagOptions";
import { Button } from "@/components/ui/button";
import { api } from "@/server/api/client";
import { TRPCError } from "@trpc/server";
import { MoreHorizontal } from "lucide-react";

export default async function TagPage({
  params,
}: {
  params: { tagId: string };
}) {
  let tag;
  try {
    tag = await api.tags.get({ tagId: params.tagId });
  } catch (e) {
    if (e instanceof TRPCError) {
      if (e.code == "NOT_FOUND") {
        notFound();
      }
    }
    throw e;
  }

  return (
    <Bookmarks
      header={
        <div className="flex justify-between">
          <EditableTagName
            tag={{ id: tag.id, name: tag.name }}
            className="text-2xl"
          />

          <TagOptions tag={tag}>
            <Button variant="ghost">
              <MoreHorizontal />
            </Button>
          </TagOptions>
        </div>
      }
      query={{ tagId: tag.id }}
      showEditorCard={true}
    />
  );
}
