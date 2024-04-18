"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function SidebarItem({
  name,
  logo,
  path,
  className,
  style,
  collapseButton,
  right = null,
}: {
  name: string;
  logo: React.ReactNode;
  path: string;
  style?: React.CSSProperties;
  className?: string;
  right?: React.ReactNode;
  collapseButton?: React.ReactNode;
}) {
  const currentPath = usePathname();
  return (
    <li
      className={cn(
        "relative rounded-lg px-3 py-2 hover:bg-accent",
        path == currentPath ? "bg-accent/50" : "",
        className,
      )}
      style={style}
    >
      {collapseButton}
      <div className="flex justify-between">
        <Link href={path} className="flex w-full gap-x-2">
          {logo}
          <span className="my-auto"> {name} </span>
        </Link>
        {right}
      </div>
    </li>
  );
}
