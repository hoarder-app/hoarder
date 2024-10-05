import Link from "next/link";
import ApiKeySettings from "@/components/dashboard/settings/ApiKeySettings";
import { ChangePassword } from "@/components/dashboard/settings/ChangePassword";
import ImportExport from "@/components/dashboard/settings/ImportExport";
import UserDetails from "@/components/dashboard/settings/UserDetails";
import { ExternalLink } from "lucide-react";

export default async function Settings() {
  return (
    <>
      <div className="rounded-md border bg-background p-4">
        <UserDetails />
        <ChangePassword />
      </div>
      <div className="mt-4 rounded-md border bg-background p-4">
        <Link
          className="flex items-center gap-2 text-lg font-medium"
          href="/dashboard/settings/ai"
        >
          AI Settings
          <ExternalLink />
        </Link>
      </div>
      <div className="mt-4 rounded-md border bg-background p-4">
        <ImportExport />
      </div>
      <div className="mt-4 rounded-md border bg-background p-4">
        <ApiKeySettings />
      </div>
    </>
  );
}
