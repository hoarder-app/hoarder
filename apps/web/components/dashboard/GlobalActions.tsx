"use client";

import BulkBookmarksAction from "@/components/dashboard/BulkBookmarksAction";
import ChangeLayout from "@/components/dashboard/ChangeLayout";
import { cn } from "@/lib/utils";
import bulkActions from "@/store/bulkBookmarksAction";

export default function GlobalActions() {
  const { isBulkEditEnabled } = bulkActions();

  return (
    <div
      className={cn(
        "flex rounded-md border bg-background transition-all",
        isBulkEditEnabled ? "w-[251px]" : "w-[102px]",
      )}
    >
      <ChangeLayout />
      <BulkBookmarksAction />
    </div>
  );
}
