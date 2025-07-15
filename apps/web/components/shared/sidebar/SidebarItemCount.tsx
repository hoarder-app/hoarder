"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/trpc";

interface SidebarItemCountProps {
  type: "bookmarks" | "tags" | "highlights" | "archived";
}

export default function SidebarItemCount({ type }: SidebarItemCountProps) {
  const [mounted, setMounted] = useState(false);
  const { data: stats } = api.users.stats.useQuery();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; // Return null during SSR and initial render to avoid hydration mismatch
  }

  let count: number | undefined;
  switch (type) {
    case "bookmarks":
      count = stats?.numBookmarks;
      break;
    case "tags":
      count = stats?.numTags;
      break;
    case "highlights":
      count = stats?.numHighlights;
      break;
    case "archived":
      count = stats?.numArchived;
      break;
  }

  if (typeof count !== "number") {
    return null;
  }

  return (
    <Badge className="m-auto mr-2 flex h-5 w-5 justify-center rounded-full border border-sky-500/30 bg-sky-500/20 font-mono tabular-nums text-sky-400 hover:bg-sky-500/20">
      {count.toLocaleString()}
    </Badge>
  );
}
