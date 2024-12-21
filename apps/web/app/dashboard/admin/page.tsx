import { redirect } from "next/navigation";
import AdminActions from "@/components/dashboard/admin/AdminActions";
import { AdminCard } from "@/components/dashboard/admin/AdminCard";
import { AdminNotices } from "@/components/dashboard/admin/AdminNotices";
import ServerStats from "@/components/dashboard/admin/ServerStats";
import UserList from "@/components/dashboard/admin/UserList";
import { getServerAuthSession } from "@/server/auth";

export default async function AdminPage() {
  const session = await getServerAuthSession();
  if (!session || session.user.role !== "admin") {
    redirect("/");
  }
  return (
    <div className="flex flex-col gap-4">
      <AdminNotices />
      <AdminCard>
        <ServerStats />
        <AdminActions />
      </AdminCard>
      <AdminCard>
        <UserList />
      </AdminCard>
    </div>
  );
}
