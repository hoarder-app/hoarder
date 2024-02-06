import { LoginButton } from "../components/auth/login";
import { LogoutButton } from "../components/auth/logout";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div>
        <LoginButton />
        <br />
        <br />
        <LogoutButton />
      </div>
    </main>
  );
}
