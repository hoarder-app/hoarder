"use client";

import { useEffect, useState } from "react";
import BulkBookmarksAction from "@/components/dashboard/BulkBookmarksAction";
import ChangeLayout from "@/components/dashboard/ChangeLayout";
import { useTheme } from "next-themes";

export default function GlobalActions() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div />;
  }

  return (
    <div
      className={`flex min-w-max flex-wrap overflow-hidden rounded-md border transition-all duration-300 ${
        resolvedTheme === "dark"
          ? "bg-gray-900 text-white"
          : "bg-white text-gray-900"
      }`}
    >
      <ChangeLayout />
      <BulkBookmarksAction />
    </div>
  );
}
