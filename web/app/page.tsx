import { LoginButton } from "@/components/auth/login";
import { LogoutButton } from "@/components/auth/logout";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div>
        <LoginButton />
        <br />
        <br />
        <LogoutButton />
        <br />
        <br />
        <Link href="/bookmarks">Bookmarks</Link>
      </div>
    </main>
  );
}
