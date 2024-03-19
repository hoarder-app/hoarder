import { redirect } from "next/navigation";
import LandingPage from "@/components/landing/LandingPage";
import { getServerAuthSession } from "@/server/auth";

export default async function Home() {
  // TODO: Home currently just redirects between pages until we build a proper landing page
  const session = await getServerAuthSession();
  if (session) {
    redirect("/dashboard/bookmarks");
  }

  return <LandingPage />;
}
