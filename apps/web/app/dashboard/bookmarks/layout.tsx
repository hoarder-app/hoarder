import type { Metadata } from "next";
import React from "react";
import TopNav from "@/components/dashboard/bookmarks/TopNav";

export const metadata: Metadata = {
  title: "Hoarder - Bookmarks",
};

export default function BookmarksLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-full flex-col">
      <div>
        <TopNav />
      </div>
      <hr />
      <div className="my-4 flex-1 pb-4">{children}</div>
    </div>
  );
}
