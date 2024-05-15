import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { X } from "lucide-react";

import DeleteTagConfirmationDialog from "./DeleteTagConfirmationDialog";

const PILL_STYLE =
  "flex gap-2 rounded-md border border-border bg-background px-2 py-1 text-foreground hover:bg-foreground hover:text-background";

export function TagPill({
  id,
  name,
  count,
  isDraggable,
}: {
  id: string;
  name: string;
  count: number;
  isDraggable: boolean;
}) {
  // When the element is draggable, do not generate a link. Links can be dragged into e.g. the tab-bar and therefore dragging the TagPill does not work properly
  if (isDraggable) {
    return (
      <div className={PILL_STYLE} data-id={id}>
        {name} <Separator orientation="vertical" /> {count}
      </div>
    );
  }

  return (
    <div className="group relative flex">
      <Link className={PILL_STYLE} href={`/dashboard/tags/${id}`}>
        {name} <Separator orientation="vertical" /> {count}
      </Link>

      <DeleteTagConfirmationDialog tag={{ name, id }}>
        <Button
          size="none"
          variant="secondary"
          className="-translate-1/2 absolute -right-1 -top-1 hidden rounded-full group-hover:block"
        >
          <X className="size-3" />
        </Button>
      </DeleteTagConfirmationDialog>
    </div>
  );
}
