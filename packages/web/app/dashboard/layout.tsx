import { Separator } from "@/components/ui/separator";
import MobileSidebar from "./components/ModileSidebar";
import Sidebar from "./components/Sidebar";

export default async function Dashboard({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-screen w-screen flex-col sm:flex-row">
      <div className="hidden flex-none sm:flex">
        <Sidebar />
      </div>
      <main className="flex-1 overflow-y-auto bg-gray-100">
        <div className="block w-full sm:hidden">
          <MobileSidebar />
          <Separator />
        </div>
        {children}
      </main>
    </div>
  );
}
