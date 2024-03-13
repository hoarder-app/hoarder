"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link, NotebookPen } from "lucide-react";

import { SearchInput } from "../search/SearchInput";
import { AddLinkButton } from "./AddLinkButton";
import { BookmarkedTextEditor } from "./BookmarkedTextEditor";

function AddText() {
  const [isEditorOpen, setEditorOpen] = useState(false);

  return (
    <div className="flex">
      <BookmarkedTextEditor open={isEditorOpen} setOpen={setEditorOpen} />
      <Button className="m-auto" onClick={() => setEditorOpen(true)}>
        <NotebookPen />
      </Button>
    </div>
  );
}

function AddLink() {
  return (
    <div className="flex">
      <AddLinkButton>
        <Button className="m-auto">
          <Link />
        </Button>
      </AddLinkButton>
    </div>
  );
}

export default function TopNav() {
  return (
    <div className="container flex gap-2 py-4">
      <SearchInput />
      <AddLink />
      <AddText />
    </div>
  );
}
