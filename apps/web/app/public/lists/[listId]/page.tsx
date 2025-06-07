import type { Metadata } from "next";
import { notFound } from "next/navigation";
import NoBookmarksBanner from "@/components/dashboard/bookmarks/NoBookmarksBanner";
import PublicBookmarkGrid from "@/components/public/lists/PublicBookmarkGrid";
import PublicListHeader from "@/components/public/lists/PublicListHeader";
import { Separator } from "@/components/ui/separator";
import { api } from "@/server/api/client";
import { TRPCError } from "@trpc/server";

export async function generateMetadata({
  params,
}: {
  params: { listId: string };
}): Promise<Metadata> {
  try {
    const resp = await api.publicBookmarks.getPublicListMetadata({
      listId: params.listId,
    });
    return {
      title: `${resp.name} by ${resp.ownerName} - Karakeep`,
      description:
        resp.description && resp.description.length > 0
          ? `${resp.description} by ${resp.ownerName} on Karakeep`
          : undefined,
      applicationName: "Karakeep",
      authors: [
        {
          name: resp.ownerName,
        },
      ],
    };
  } catch (e) {
    if (e instanceof TRPCError && e.code === "NOT_FOUND") {
      notFound();
    }
  }
  return {
    title: "Karakeep",
  };
}

export default async function PublicListPage({
  params,
}: {
  params: { listId: string };
}) {
  try {
    const { list, bookmarks, nextCursor } =
      await api.publicBookmarks.getPublicBookmarksInList({
        listId: params.listId,
      });
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">
            {list.icon} {list.name}
            {list.description && (
              <span className="mx-2 text-lg text-gray-400">
                {`(${list.description})`}
              </span>
            )}
          </span>
        </div>
        <Separator />
        <PublicListHeader
          list={{
            id: params.listId,
            numItems: list.numItems,
          }}
        />
        {list.numItems > 0 ? (
          <PublicBookmarkGrid
            list={{
              id: params.listId,
              name: list.name,
              description: list.description,
              icon: list.icon,
              numItems: list.numItems,
              ownerName: list.ownerName,
            }}
            bookmarks={bookmarks}
            nextCursor={nextCursor}
          />
        ) : (
          <NoBookmarksBanner />
        )}
      </div>
    );
  } catch (e) {
    if (e instanceof TRPCError && e.code === "NOT_FOUND") {
      notFound();
    }
  }
}
