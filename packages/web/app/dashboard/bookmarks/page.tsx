import AddLink from "./components/AddLink";
import BookmarksGrid from "./components/BookmarksGrid";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Remember - Bookmarks",
};

export default async function Bookmarks() {
  return (
    <div className="flex flex-col">
      <div>
        <AddLink />
      </div>
      <div>
        <BookmarksGrid />
      </div>
    </div>
  );
}
