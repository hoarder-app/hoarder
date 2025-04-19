import { redirect } from "next/dist/client/components/navigation";
import KarakeepLogo from "@/components/KarakeepIcon";
import SignInForm from "@/components/signin/SignInForm";
import { getServerAuthSession } from "@/server/auth";

export default async function SignInPage() {
  const session = await getServerAuthSession();
  if (session) {
    redirect("/");
  }

  return (
    <div className="grid min-h-screen grid-rows-6 justify-center">
      <span className="row-span-1" />
      <div className="row-span-1 flex w-96 items-center justify-center space-x-2">
        <KarakeepLogo height={100} />
      </div>
      <div className="row-span-4 px-3">
        <SignInForm />
      </div>
    </div>
  );
}
