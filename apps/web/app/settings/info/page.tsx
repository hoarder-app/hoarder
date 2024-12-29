import { ChangePassword } from "@/components/settings/ChangePassword";
import UserDetails from "@/components/settings/UserDetails";
import { UserOptions } from "@/components/settings/UserOptions";

export default async function InfoPage() {
  return (
    <div className="flex flex-col gap-8 rounded-md border bg-background p-4">
      <UserDetails />
      <ChangePassword />
      <UserOptions />
    </div>
  );
}
