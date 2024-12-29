"use client";

import { api } from "@/lib/trpc";
import { signOut } from "next-auth/react";

/**
 * This component is used to address a confusion when the JWT token exists but the user no longer exists in the database.
 * So this component synchronusly checks if the user is still valid and if not, signs out the user.
 */
export default function ValidAccountCheck() {
  const { error } = api.users.whoami.useQuery(undefined, {
    retry: (_failureCount, error) => {
      if (error.data?.code === "UNAUTHORIZED") {
        return false;
      }
      return true;
    },
  });
  if (error?.data?.code === "UNAUTHORIZED") {
    signOut({
      callbackUrl: "/",
    });
  }

  return <></>;
}
