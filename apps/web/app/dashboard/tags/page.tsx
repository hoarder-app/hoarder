import Link from "next/link";
import { redirect } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { api } from "@/server/api/client";
import { getServerAuthSession } from "@/server/auth";

function TagPill({ name, count }: { name: string; count: number }) {
  return (
    <Link
      className="flex gap-2 rounded-md border border-border bg-background px-2 py-1 text-foreground hover:bg-foreground hover:text-background"
      href={`/dashboard/tags/${name}`}
    >
      {name} <Separator orientation="vertical" /> {count}
    </Link>
  );
}

export default async function TagsPage() {
  const session = await getServerAuthSession();
  if (!session) {
    redirect("/");
  }

  let tags = (await api.tags.list()).tags;

  // Sort tags by usage desc
  tags = tags.sort((a, b) => b.count - a.count);

  let tagPill;
  if (tags.length) {
    tagPill = tags.map((t) => (
      <TagPill key={t.id} name={t.name} count={t.count} />
    ));
  } else {
    tagPill = "No Tags";
  }

  return (
    <div className="space-y-3">
      <span className="text-2xl">All Tags</span>
      <Separator />
      <div className="flex flex-wrap gap-3">{tagPill}</div>
    </div>
  );
}
