import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { ZBookmark } from "@/lib/types/api/bookmarks";

export default function TagList({
  bookmark,
  loading,
}: {
  bookmark: ZBookmark;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
      </div>
    );
  }
  return (
    <>
      {bookmark.tags.map((t) => (
        <Link
          className="flex h-full flex-col justify-end"
          key={t.id}
          href={`/dashboard/tags/${t.name}`}
        >
          <Badge
            variant="default"
            className="text-nowrap bg-gray-300 text-gray-500 hover:text-white"
          >
            #{t.name}
          </Badge>
        </Link>
      ))}
    </>
  );
}
