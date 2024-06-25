import ApiKeySettings from "@/components/dashboard/settings/ApiKeySettings";
import { ChangePassword } from "@/components/dashboard/settings/ChangePassword";
import UserDetails from "@/components/dashboard/settings/UserDetails";

export default async function Settings() {
  return (
    <>
      <div className="rounded-md border bg-background p-4">
        <UserDetails />
        <ChangePassword />
      </div>
      <div className="mt-4 rounded-md border bg-background p-4">
        <ApiKeySettings />
      </div>
    </>
  );
}
