import { PackageOpen } from "lucide-react";
import SignInForm from "./components/SignInForm";

export default async function SignInPage() {
  // TODO Add support for email and credential signin form
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="flex space-x-2">
        <span>
          <PackageOpen size="30" className="h-full" />
        </span>
        <span className="text-4xl">Hoarder</span>
      </div>
      <div className="mt-20 flex w-96 flex-col items-center rounded-xl border border-gray-300 p-20">
        <SignInForm />
      </div>
    </div>
  );
}
