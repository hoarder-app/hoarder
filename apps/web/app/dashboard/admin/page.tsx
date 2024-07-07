import { redirect } from "next/navigation";
import AdminActions from "@/components/dashboard/admin/AdminActions";
import ServerStats from "@/components/dashboard/admin/ServerStats";
import UserList from "@/components/dashboard/admin/UserList";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getServerAuthSession } from "@/server/auth";
import { Save, Undo } from "lucide-react";

import {
  ConfigSubSection,
  SectionSymbol,
  serverConfig,
} from "@hoarder/db/config/config";
import {
  ConfigType,
  ConfigValue,
  InferenceProviderEnum,
} from "@hoarder/db/config/configValue";

function createTabsTrigger(sectionName: string, section: ConfigSubSection) {
  return (
    <TabsTrigger value={sectionName}>{section[SectionSymbol].name}</TabsTrigger>
  );
}

function createTab(sectionName: string, section: ConfigSubSection) {
  return (
    <TabsContent value={sectionName}>
      <div className="flex flex-col gap-5 rounded-md border bg-background p-4">
        <Table className="lg:w-1/2">
          <TableBody>
            {Object.values(section).map((value) => createConfigValueUI(value))}
            <TableRow>
              <TableCell></TableCell>
              <TableCell>
                <Undo className="size-7 pr-2" />
                Reset
                <Save className="size-7 pr-2" />
                Save
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </TabsContent>
  );
}

const LOOKUP_TABLE = {
  [ConfigType.BOOLEAN]: createBooleanRow,
  [ConfigType.STRING]: createStringRow,
  [ConfigType.NUMBER]: createNumberRow,
  [ConfigType.INFERENCE_PROVIDER_ENUM]: createInferenceProviderRow,
};

function createConfigValueUI(configValue: ConfigValue<ConfigType>) {
  return (
    <TableRow>
      <TableCell>{configValue.name}</TableCell>
      <TableCell>{LOOKUP_TABLE[configValue.type](configValue)}</TableCell>
    </TableRow>
  );
}

function createBooleanRow(configValue: ConfigValue<ConfigType>) {
  return <Switch checked={configValue.defaultValue as boolean} />;
}
function createNumberRow(configValue: ConfigValue<ConfigType>) {
  return (
    <Input
      type="number"
      value={configValue.defaultValue as number}
      className="w-100"
    />
  );
}

function createStringRow(configValue: ConfigValue<ConfigType>) {
  return (
    <Input
      type="text"
      value={configValue.defaultValue?.toString()}
      className="w-100"
    />
  );
}

function createInferenceProviderRow(configValue: ConfigValue<ConfigType>) {
  return (
    <>
      <Select value={configValue.defaultValue as string}>
        <SelectTrigger className="w-fit">
          <SelectValue placeholder={configValue.defaultValue} />
        </SelectTrigger>
        <SelectContent>
          {Object.values(InferenceProviderEnum).map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}

export default async function AdminPage() {
  const session = await getServerAuthSession();
  if (!session || session.user.role !== "admin") {
    redirect("/");
  }
  return (
    <>
      <Tabs defaultValue="information" className="w-full">
        <TabsList className="grid w-full grid-cols-6 p-5">
          <TabsTrigger value="information">Information</TabsTrigger>
          {Object.entries(serverConfig).map((entry) =>
            createTabsTrigger(entry[0], entry[1]),
          )}
        </TabsList>
        <TabsContent value="information">
          <div className="rounded-md border bg-background p-4">
            <ServerStats />
            <AdminActions />
          </div>
          <div className="mt-4 rounded-md border bg-background p-4">
            <UserList />
          </div>
        </TabsContent>
        {Object.entries(serverConfig).map((entry) =>
          createTab(entry[0], entry[1]),
        )}
      </Tabs>
    </>
  );
}
