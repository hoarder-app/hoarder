"use client";

import BulkBookmarksAction from "@/components/dashboard/BulkBookmarksAction";
import ChangeLayout from "@/components/dashboard/ChangeLayout";

export default function GlobalActions() {
  return (
    <div className="flex min-w-max flex-wrap overflow-hidden">
      <ChangeLayout />
      <BulkBookmarksAction />
    </div>
  );
}
