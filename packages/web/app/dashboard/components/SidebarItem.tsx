"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SidebarItem({
  name,
  logo,
  path,
}: {
  name: string;
  logo: React.ReactNode;
  path: string;
}) {
  const currentPath = usePathname();
  return (
    <li
      className={cn(
        "rounded-lg  hover:bg-slate-100",
        path == currentPath ? "bg-slate-100" : "",
      )}
    >
      <Link href={path} className="flex w-full space-x-2 px-3 py-2">
        {logo}
        <span className="my-auto"> {name} </span>
      </Link>
    </li>
  );
}
