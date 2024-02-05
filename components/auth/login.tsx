"use client";
import { signIn } from "next-auth/react";

export const LoginButton = () => {
  return (
    <button
      className="btn btn-primary"
      onClick={() =>
        signIn(undefined, {
          callbackUrl: "/",
        })
      }
    >
      Sign in
    </button>
  );
};
