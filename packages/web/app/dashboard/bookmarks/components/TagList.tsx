import { badgeVariants } from "@/components/ui/badge";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { ZBookmark } from "@/lib/types/api/bookmarks";
import { cn } from "@/lib/utils";

export default function TagList({
  bookmark,
  loading,
}: {
  bookmark: ZBookmark;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="flex w-full flex-col justify-end space-y-2 p-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
      </div>
    );
  }
  return (
    <>
      {bookmark.tags.map((t) => (
        <div key={t.id} className="flex h-full flex-col justify-end">
          <Link
            className={cn(
              badgeVariants({ variant: "outline" }),
              "hover:bg-foreground hover:text-secondary text-nowrap",
            )}
            href={`/dashboard/tags/${t.name}`}
          >
            {t.name}
          </Link>
        </div>
      ))}
    </>
  );
}
