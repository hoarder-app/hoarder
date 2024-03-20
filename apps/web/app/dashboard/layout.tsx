import MobileSidebar from "@/components/dashboard/sidebar/ModileSidebar";
import Sidebar from "@/components/dashboard/sidebar/Sidebar";
import DemoModeBanner from "@/components/DemoModeBanner";
import { Separator } from "@/components/ui/separator";

import serverConfig from "@hoarder/shared/config";

export default async function Dashboard({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen w-screen flex-col sm:h-screen sm:flex-row">
      <div className="hidden flex-none sm:flex">
        <Sidebar />
      </div>
      <main className="flex-1 bg-gray-100 sm:overflow-y-auto">
        {serverConfig.demoMode && <DemoModeBanner />}
        <div className="block w-full sm:hidden">
          <MobileSidebar />
          <Separator />
        </div>
        {children}
      </main>
    </div>
  );
}
