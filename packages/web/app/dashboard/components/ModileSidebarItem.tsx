"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function MobileSidebarItem({
  logo,
  path,
}: {
  logo: React.ReactNode;
  path: string;
}) {
  const currentPath = usePathname();
  return (
    <li
      className={cn(
        "flex w-full rounded-lg hover:bg-gray-50",
        path == currentPath ? "bg-gray-50" : "",
      )}
    >
      <Link href={path} className="mx-auto px-3 py-2">
        {logo}
      </Link>
    </li>
  );
}
