"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function SidebarItem({
  name,
  logo,
  path,
  isCollapsed,
  className,
  style,
  collapseButton,
  right = null,
}: {
  name: string;
  logo: React.ReactNode;
  path: string;
  isCollapsed: boolean;
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
        isCollapsed ? "flex justify-center" : "flex items-center justify-start",
      )}
      style={style}
    >
      {collapseButton}
      <Link href={path} className="flex w-full items-center gap-x-2">
        <div className="flex items-center">{logo}</div>
        {!isCollapsed && <span className="my-auto">{name}</span>}
        {right}
      </Link>
    </li>
  );
}
