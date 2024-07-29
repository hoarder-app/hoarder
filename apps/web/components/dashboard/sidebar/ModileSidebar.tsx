"use client";

import { useEffect, useState } from "react";
import HoarderLogoIcon from "@/public/icons/logo-icon.svg";
import { ClipboardList, Search, Tag } from "lucide-react";
import { getSession } from "next-auth/react"; // Adjust the import as needed
import { useTheme } from "next-themes";

import MobileSidebarItem from "./ModileSidebarItem";
import SidebarProfileOptions from "./SidebarProfileOptions";

const menuItems = [
  { name: "Search", icon: <Search size={18} />, path: "/dashboard/search" },
  { name: "Tags", icon: <Tag size={18} />, path: "/dashboard/tags" },
  {
    name: "Lists",
    icon: <ClipboardList size={18} />,
    path: "/dashboard/lists",
  },
];

export default function MobileSidebar() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Mark the component as mounted to avoid hydration mismatch
    setMounted(true);

    setTheme("dark"); // Set default theme to dark

    // Fetch session data
    const fetchSession = async () => {
      await getSession();
    };

    fetchSession();
  }, [setTheme]);

  if (!mounted) {
    // Render a fallback UI to avoid hydration mismatch
    return <div />;
  }

  return (
    <aside
      className={`w-full ${
        resolvedTheme === "dark"
          ? "bg-gray-900 text-white"
          : "bg-white text-gray-900"
      }`}
    >
      <ul className="flex justify-between space-x-2 border-b border-gray-700 px-5 py-2 pt-5">
        <MobileSidebarItem
          logo={<HoarderLogoIcon className="w-5 fill-foreground" />}
          path="/dashboard/bookmarks"
        />
        {menuItems.map((item) => (
          <MobileSidebarItem
            key={item.name}
            logo={item.icon}
            path={item.path}
          />
        ))}
        <SidebarProfileOptions />
      </ul>
    </aside>
  );
}
