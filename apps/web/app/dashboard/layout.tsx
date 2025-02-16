import { redirect } from "next/navigation";
import AllLists from "@/components/dashboard/sidebar/AllLists";
import MobileSidebar from "@/components/shared/sidebar/MobileSidebar";
import Sidebar from "@/components/shared/sidebar/Sidebar";
import SidebarLayout from "@/components/shared/sidebar/SidebarLayout";
import { Separator } from "@/components/ui/separator";
import { api } from "@/server/api/client";
import { getServerAuthSession } from "@/server/auth";
import { TFunction } from "i18next";
import { Archive, Highlighter, Home, Inbox, Search, Tag } from "lucide-react";

import serverConfig from "@hoarder/shared/config";

export default async function Dashboard({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  const session = await getServerAuthSession();
  if (!session) {
    redirect("/");
  }

  const lists = await api.lists.list();

  const items = (t: TFunction) =>
    [
      {
        name: t("common.home"),
        icon: <Home size={18} />,
        path: "/dashboard/bookmarks",
      },
      serverConfig.meilisearch
        ? [
            {
              name: t("common.search"),
              icon: <Search size={18} />,
              path: "/dashboard/search",
            },
          ]
        : [],
      {
        name: t("common.tags"),
        icon: <Tag size={18} />,
        path: "/dashboard/tags",
      },
      {
        name: t("common.highlights"),
        icon: <Highlighter size={18} />,
        path: "/dashboard/highlights",
      },
      {
        name: t("common.archive"),
        icon: <Archive size={18} />,
        path: "/dashboard/archive",
      },
      {
        name: t("common.unsorted"),
        icon: <Inbox size={18} />,
        path: "/dashboard/unsorted",
      },
    ].flat();

  return (
    <SidebarLayout
      sidebar={
        <Sidebar
          items={items}
          extraSections={
            <>
              <Separator />
              <AllLists initialData={lists} />
            </>
          }
        />
      }
      mobileSidebar={<MobileSidebar items={items} />}
      modal={modal}
    >
      {children}
    </SidebarLayout>
  );
}
