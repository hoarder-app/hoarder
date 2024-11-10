import { ChangeEmailAddress } from "@/components/settings/ChangeEmailAddress";
import { ChangePassword } from "@/components/settings/ChangePassword";
import UserDetails from "@/components/settings/UserDetails";
import { api } from "@/server/api/client";

export default async function InfoPage() {
  const whoami = await api.users.whoami();

  return (
    <div className="rounded-md border bg-background p-4">
      <UserDetails />
      {whoami.localUser && (
        <>
          <ChangeEmailAddress />
          <ChangePassword />
        </>
      )}
      {!whoami.localUser && (
        <div className="flex flex-col sm:flex-row">
          Changing Email address and password is not possible for OAuth Users
        </div>
      )}
    </div>
  );
}
