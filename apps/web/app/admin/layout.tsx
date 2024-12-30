import { redirect } from "next/navigation";
import { AdminCard } from "@/components/admin/AdminCard";
import { AdminNotices } from "@/components/admin/AdminNotices";
import MobileAdminSidebar from "@/components/admin/sidebar/MobileSidebar";
import AdminSidebar from "@/components/admin/sidebar/Sidebar";
import Header from "@/components/dashboard/header/Header";
import { Separator } from "@/components/ui/separator";
import { getServerAuthSession } from "@/server/auth";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerAuthSession();
  if (!session || session.user.role !== "admin") {
    redirect("/");
  }

  return (
    <div>
      <Header />
      <div className="flex min-h-[calc(100vh-64px)] w-screen flex-col sm:h-[calc(100vh-64px)] sm:flex-row">
        <div className="hidden flex-none sm:flex">
          <AdminSidebar />
        </div>
        <main className="flex-1 bg-muted sm:overflow-y-auto">
          <div className="block w-full sm:hidden">
            <MobileAdminSidebar />
            <Separator />
          </div>
          <div className="min-h-30 container flex flex-col gap-1 p-4">
            <AdminNotices />
            <AdminCard>{children}</AdminCard>
          </div>
        </main>
      </div>
    </div>
  );
}
