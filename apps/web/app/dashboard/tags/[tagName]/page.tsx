import { notFound } from "next/navigation";
import Bookmarks from "@/components/dashboard/bookmarks/Bookmarks";
import DeleteTagButton from "@/components/dashboard/tags/DeleteTagButton";
import { api } from "@/server/api/client";
import { TRPCError } from "@trpc/server";

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
          <DeleteTagButton tagName={tag.name} tagId={tag.id} />
        </div>
      }
      query={{ tagId: tag.id }}
      showEditorCard={true}
    />
  );
}
