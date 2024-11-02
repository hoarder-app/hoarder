import Header from "@/components/dashboard/header/Header";
import DemoModeBanner from "@/components/DemoModeBanner";
import MobileSidebar from "@/components/settings/sidebar/ModileSidebar";
import Sidebar from "@/components/settings/sidebar/Sidebar";
import { Separator } from "@/components/ui/separator";
import ValidAccountCheck from "@/components/utils/ValidAccountCheck";

import serverConfig from "@hoarder/shared/config";

export default async function SettingsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div>
      <Header />
      <div className="flex min-h-[calc(100vh-64px)] w-screen flex-col sm:h-[calc(100vh-64px)] sm:flex-row">
        <ValidAccountCheck />
        <div className="hidden flex-none sm:flex">
          <Sidebar />
        </div>
        <main className="flex-1 bg-muted sm:overflow-y-auto">
          {serverConfig.demoMode && <DemoModeBanner />}
          <div className="block w-full sm:hidden">
            <MobileSidebar />
            <Separator />
          </div>
          <div className="min-h-30 container p-4">{children}</div>
        </main>
      </div>
    </div>
  );
}
