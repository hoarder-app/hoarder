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
import { LogOut, Moon, Paintbrush, Sun } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "next-themes";

function DarkModeToggle() {
  const { theme } = useTheme();

  if (theme == "dark") {
    return (
      <>
        <Sun className="mr-2 size-4" />
        <span>Light Mode</span>
      </>
    );
  } else {
    return (
      <>
        <Moon className="mr-2 size-4" />
        <span>Dark Mode</span>
      </>
    );
  }
}

export default function SidebarProfileOptions() {
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
      <DropdownMenuContent className="w-fit">
        <DropdownMenuItem asChild>
          <Link href="/dashboard/cleanups">
            <Paintbrush className="mr-2 size-4" />
            Cleanups
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={toggleTheme}>
          <DarkModeToggle />
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            signOut({
              callbackUrl: "/",
            })
          }
        >
          <LogOut className="mr-2 size-4" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
