"use client";

import Link from "next/link";
import { redirect } from "next/navigation";
import { useToggleTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "@/lib/i18n/client";
import { LogOut, Moon, Paintbrush, Settings, Shield, Sun } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "next-themes";

import { AdminNoticeBadge } from "../admin/AdminNotices";

function DarkModeToggle() {
  const { t } = useTranslation();
  const { theme } = useTheme();

  if (theme == "dark") {
    return (
      <>
        <Sun className="mr-2 size-4" />
        <span>{t("options.light_mode")}</span>
      </>
    );
  } else {
    return (
      <>
        <Moon className="mr-2 size-4" />
        <span>{t("options.dark_mode")}</span>
      </>
    );
  }
}

export default function SidebarProfileOptions() {
  const { t } = useTranslation();
  const toggleTheme = useToggleTheme();
  const { data: session } = useSession();
  if (!session) return redirect("/");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className="border-new-gray-200 aspect-square rounded-full border-4 bg-black p-0 text-white"
          variant="ghost"
        >
          {session.user.name?.charAt(0) ?? "U"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="mr-2 min-w-64 p-2">
        <div className="flex gap-2">
          <div className="border-new-gray-200 flex aspect-square size-11 items-center justify-center rounded-full border-4 bg-black p-0 text-white">
            {session.user.name?.charAt(0) ?? "U"}
          </div>
          <div className="flex flex-col">
            <p>{session.user.name}</p>
            <p className="text-sm text-gray-400">{session.user.email}</p>
          </div>
        </div>
        <Separator className="my-2" />
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings className="mr-2 size-4" />
            {t("settings.user_settings")}
          </Link>
        </DropdownMenuItem>
        {session.user.role == "admin" && (
          <DropdownMenuItem asChild>
            <Link href="/dashboard/admin" className="flex justify-between">
              <div className="items-cente flex gap-2">
                <Shield className="size-4" />
                {t("admin.admin_settings")}
              </div>
              <AdminNoticeBadge />
            </Link>
          </DropdownMenuItem>
        )}
        <Separator className="my-2" />
        <DropdownMenuItem asChild>
          <Link href="/dashboard/cleanups">
            <Paintbrush className="mr-2 size-4" />
            {t("cleanups.cleanups")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={toggleTheme}>
          <DarkModeToggle />
        </DropdownMenuItem>
        <Separator className="my-2" />
        <DropdownMenuItem
          onClick={() =>
            signOut({
              callbackUrl: "/",
            })
          }
        >
          <LogOut className="mr-2 size-4" />
          <span>{t("actions.sign_out")}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
