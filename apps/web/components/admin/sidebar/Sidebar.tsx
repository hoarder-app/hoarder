import { redirect } from "next/navigation";
import SidebarItem from "@/components/shared/sidebar/SidebarItem";
import { useTranslation } from "@/lib/i18n/server";
import { getServerAuthSession } from "@/server/auth";

import serverConfig from "@hoarder/shared/config";

import { adminSidebarItems } from "./items";

export default async function Sidebar() {
  const { t } = await useTranslation();
  const session = await getServerAuthSession();
  if (!session) {
    redirect("/");
  }

  return (
    <aside className="flex h-[calc(100vh-64px)] w-60 flex-col gap-5 border-r p-4 ">
      <div>
        <ul className="space-y-2 text-sm font-medium">
          {adminSidebarItems(t).map((item) => (
            <SidebarItem
              key={item.name}
              logo={item.icon}
              name={item.name}
              path={item.path}
            />
          ))}
        </ul>
      </div>
      <div className="mt-auto flex items-center border-t pt-2 text-sm text-gray-400">
        Hoarder v{serverConfig.serverVersion}
      </div>
    </aside>
  );
}
