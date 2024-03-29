import { notFound, redirect } from "next/navigation";
import Bookmarks from "@/components/dashboard/bookmarks/Bookmarks";
import { api } from "@/server/api/client";
import { getServerAuthSession } from "@/server/auth";
import { TRPCError } from "@trpc/server";

export default async function TagPage({
  params,
}: {
  params: { tagName: string };
}) {
  const session = await getServerAuthSession();
  if (!session) {
    redirect("/");
  }
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
      header={<p className="text-2xl">{tagName}</p>}
      query={{ archived: false, tagId: tag.id }}
    />
  );
}
