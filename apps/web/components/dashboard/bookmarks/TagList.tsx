import Link from "next/link";
import { badgeVariants } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import type { ZBookmark } from "@hoarder/shared/types/bookmarks";

export default function TagList({
  bookmark,
  loading,
  className,
}: {
  bookmark: ZBookmark;
  loading?: boolean;
  className?: string;
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
        <div key={t.id} className={className}>
          <Link
            key={t.id}
            className={cn(
              badgeVariants({ variant: "outline" }),
              "text-nowrap font-normal hover:bg-foreground hover:text-secondary",
            )}
            href={`/dashboard/tags/${t.id}`}
          >
            {t.name}
          </Link>
        </div>
      ))}
    </>
  );
}
