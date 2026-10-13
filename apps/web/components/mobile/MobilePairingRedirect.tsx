"use client";

import { useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";

import { useTRPC } from "@karakeep/shared-react/trpc";

// Mints a one-time pairing token and hands it to the native app via its deep
// link. The app exchanges the token for an API key; the key itself never
// appears in the URL.
export default function MobilePairingRedirect({
  redirectUrl,
}: {
  redirectUrl: string;
}) {
  const api = useTRPC();
  const started = useRef(false);

  const { mutate, isError } = useMutation(
    api.apiKeys.createMobilePairingToken.mutationOptions({
      onSuccess: ({ token }) => {
        const separator = redirectUrl.includes("?") ? "&" : "?";
        window.location.href = `${redirectUrl}${separator}pairingToken=${encodeURIComponent(token)}`;
      },
    }),
  );

  // Mint on mount. It's a mutation (side effect), so it can't run during render.
  useEffect(() => {
    if (started.current) {
      return;
    }
    started.current = true;
    mutate();
  }, [mutate]);

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      {isError ? (
        <p className="text-sm text-destructive">
          Couldn&apos;t hand your sign-in back to the app. Close this window and
          try again.
        </p>
      ) : (
        <>
          <LoaderCircle className="h-6 w-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Returning to the app…</p>
        </>
      )}
    </div>
  );
}
