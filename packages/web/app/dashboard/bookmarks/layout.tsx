import React from "react";
import AddLink from "./components/AddLink";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Remember - Bookmarks",
};

export default function BookmarksLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col">
      <div>
        <AddLink />
      </div>
      <hr />
      <div className="my-4">{children}</div>
    </div>
  );
}
