import { redirect } from "next/dist/client/components/navigation";
import HoarderLogo from "@/components/HoarderIcon";
import SignInForm from "@/components/signin/SignInForm";
import { getServerAuthSession } from "@/server/auth";

export default async function SignInPage() {
  const session = await getServerAuthSession();
  if (session) {
    redirect("/");
  }

  return (
    <div className="grid min-h-screen grid-rows-6 justify-center">
      <div className="row-span-2 flex w-96 items-center justify-center space-x-2">
        <HoarderLogo height={62} gap="12px" isCollapsed={false} />
      </div>
      <div className="row-span-4 px-3">
        <SignInForm />
      </div>
    </div>
  );
}
