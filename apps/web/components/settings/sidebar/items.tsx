import React from "react";
import {
  ArrowLeft,
  Download,
  KeyRound,
  Rss,
  Sparkles,
  User,
} from "lucide-react";

export const settingsSidebarItems: {
  name: string;
  icon: JSX.Element;
  path: string;
}[] = [
  {
    name: "Back To App",
    icon: <ArrowLeft size={18} />,
    path: "/dashboard/bookmarks",
  },
  {
    name: "User Info",
    icon: <User size={18} />,
    path: "/settings/info",
  },
  {
    name: "AI Settings",
    icon: <Sparkles size={18} />,
    path: "/settings/ai",
  },
  {
    name: "RSS Subscriptions",
    icon: <Rss size={18} />,
    path: "/settings/feeds",
  },
  {
    name: "Import / Export",
    icon: <Download size={18} />,
    path: "/settings/import",
  },
  {
    name: "API Keys",
    icon: <KeyRound size={18} />,
    path: "/settings/api-keys",
  },
];
