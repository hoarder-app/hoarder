import { eq } from "drizzle-orm";

import { db } from "../index";
import { config } from "../schema";
import { ConfigType, ConfigTypeMap, ConfigValue } from "./configValue";

/**
 * @returns the value only from the database without taking the value from the environment into consideration. Undefined if it does not exist
 */
async function getConfigValueFromDB<T extends ConfigType>(
  configValue: ConfigValue<T>,
): Promise<ConfigTypeMap[T] | undefined> {
  const rows = await db
    .select()
    .from(config)
    .where(eq(config.key, configValue.key));
  if (rows.length === 0) {
    return void 0;
  }
  return parseValue(configValue, rows[0].value);
}

/**
 * @returns the value from the environment variable. Undefined if it does not exist.
 */
export function getConfigValueFromEnv<T extends ConfigType>(
  configValue: ConfigValue<T>,
): ConfigTypeMap[T] | undefined {
  const environmentValue = process.env[configValue.key];
  if (environmentValue === undefined) {
    return void 0;
  }
  return parseValue(configValue, environmentValue);
}

/**
 * @returns the value of the config, considering the database, the environment variable and the default value. Will always return a value
 */
export async function getConfigValue<T extends ConfigType>(
  configValue: ConfigValue<T>,
): Promise<ConfigTypeMap[T]> {
  const dbValue = await getConfigValueFromDB(configValue);
  if (dbValue) {
    return dbValue;
  }
  const envValue = getConfigValueFromEnv(configValue);
  if (envValue) {
    return envValue;
  }
  return configValue.defaultValue;
}

export async function storeValue<T extends ConfigType>(
  configValue: ConfigValue<T>,
): Promise<void> {
  const value = configValue.value?.toString() ?? "";
  await db
    .insert(config)
    .values({ key: configValue.key, value })
    .onConflictDoUpdate({ target: config.key, set: { value } })
    .execute();
}

function parseValue<T extends ConfigType>(
  configValue: ConfigValue<T>,
  value: string,
): ConfigTypeMap[T] | undefined {
  const parsed = configValue.validator.safeParse(value);
  if (!parsed.success) {
    return undefined;
  }
  return parsed.data as ConfigTypeMap[T];
}
