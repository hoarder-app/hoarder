"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/trpc";
import { AlertCircle } from "lucide-react";

import { AdminCard } from "./AdminCard";

interface AdminNotice {
  level: "info" | "warning" | "error";
  message: React.ReactNode;
  title: string;
}

function useAdminNotices() {
  const { data } = api.admin.getAdminNoticies.useQuery();
  if (!data) {
    return [];
  }
  const ret: AdminNotice[] = [];
  if (data.legacyContainersNotice) {
    ret.push({
      level: "warning",
      message: (
        <p>
          You&apos;re using the legacy docker container images. Those will stop
          getting supported soon. Please follow{" "}
          <a
            href="https://docs.karakeep.app/next/Guides/legacy-container-upgrade"
            className="underline"
          >
            this guide
          </a>{" "}
          to upgrade.
        </p>
      ),
      title: "Legacy Container Images",
    });
  }
  return ret;
}

export function AdminNotices() {
  const notices = useAdminNotices();

  if (notices.length === 0) {
    return null;
  }
  return (
    <AdminCard>
      <div className="flex flex-col gap-2">
        {notices.map((n, i) => (
          <Alert key={i} variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{n.title}</AlertTitle>
            <AlertDescription>{n.message}</AlertDescription>
          </Alert>
        ))}
      </div>
    </AdminCard>
  );
}

export function AdminNoticeBadge() {
  const notices = useAdminNotices();
  if (notices.length === 0) {
    return null;
  }
  return <Badge variant="destructive">{notices.length}</Badge>;
}
