import AISettings from "@/components/dashboard/settings/AISettings";
import ApiKeySettings from "@/components/dashboard/settings/ApiKeySettings";
import { ChangeEmailAddress } from "@/components/dashboard/settings/ChangeEmailAddress";
import { ChangePassword } from "@/components/dashboard/settings/ChangePassword";
import ImportExport from "@/components/dashboard/settings/ImportExport";
import UserDetails from "@/components/dashboard/settings/UserDetails";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/server/api/client";
import { Download, KeyRound, Sparkle, User } from "lucide-react";

export default async function Settings() {
  const whoami = await api.users.whoami();
  return (
    <Tabs
      defaultValue="info"
      orientation="horizontal"
      className="flex flex-col gap-1"
    >
      <TabsList className="flex justify-start overflow-x-auto overflow-y-hidden">
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
            {whoami.localUser && (
              <>
                <ChangeEmailAddress />
                <ChangePassword />
              </>
            )}
            {!whoami.localUser && (
              <div className="flex flex-col sm:flex-row">
                Changing Email address and password is not possible for OAuth
                Users
              </div>
            )}
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
