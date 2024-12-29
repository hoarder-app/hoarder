import MobileSidebarItem from "@/components/shared/sidebar/ModileSidebarItem";
import { useTranslation } from "@/lib/i18n/server";

import { settingsSidebarItems } from "./items";

export default async function MobileSidebar() {
  const { t } = await useTranslation();
  return (
    <aside className="w-full">
      <ul className="flex justify-between space-x-2 border-b-black px-5 py-2 pt-5">
        {settingsSidebarItems(t).map((item) => (
          <MobileSidebarItem
            key={item.name}
            logo={item.icon}
            path={item.path}
          />
        ))}
      </ul>
    </aside>
  );
}
