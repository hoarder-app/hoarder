import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/server/auth";

export default async function Home() {
  // TODO: Home currently just redirects between pages until we build a proper landing page
  const session = await getServerAuthSession();
  if (!session) {
    redirect("/signin");
  }

  redirect("/dashboard/bookmarks");
}
