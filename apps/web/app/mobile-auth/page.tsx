import type { Metadata } from "next";
import { redirect } from "next/navigation";
import KarakeepLogo from "@/components/KarakeepIcon";
import MobilePairingRedirect from "@/components/mobile/MobilePairingRedirect";
import SignInForm from "@/components/signin/SignInForm";
import { getServerAuthSession } from "@/server/auth";

import {
  isMobileAppRedirect,
  validateRedirectUrl,
} from "@karakeep/shared/utils/redirectUrl";

export const metadata: Metadata = {
  title: "Sign in to the app | Karakeep",
};

// Browser-based sign-in for the native apps. The app opens this page with its
// deep link as redirectUrl; once the user authenticates (passkey, password, or
// OAuth) we hand a one-time pairing token back through that deep link, and the
// app exchanges it for an API key. This keeps WebAuthn native to the browser,
// so no per-server asset-links setup is needed.
export default async function MobileAuthPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectUrl?: string }>;
}) {
  const { redirectUrl: rawRedirectUrl } = await searchParams;
  const redirectUrl = validateRedirectUrl(rawRedirectUrl);

  // Only the app's own deep link is a valid target for this flow.
  if (!redirectUrl || !isMobileAppRedirect(redirectUrl)) {
    redirect("/signin");
  }

  const session = await getServerAuthSession();
  // After the sign-in form redirects back here, the session exists and we mint
  // the token.
  const selfRedirect = `/mobile-auth?redirectUrl=${encodeURIComponent(redirectUrl)}`;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="flex items-center justify-center">
          <KarakeepLogo height={80} />
        </div>
        {session ? (
          <MobilePairingRedirect redirectUrl={redirectUrl} />
        ) : (
          <SignInForm redirectTo={selfRedirect} />
        )}
      </div>
    </div>
  );
}
