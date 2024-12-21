import { ChangeEmailAddress } from "@/components/settings/ChangeEmailAddress";
import { ChangePassword } from "@/components/settings/ChangePassword";
import UserDetails from "@/components/settings/UserDetails";
import { UserOptions } from "@/components/settings/UserOptions";
import { api } from "@/server/api/client";

export default async function InfoPage() {
  const whoami = await api.users.whoami();

  return (
    <div className="flex flex-col gap-8 rounded-md border bg-background p-4">
      <UserDetails />
      {whoami.localUser && (
        <>
          <ChangeEmailAddress />
          <ChangePassword />
        </>
      )}
      <UserOptions />
    </div>
  );
}
