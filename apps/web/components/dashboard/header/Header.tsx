import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import GlobalActions from "@/components/dashboard/GlobalActions";
import ProfileOptions from "@/components/dashboard/header/ProfileOptions";
import { SearchInput } from "@/components/dashboard/search/SearchInput";
import HoarderLogo from "@/components/HoarderIcon";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getServerAuthSession } from "@/server/auth";
import { Settings, Shield } from "lucide-react";

export default async function Header() {
  const session = await getServerAuthSession();
  if (!session) {
    redirect("/");
  }

  const adminItem =
    session.user.role == "admin"
      ? [
          {
            name: "Admin",
            icon: <Shield size={18} />,
            path: "/dashboard/admin",
          },
        ]
      : [];

  const headerItems = [
    ...adminItem,
    {
      name: "Settings",
      icon: <Settings size={18} />,
      path: "/dashboard/settings",
    },
  ];

  return (
    <header className="sticky left-0 right-0 top-0 z-50 flex h-16 items-center justify-between overflow-x-auto overflow-y-hidden bg-background p-4 shadow">
      <div className="hidden items-center sm:flex">
        <Link href={"/dashboard/bookmarks"} className="w-56">
          <HoarderLogo height={20} gap="8px" />
        </Link>
      </div>
      <div className="flex w-full gap-2">
        <SearchInput className="min-w-40 bg-muted" />
        <GlobalActions />
      </div>
      <div className="hidden items-center sm:flex">
        {headerItems.map((item) => (
          <Tooltip key={item.name} delayDuration={0}>
            <TooltipTrigger asChild>
              <Button variant="ghost">
                <Link href={item.path} className="flex items-center">
                  {item.icon}
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{item.name}</TooltipContent>
          </Tooltip>
        ))}
        <ProfileOptions />
      </div>
    </header>
  );
}
