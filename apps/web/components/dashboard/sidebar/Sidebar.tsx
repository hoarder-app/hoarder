"use client";

import { useEffect, useState } from "react";
import HoarderLogo from "@/components/HoarderIcon";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/trpc";
import { Home, Search, Tag } from "lucide-react";
import { Session } from "next-auth";
import { getSession } from "next-auth/react";
import { useTheme } from "next-themes";

import AllLists from "./AllLists";
import SidebarItem from "./SidebarItem";
import SidebarProfileOptions from "./SidebarProfileOptions";

const menuItems = [
  { name: "Home", icon: <Home size={24} />, path: "/dashboard/bookmarks" },
  { name: "Search", icon: <Search size={24} />, path: "/dashboard/search" },
  { name: "Tags", icon: <Tag size={24} />, path: "/dashboard/tags" },
];

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [session, setSession] = useState<Session | null>(null);
  const [mounted, setMounted] = useState(false);

  // Use the TRPC hook to fetch lists
  const { data: listsData } = api.lists.list.useQuery();

  useEffect(() => {
    // Mark the component as mounted to avoid hydration mismatch
    setMounted(true);

    // Fetch session data
    const fetchSession = async () => {
      const sessionData = await getSession();
      setSession(sessionData);
    };
    fetchSession();

    // Restore the sidebar state from localStorage
    const savedState = localStorage.getItem("sidebar-collapsed");
    if (savedState !== null) {
      setIsCollapsed(JSON.parse(savedState) as boolean);
    }
  }, []);

  useEffect(() => {
    // Apply the theme
    setTheme(theme ?? "dark");
  }, [theme, setTheme]);

  const toggleSidebar = () => {
    setIsCollapsed((prevState) => !prevState);
    localStorage.setItem("sidebar-collapsed", JSON.stringify(!isCollapsed));
  };

  if (!mounted) {
    // Render a fallback UI to avoid hydration mismatch
    return <div />;
  }

  return (
    <aside
      className={`flex h-screen flex-col p-5 transition-all duration-300 ${
        isCollapsed ? "w-10/12" : "w-60"
      } ${resolvedTheme === "dark" ? "bg-gray-900 text-white" : "bg-white text-gray-900"}`}
    >
      <div className="flex items-center justify-between">
        <button
          onClick={toggleSidebar}
          className={`flex ${isCollapsed ? "justify-center" : ""} w-full py-3`}
        >
          <HoarderLogo
            height={isCollapsed ? 40 : 40}
            gap="8px"
            isCollapsed={isCollapsed}
          />
        </button>
      </div>
      <Separator className="my-5" />
      <ul className="flex-1 space-y-2">
        {menuItems.map((item) => (
          <SidebarItem
            key={item.name}
            logo={item.icon}
            name={item.name}
            path={item.path}
            isCollapsed={isCollapsed}
            className={`py-1 transition-all duration-300 ${
              isCollapsed ? "justify-center" : "justify-start"
            }`}
            style={{ paddingLeft: isCollapsed ? "0.5rem" : "1rem" }}
          />
        ))}
        <Separator className="my-0" />
        <AllLists
          initialData={{ lists: listsData?.lists ?? [] }}
          isCollapsed={isCollapsed}
        />
      </ul>
      <Separator className="my-0" />
      <div className="mt-auto flex items-center justify-between">
        <div className="my-auto font-bold text-orange-500">
          {session?.user?.name
            ? isCollapsed
              ? session.user.name.charAt(0)
              : session.user.name
            : ""}
        </div>
        <SidebarProfileOptions />
      </div>
    </aside>
  );
}
