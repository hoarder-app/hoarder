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
  linkClassName,
  style,
  collapseButton,
  right = null,
}: {
  name: string;
  logo: React.ReactNode;
  path: string;
  style?: React.CSSProperties;
  className?: string;
  linkClassName?: string;
  right?: React.ReactNode;
  collapseButton?: React.ReactNode;
}) {
  const currentPath = usePathname();
  return (
    <li
      className={cn(
        "relative rounded-lg hover:bg-accent",
        path == currentPath ? "bg-accent/50" : "",
        className,
      )}
      style={style}
    >
      {collapseButton}
      <Link
        href={path}
        className={cn(
          "flex w-full items-center rounded-[inherit] px-3 py-2",
          linkClassName,
        )}
      >
        <div className="flex w-full justify-between">
          <div className="flex items-center gap-x-2">
            {logo}
            <span>{name}</span>
          </div>
          {right}
        </div>
      </Link>
    </li>
  );
}
