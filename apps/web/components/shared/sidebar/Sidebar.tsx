import { useTranslation } from "@/lib/i18n/server";
import { TFunction } from "i18next";

import serverConfig from "@hoarder/shared/config";

import SidebarItem from "./SidebarItem";
import { TSidebarItem } from "./TSidebarItem";

export default async function Sidebar({
  items,
  extraSections,
}: {
  items: (t: TFunction) => TSidebarItem[];
  extraSections?: React.ReactNode;
}) {
  const { t } = await useTranslation();

  return (
    <aside className="flex h-[calc(100vh-64px)] w-60 flex-col gap-5 border-r p-4">
      <div>
        <ul className="space-y-2 text-sm">
          {items(t).map((item) => (
            <SidebarItem
              key={item.name}
              logo={item.icon}
              name={item.name}
              path={item.path}
            />
          ))}
        </ul>
      </div>
      {extraSections}
      <div className="mt-auto flex items-center border-t pt-2 text-sm text-gray-400">
        Hoarder v{serverConfig.serverVersion}
      </div>
    </aside>
  );
}
