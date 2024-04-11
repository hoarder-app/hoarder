"use client";

import { useToggleTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Slot } from "@radix-ui/react-slot";
import { LogOut, Moon, MoreHorizontal, Sun } from "lucide-react";
import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";

function DarkModeToggle() {
  const { theme } = useTheme();

  let comp;
  if (theme == "dark") {
    comp = (
      <span>
        <Sun className="size-4" />
        <p>Light Mode</p>
      </span>
    );
  } else {
    comp = (
      <span>
        <Moon className="size-4" />
        <p>Dark Mode</p>
      </span>
    );
  }
  return <Slot className="flex flex-row gap-2">{comp}</Slot>;
}

export default function SidebarProfileOptions() {
  const toggleTheme = useToggleTheme();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost">
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-fit">
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
