"use client";

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
  const { theme, setTheme } = useTheme();

  let comp;
  if (theme == "dark") {
    comp = (
      <button onClick={() => setTheme("light")}>
        <Sun className="size-4" />
        <p>Light Mode</p>
      </button>
    );
  } else {
    comp = (
      <button onClick={() => setTheme("dark")}>
        <Moon className="size-4" />
        <p>Dark Mode</p>
      </button>
    );
  }
  return <Slot className="flex flex-row gap-2">{comp}</Slot>;
}

export default function SidebarProfileOptions() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost">
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-fit">
        <DropdownMenuItem>
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
