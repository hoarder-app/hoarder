"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

export default function Logout() {
  const router = useRouter();
  useEffect(() => {
    signOut({
      redirect: false,
      callbackUrl: "/",
    }).then((d) => {
      router.push(d.url);
    });
  }, []);
  return <span />;
}
