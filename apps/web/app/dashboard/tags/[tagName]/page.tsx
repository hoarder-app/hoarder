import { notFound } from "next/navigation";
import Bookmarks from "@/components/dashboard/bookmarks/Bookmarks";
import DeleteTagButton from "@/components/dashboard/tags/DeleteTagButton";
import { Button } from "@/components/ui/button";
import { api } from "@/server/api/client";
import { TRPCError } from "@trpc/server";
import { Trash2 } from "lucide-react";

export default async function TagPage({
  params,
}: {
  params: { tagName: string };
}) {
  const tagName = decodeURIComponent(params.tagName);

  let tag;
  try {
    tag = await api.tags.get({ tagName });
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
          <span className="text-2xl">{tagName}</span>
          <DeleteTagButton
            tagName={tag.name}
            tagId={tag.id}
            navigateOnDelete={true}
          >
            <Button className="mt-auto flex gap-2" variant="destructiveOutline">
              <Trash2 className="size-5" />
              <span className="hidden md:block">Delete Tag</span>
            </Button>
          </DeleteTagButton>
        </div>
      }
      query={{ tagId: tag.id }}
      showEditorCard={true}
    />
  );
}
