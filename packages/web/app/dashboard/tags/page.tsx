import { Separator } from "@/components/ui/separator";
import { getServerAuthSession } from "@/server/auth";
import { db } from "@hoarder/db";
import { bookmarkTags, tagsOnBookmarks } from "@hoarder/db/schema";
import { count, eq } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";

function TagPill({ name, count }: { name: string; count: number }) {
  return (
    <Link
      className="flex gap-2 rounded-md border border-gray-200 bg-white px-2 py-1 text-foreground hover:bg-foreground hover:text-background"
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

  let tags = await db
    .select({
      id: tagsOnBookmarks.tagId,
      name: bookmarkTags.name,
      count: count(),
    })
    .from(tagsOnBookmarks)
    .where(eq(bookmarkTags.userId, session.user.id))
    .groupBy(tagsOnBookmarks.tagId)
    .innerJoin(bookmarkTags, eq(bookmarkTags.id, tagsOnBookmarks.tagId));

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
    <div className="container mt-2 space-y-3">
      <span className="text-2xl">All Tags</span>
      <hr />
      <div className="flex flex-wrap gap-3">{tagPill}</div>
    </div>
  );
}
