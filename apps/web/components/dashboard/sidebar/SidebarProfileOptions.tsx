"use client";

import Link from "next/link";
import { useToggleTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useBookmarkLayout } from "@/lib/userLocalSettings/bookmarksLayout";
import { updateBookmarksLayout } from "@/lib/userLocalSettings/userLocalSettings";
import {
  Check,
  LayoutDashboard,
  LayoutGrid,
  LayoutList,
  LayoutPanelLeft,
  LogOut,
  Moon,
  MoreHorizontal,
  Paintbrush,
  Sun,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";

function BookmarkLayoutSelector() {
  const layout = useBookmarkLayout();

  const checkedComp = <Check className="ml-2 size-4" />;

  return (
    <>
      <DropdownMenuItem
        className="justify-between"
        onClick={async () => await updateBookmarksLayout("masonry")}
      >
        <div className="flex items-center gap-2">
          <LayoutDashboard className="size-4" />
          <span>Masonry</span>
        </div>
        {layout == "masonry" && checkedComp}
      </DropdownMenuItem>
      <DropdownMenuItem
        className="justify-between"
        onClick={async () => await updateBookmarksLayout("grid")}
      >
        <div className="flex items-center gap-2">
          <LayoutGrid className="size-4" />
          <span>Grid</span>
        </div>
        {layout == "grid" && checkedComp}
      </DropdownMenuItem>
      <DropdownMenuItem
        className="justify-between"
        onClick={async () => await updateBookmarksLayout("list")}
      >
        <div className="flex items-center gap-2">
          <LayoutList className="size-4" />
          <span>List</span>
        </div>
        {layout == "list" && checkedComp}
      </DropdownMenuItem>
    </>
  );
}

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
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost">
          <MoreHorizontal />
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
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <LayoutPanelLeft className="mr-2 size-4" />
            <span>Layout</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <BookmarkLayoutSelector />
          </DropdownMenuSubContent>
        </DropdownMenuSub>
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
