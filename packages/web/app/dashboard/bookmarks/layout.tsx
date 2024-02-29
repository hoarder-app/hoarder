import React from "react";
import AddBookmark from "./components/AddBookmark";
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
        <AddBookmark />
      </div>
      <hr />
      <div className="my-4 flex-1 pb-4">{children}</div>
    </div>
  );
}
