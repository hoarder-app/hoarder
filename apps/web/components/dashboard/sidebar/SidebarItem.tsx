"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function SidebarItem({
  name,
  logo,
  path,
  className,
}: {
  name: string;
  logo: React.ReactNode;
  path: string;
  className?: string;
}) {
  const currentPath = usePathname();
  return (
    <li
      className={cn(
        "rounded-lg px-3 py-2 hover:bg-accent",
        path == currentPath ? "bg-accent/50" : "",
        className,
      )}
    >
      <Link href={path} className="flex w-full gap-x-2">
        {logo}
        <span className="my-auto"> {name} </span>
      </Link>
    </li>
  );
}
