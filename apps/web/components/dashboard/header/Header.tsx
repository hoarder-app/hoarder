import React from "react";
import Link from "next/link";
import { SearchInput } from "@/components/dashboard/search/SearchInput";
import GlobalActions from "@/components/dashboard/GlobalActions";
import ProfileOptions from "@/components/dashboard/header/ProfileOptions";
import HoarderLogo from "@/components/HoarderIcon";
import { Settings, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getServerAuthSession } from "@/server/auth";
import { redirect } from "next/navigation";

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
    <header className="sticky h-16 top-0 left-0 right-0 flex items-center justify-between p-4 bg-white shadow z-50 overflow-auto">
      <div className="hidden items-center sm:flex">
        <Link href={"/dashboard/bookmarks"} className="w-56">
          <HoarderLogo height={20} gap="8px" />
        </Link>
      </div>
      <div className="flex gap-2 w-full">
        <SearchInput className="min-w-40 bg-muted" />
        <GlobalActions />
      </div>
      <div className="items-center hidden sm:flex">
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
