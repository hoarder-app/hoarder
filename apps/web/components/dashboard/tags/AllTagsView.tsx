"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import InfoTooltip from "@/components/ui/info-tooltip";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/trpc";
import { X } from "lucide-react";

import type { ZGetTagResponse } from "@hoarder/shared/types/tags";

import DeleteTagConfirmationDialog from "./DeleteTagConfirmationDialog";

function TagPill({
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
        className="flex gap-2 rounded-md border border-border bg-background px-2 py-1 text-foreground hover:bg-foreground hover:text-background"
        href={`/dashboard/tags/${id}`}
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

export default function AllTagsView({
  initialData,
}: {
  initialData: ZGetTagResponse[];
}) {
  const { data } = api.tags.list.useQuery(undefined, {
    initialData: { tags: initialData },
  });
  // Sort tags by usage desc
  const allTags = data.tags.sort((a, b) => b.count - a.count);

  const humanTags = allTags.filter((t) => (t.countAttachedBy.human ?? 0) > 0);
  const aiTags = allTags.filter((t) => (t.countAttachedBy.human ?? 0) == 0);

  const tagsToPill = (tags: typeof allTags) => {
    let tagPill;
    if (tags.length) {
      tagPill = tags.map((t) => (
        <TagPill key={t.id} id={t.id} name={t.name} count={t.count} />
      ));
    } else {
      tagPill = "No Tags";
    }
    return tagPill;
  };
  return (
    <>
      <span className="flex items-center gap-2">
        <p className="text-lg">Your Tags</p>
        <InfoTooltip size={15} className="my-auto" variant="explain">
          <p>Tags that were attached at least once by you</p>
        </InfoTooltip>
      </span>
      <div className="flex flex-wrap gap-3">{tagsToPill(humanTags)}</div>

      <Separator />

      <span className="flex items-center gap-2">
        <p className="text-lg">AI Tags</p>
        <InfoTooltip size={15} className="my-auto" variant="explain">
          <p>Tags that were only attached automatically (by AI)</p>
        </InfoTooltip>
      </span>
      <div className="flex flex-wrap gap-3">{tagsToPill(aiTags)}</div>
    </>
  );
}
