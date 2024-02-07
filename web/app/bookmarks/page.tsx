import AddLink from "./components/AddLink";
import LinksGrid from "./components/LinksGrid";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Remember - Bookmarks",
};

export default async function Bookmarks() {
  return (
    <>
      <AddLink />
      <LinksGrid />
    </>
  );
}
