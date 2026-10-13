"use client";

import { Button } from "@/components/ui/button";
import { signIn } from "@/lib/auth/client";

export default function SignInProviderButton({
  provider,
  redirectTo = "/",
}: {
  provider: {
    id: string;
    name: string;
  };
  redirectTo?: string;
}) {
  return (
    <Button
      onClick={() =>
        signIn(provider.id, {
          callbackUrl: redirectTo,
        })
      }
      className="w-full"
    >
      Sign in with {provider.name}
    </Button>
  );
}
