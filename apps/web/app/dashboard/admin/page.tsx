"use client";

import { useRouter } from "next/navigation";
import {
  DynamicConfig,
  DynamicConfigTabTriggers,
} from "@/app/dashboard/admin/dynamicConfig";
import AdminActions from "@/components/dashboard/admin/AdminActions";
import ServerStats from "@/components/dashboard/admin/ServerStats";
import UserList from "@/components/dashboard/admin/UserList";
import LoadingSpinner from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Info } from "lucide-react";
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
      <Tabs
        defaultValue="information"
        orientation="horizontal"
        className="flex flex-col gap-1"
      >
        <TabsList className="flex justify-start">
          <TabsTrigger
            className="flex items-center gap-2 p-3"
            value="information"
          >
            <Info className="size-4" />
            Information
          </TabsTrigger>
          <DynamicConfigTabTriggers
            key={"configTabTriggers"}
          ></DynamicConfigTabTriggers>
        </TabsList>
        <TabsContent value="information">
          <div className="rounded-md border bg-background p-4">
            <ServerStats />
            <AdminActions />
          </div>
          <div className="mt-4 rounded-md border bg-background p-4">
            <UserList />
          </div>
        </TabsContent>
        <DynamicConfig></DynamicConfig>
      </Tabs>
    </>
  );
}
