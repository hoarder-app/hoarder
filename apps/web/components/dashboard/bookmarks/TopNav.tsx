"use client";

import { Link, NotebookPen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookmarkedTextEditor } from "./BookmarkedTextEditor";
import { useState } from "react";
import { AddLinkButton } from "./AddLinkButton";
import { SearchInput } from "../search/SearchInput";

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
