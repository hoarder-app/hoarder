import React from "react";
import Link from "next/link";
import { SearchInput } from "@/components/dashboard/search/SearchInput";
import GlobalActions from "@/components/dashboard/GlobalActions";
import ProfileOptions from "@/components/dashboard/header/ProfileOptions";
import HoarderLogo from "@/components/HoarderIcon";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Header() {
  return (
    <header className="sticky h-16 top-0 left-0 right-0 flex items-center justify-between p-4 bg-white shadow z-50">
      <div className="flex items-center">
        <Link href={"/dashboard/bookmarks"}>
          <HoarderLogo height={20} gap="8px" />
        </Link>
      </div>
      <div className="flex gap-2 w-[60vw]">
        <SearchInput />
        <GlobalActions />
      </div>
      <div className="flex items-center">
        <Button variant="ghost">
          <Link href="/dashboard/settings" className="flex items-center">
            <Settings size={18} />
          </Link>
        </Button>
        <ProfileOptions />
      </div>
    </header>
  );
}
