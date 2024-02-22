import { getServerAuthSession } from "@/server/auth";
import { prisma } from "@hoarder/db";
import Link from "next/link";
import { redirect } from "next/navigation";

function TagPill({ name, count }: { name: string; count: number }) {
  return (
    <Link
      className="mx-1.5 my-1 flex rounded-lg bg-gray-600 hover:bg-gray-700"
      href={`/dashboard/tags/${name}`}
    >
      <span className="p-1.5 text-gray-200">{name}</span>
      <span className="rounded-r-lg bg-gray-300 p-1.5 text-gray-600">
        {count}
      </span>
    </Link>
  );
}

export default async function TagsPage() {
  const session = await getServerAuthSession();
  if (!session) {
    redirect("/");
  }

  let tags = await prisma.bookmarkTags.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      _count: {
        select: {
          bookmarks: true,
        },
      },
    },
  });

  // Sort tags by usage desc
  tags = tags
    .filter((t) => t._count.bookmarks > 0)
    .sort((a, b) => b._count.bookmarks - a._count.bookmarks);

  let tagPill;
  if (tags.length) {
    tagPill = tags.map((t) => (
      <TagPill key={t.id} name={t.name} count={t._count.bookmarks} />
    ));
  } else {
    tagPill = "No Tags";
  }

  return (
    <div className="container mt-2 space-y-3">
      <span className="text-2xl">All Tags</span>
      <hr />
      <div className="flex flex-wrap">{tagPill}</div>
    </div>
  );
}
