import React from "react";
import { DynamicConfigTab } from "@/app/dashboard/admin/dynamicConfigTab";
import { TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/trpc";

import {
  ConfigKeys,
  ConfigSectionName,
  ConfigSubSection,
  SectionSymbol,
  serverConfig,
} from "@hoarder/db/config/config";
import { ConfigTypes } from "@hoarder/db/config/configValue";

function useConfigValues(
  refreshKey: number,
): Record<ConfigSectionName, Record<ConfigKeys, ConfigTypes>> | undefined {
  const { data, error } = api.admin.getConfig.useQuery(refreshKey);
  if (error) {
    throw error;
  }

  return data;
}

export function DynamicConfig() {
  const [refreshKey, setRefreshKey] = React.useState(0);
  const configValues = useConfigValues(refreshKey);

  if (!configValues) {
    return null;
  }

  return (
    <>
      {Object.values(ConfigSectionName).map((configSectionName) => {
        return (
          <DynamicConfigTab
            key={configSectionName}
            config={configValues[configSectionName]}
            configSectionName={configSectionName}
            onSave={() => {
              setRefreshKey((prevRefreshKey) => prevRefreshKey + 1);
            }}
          />
        );
      })}
    </>
  );
}

export function DynamicConfigTabTriggers() {
  return (
    <>
      {Object.entries(serverConfig).map(([key, value]) =>
        createTabsTrigger(key as ConfigSectionName, value),
      )}
    </>
  );
}

export function createTabsTrigger(
  configSectionName: ConfigSectionName,
  configSubSection: ConfigSubSection,
) {
  return (
    <TabsTrigger value={configSectionName} key={configSectionName}>
      {configSubSection[SectionSymbol].name}
    </TabsTrigger>
  );
}
