"use client";

import { useRouter } from "next/navigation";
import ServerStats from "@/components/dashboard/admin/ServerStats";
import Users from "@/components/dashboard/admin/Users";
import LoadingSpinner from "@/components/ui/spinner";
import { useSession } from "next-auth/react";

export default function AdminPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  if (status == "loading") {
    return <LoadingSpinner />;
  }

  if (!session || session.user.role != "admin") {
    router.push("/");
    return;
  }

  return (
    <>
      <div className="rounded-md border bg-background p-4">
        <ServerStats />
      </div>
      <div className="mt-4 rounded-md border bg-background p-4">
        <Users />
      </div>
    </>
  );
}
