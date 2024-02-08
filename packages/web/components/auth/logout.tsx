"use client";
import { signOut } from "next-auth/react";

export const LogoutButton = () => {
  return (
    <button
      className="btn btn-ghost normal-case"
      onClick={() =>
        signOut({
          callbackUrl: "/",
        })
      }
    >
      Sign Out
    </button>
  );
};
