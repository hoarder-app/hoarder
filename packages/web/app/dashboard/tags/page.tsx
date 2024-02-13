import { Button } from "@/components/ui/button";
import { getServerAuthSession } from "@/server/auth";
import { prisma } from "@remember/db";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function TagsPage() {
  const session = await getServerAuthSession();
  if (!session) {
    redirect("/");
  }

  const tags = await prisma.bookmarkTags.findMany({
    where: {
      userId: session.user.id,
    },
  });

  return (
    <div className="container mt-2 space-y-3">
      <span className="text-2xl">All Tags</span>
      <hr />
      <div className="flex flex-wrap space-x-2">
        {tags.map((t) => (
          <Link
            className="block rounded-xl bg-black p-2 text-white"
            key={t.id}
            href={`/dashboard/tags/${t.name}`}
          >
            {t.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
