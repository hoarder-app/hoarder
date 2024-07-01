import { api } from "@/lib/trpc";

import { isBookmarkStillLoading } from "@hoarder/shared-react/utils/bookmarkUtils";
import { BookmarkTypes, ZBookmark } from "@hoarder/shared/types/bookmarks";

import AssetCard from "./AssetCard";
import LinkCard from "./LinkCard";
import TextCard from "./TextCard";

export default function BookmarkCard({
  bookmark: initialData,
  className,
}: {
  bookmark: ZBookmark;
  className?: string;
}) {
  const { data: bookmark } = api.bookmarks.getBookmark.useQuery(
    {
      bookmarkId: initialData.id,
    },
    {
      initialData,
      refetchInterval: (query) => {
        const data = query.state.data;
        if (!data) {
          return false;
        }
        if (isBookmarkStillLoading(data)) {
          return 1000;
        }
        return false;
      },
    },
  );

  switch (bookmark.content.type) {
    case BookmarkTypes.LINK:
      return (
        <LinkCard
          className={className}
          bookmark={{ ...bookmark, content: bookmark.content }}
        />
      );
    case BookmarkTypes.TEXT:
      return (
        <TextCard
          className={className}
          bookmark={{ ...bookmark, content: bookmark.content }}
        />
      );
    case BookmarkTypes.ASSET:
      return (
        <AssetCard
          className={className}
          bookmark={{ ...bookmark, content: bookmark.content }}
        />
      );
  }
}
