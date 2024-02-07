import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getLinks } from "@/lib/services/links";
import LinkCard from "./LinkCard";

export default async function LinksGrid() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/");
  }
  const links = await getLinks(session.user.id);

  return (
    <div className="container p-8 mx-auto grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {links.map((l) => (
        <LinkCard key={l.id} link={l} />
      ))}
    </div>
  );
}
