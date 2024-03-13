import Link from "next/link";
import { badgeVariants } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import type { ZBookmark } from "@hoarder/trpc/types/bookmarks";

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
              "text-nowrap hover:bg-foreground hover:text-secondary",
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
