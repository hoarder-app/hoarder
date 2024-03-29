import ApiKeySettings from "@/components/dashboard/settings/ApiKeySettings";
import { ChangePassword } from "@/components/dashboard/settings/ChangePassword";

export default async function Settings() {
  return (
    <div className="flex flex-col space-y-2 rounded-md border bg-background p-4">
      <p className="text-2xl">Settings</p>
      <ChangePassword />
      <ApiKeySettings />
    </div>
  );
}
