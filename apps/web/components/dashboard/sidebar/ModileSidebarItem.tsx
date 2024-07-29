"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

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
        "flex w-full rounded-lg hover:bg-gray-700",
        path == currentPath ? "bg-gray-700" : "",
      )}
    >
      <Link href={path} className="m-auto px-3 py-2">
        {logo}
      </Link>
    </li>
  );
}
