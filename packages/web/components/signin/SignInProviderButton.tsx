"use client";
import { Button } from "@/components/ui/button";
import { ClientSafeProvider, signIn } from "next-auth/react";

export default function SignInProviderButton({
  provider,
}: {
  provider: ClientSafeProvider;
}) {
  return (
    <Button
      onClick={() =>
        signIn(provider.id, {
          callbackUrl: "/",
        })
      }
    >
      Sign in with {provider.name}
    </Button>
  );
}
