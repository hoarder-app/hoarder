"use client";

import { useEffect, useState } from "react";
import { TagDuplicationDetection } from "@/components/dashboard/cleanups/TagDuplicationDetention";
import { Separator } from "@/components/ui/separator";
import { Paintbrush, Tags } from "lucide-react";
import { useTheme } from "next-themes";

export default function Cleanups() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div
      className={`flex flex-col gap-y-4 rounded-md border p-4 ${
        mounted && theme === "dark"
          ? "bg-gray-800 text-white"
          : "bg-white text-gray-900"
      }`}
    >
      <span className="flex items-center gap-1 text-2xl">
        <Paintbrush />
        Cleanups
      </span>
      <Separator />
      <span className="flex items-center gap-1 text-xl">
        <Tags />
        Duplicate Tags
      </span>
      <Separator />
      <TagDuplicationDetection />
    </div>
  );
}
