import { Badge } from "@/components/ui/badge";
import {
  ImageCard,
  ImageCardBody,
  ImageCardFooter,
  ImageCardTitle,
} from "@/components/ui/imageCard";
import { ZBookmark } from "@/lib/types/api/bookmarks";
import Link from "next/link";
import BookmarkOptions from "./BookmarkOptions";

export default function LinkCard({ bookmark }: { bookmark: ZBookmark }) {
  const link = bookmark.content;
  const parsedUrl = new URL(link.url);

  return (
    <ImageCard
      className={
        "border-grey-100 border bg-gray-50 duration-300 ease-in hover:border-blue-300 hover:transition-all"
      }
      image={link?.imageUrl ?? undefined}
    >
      <ImageCardTitle>
        <Link className="line-clamp-2" href={link.url}>
          {link?.title ?? parsedUrl.host}
        </Link>
      </ImageCardTitle>
      <ImageCardBody className="overflow-clip py-2">
        {bookmark.tags.map((t) => (
          <Badge
            variant="default"
            className="bg-gray-300 text-gray-500 hover:text-white"
            key={t.id}
          >
            #{t.name}
          </Badge>
        ))}
      </ImageCardBody>
      <ImageCardFooter>
        <div className="flex justify-between text-gray-500">
          <div className="my-auto">
            <Link className="line-clamp-1 hover:text-black" href={link.url}>
              {parsedUrl.host}
            </Link>
          </div>
          <BookmarkOptions bookmark={bookmark} />
        </div>
      </ImageCardFooter>
    </ImageCard>
  );
}
