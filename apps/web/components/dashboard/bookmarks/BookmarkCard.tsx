import { api } from "@/lib/trpc";

import { isBookmarkStillLoading } from "@karakeep/shared-react/utils/bookmarkUtils";
import { BookmarkTypes, ZBookmark } from "@karakeep/shared/types/bookmarks";

import AssetCard from "./AssetCard";
import LinkCard from "./LinkCard";
import TextCard from "./TextCard";
import UnknownCard from "./UnknownCard";

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
    case BookmarkTypes.UNKNOWN:
      return <UnknownCard className={className} bookmark={bookmark} />;
  }
}
