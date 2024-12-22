import React from "react";
import { TFunction } from "i18next";
import {
  ArrowLeft,
  Download,
  KeyRound,
  Link,
  Rss,
  Sparkles,
  User,
} from "lucide-react";

export const settingsSidebarItems = (
  t: TFunction,
): {
  name: string;
  icon: React.ReactNode;
  path: string;
}[] => [
  {
    name: t("settings.back_to_app"),
    icon: <ArrowLeft size={18} />,
    path: "/dashboard/bookmarks",
  },
  {
    name: t("settings.info.user_info"),
    icon: <User size={18} />,
    path: "/settings/info",
  },
  {
    name: t("settings.ai.ai_settings"),
    icon: <Sparkles size={18} />,
    path: "/settings/ai",
  },
  {
    name: t("settings.feeds.rss_subscriptions"),
    icon: <Rss size={18} />,
    path: "/settings/feeds",
  },
  {
    name: t("settings.import.import_export"),
    icon: <Download size={18} />,
    path: "/settings/import",
  },
  {
    name: t("settings.api_keys.api_keys"),
    icon: <KeyRound size={18} />,
    path: "/settings/api-keys",
  },
  {
    name: t("settings.broken_links.broken_links"),
    icon: <Link size={18} />,
    path: "/settings/broken-links",
  },
];
