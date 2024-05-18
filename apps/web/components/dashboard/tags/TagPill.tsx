import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { X } from "lucide-react";

import DeleteTagConfirmationDialog from "./DeleteTagConfirmationDialog";

export function TagPill({
  id,
  name,
  count,
}: {
  id: string;
  name: string;
  count: number;
}) {
  return (
    <div className="group relative flex">
      <Link
        className={
          "flex gap-2 rounded-md border border-border bg-background px-2 py-1 text-foreground hover:bg-foreground hover:text-background"
        }
        href={`/dashboard/tags/${id}`}
        data-id={id}
      >
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
