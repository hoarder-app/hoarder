import { TFunction } from "i18next";
import { Activity, ArrowLeft, Settings, Users } from "lucide-react";

export const adminSidebarItems = (
  t: TFunction,
): {
  name: string;
  icon: JSX.Element;
  path: string;
}[] => [
  {
    name: t("settings.back_to_app"),
    icon: <ArrowLeft size={18} />,
    path: "/dashboard/bookmarks",
  },
  {
    name: t("admin.server_stats.server_stats"),
    icon: <Activity size={18} />,
    path: "/admin/overview",
  },
  {
    name: t("admin.users_list.users_list"),
    icon: <Users size={18} />,
    path: "/admin/users",
  },
  {
    name: t("common.actions"),
    icon: <Settings size={18} />,
    path: "/admin/actions",
  },
];
