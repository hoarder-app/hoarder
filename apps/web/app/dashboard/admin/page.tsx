import AdminActions from "@/components/dashboard/admin/AdminActions";
import ServerStats from "@/components/dashboard/admin/ServerStats";
import UserList from "@/components/dashboard/admin/UserList";

export default async function AdminPage() {
  return (
    <>
      <div className="rounded-md border bg-background p-4">
        <ServerStats />
        <AdminActions />
      </div>
      <div className="mt-4 rounded-md border bg-background p-4">
        <UserList />
      </div>
    </>
  );
}
