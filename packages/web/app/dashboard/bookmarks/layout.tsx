import React from "react";
import AddLink from "./components/AddLink";
import type { Metadata } from "next";

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
        <AddLink />
      </div>
      <hr />
      <div className="my-4 flex-1">{children}</div>
    </div>
  );
}
