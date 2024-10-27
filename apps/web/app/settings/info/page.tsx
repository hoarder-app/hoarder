import { ChangePassword } from "@/components/settings/ChangePassword";
import UserDetails from "@/components/settings/UserDetails";

export default async function InfoPage() {
  return (
    <div className="rounded-md border bg-background p-4">
      <UserDetails />
      <ChangePassword />
    </div>
  );
}
