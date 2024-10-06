import AISettings from "@/components/dashboard/settings/AISettings";
import ApiKeySettings from "@/components/dashboard/settings/ApiKeySettings";
import { ChangePassword } from "@/components/dashboard/settings/ChangePassword";
import ImportExport from "@/components/dashboard/settings/ImportExport";
import UserDetails from "@/components/dashboard/settings/UserDetails";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, KeyRound, Sparkle, User } from "lucide-react";

export default async function Settings() {
  return (
    <Tabs
      defaultValue="info"
      orientation="horizontal"
      className="flex flex-col gap-1"
    >
      <TabsList className="flex justify-start">
        <TabsTrigger className="flex items-center gap-2 p-3" value="info">
          <User className="size-4" />
          User Info
        </TabsTrigger>
        <TabsTrigger className="flex items-center gap-2 p-3" value="ai">
          <Sparkle className="size-4" />
          AI Settings
        </TabsTrigger>
        <TabsTrigger
          className="flex items-center gap-2 p-3"
          value="importexport"
        >
          <Download className="size-4" />
          Import / Export
        </TabsTrigger>
        <TabsTrigger className="flex items-center gap-2 p-3" value="apikeys">
          <KeyRound className="size-4" />
          API Keys
        </TabsTrigger>
      </TabsList>
      <div className="w-full">
        <TabsContent value="info">
          <div className="rounded-md border bg-background p-4">
            <UserDetails />
            <ChangePassword />
          </div>
        </TabsContent>
        <TabsContent value="ai">
          <AISettings />
        </TabsContent>
        <TabsContent value="importexport">
          <div className="rounded-md border bg-background p-4">
            <ImportExport />
          </div>
        </TabsContent>
        <TabsContent value="apikeys">
          <div className="rounded-md border bg-background p-4">
            <ApiKeySettings />
          </div>
        </TabsContent>
      </div>
    </Tabs>
  );
}
