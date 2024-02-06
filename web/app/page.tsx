"use client";

import { useCallback } from "react";
import { LoginButton } from "../components/auth/login";
import { LogoutButton } from "../components/auth/logout";

export default function Home() {
  const addUrl = useCallback(async () => {
    await fetch("/api/v1/links", {
      method: "POST",
      body: JSON.stringify({ url: "https://news.ycombinator.com/news" }),
    });
  }, []);
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div>
        <LoginButton />
        <br />
        <br />
        <LogoutButton />
        <br />
        <br />
        <button onClick={addUrl}>Add URL</button>
      </div>
    </main>
  );
}
