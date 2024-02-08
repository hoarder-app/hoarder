import AddLink from "./components/AddLink";
import LinksGrid from "./components/LinksGrid";
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
        <LinksGrid />
      </div>
    </div>
  );
}
