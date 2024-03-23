import React from "react";
import TopNav from "@/components/dashboard/bookmarks/TopNav";
import UploadDropzone from "@/components/dashboard/UploadDropzone";

export default function BookmarksLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <UploadDropzone>
      <div className="flex h-full flex-col">
        <div>
          <TopNav />
        </div>
        <hr />
        <div className="my-4 flex-1 pb-4">{children}</div>
      </div>
    </UploadDropzone>
  );
}
