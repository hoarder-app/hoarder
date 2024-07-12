import { eq } from "drizzle-orm";

import { db } from "../index";
import { config } from "../schema";
import { ConfigType, ConfigTypeMap, ConfigValue } from "./configValue";

/**
 * @returns the value only from the database without taking the value from the environment into consideration. Undefined if it does not exist
 */
export async function getConfigValueFromDB<T extends ConfigType>(
  configValue: ConfigValue<T>,
): Promise<ConfigTypeMap[T]> {
  const rows = await db
    .select()
    .from(config)
    .where(eq(config.key, configValue.key));
  if (rows.length === 0) {
    return configValue.defaultValue;
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

export async function storeConfigValue<T extends ConfigType>(
  configValue: ConfigValue<T>,
  valueToStore: ConfigTypeMap[T],
): Promise<void> {
  const value = valueToStore.toString();
  await db
    .insert(config)
    .values({ key: configValue.key, value })
    .onConflictDoUpdate({ target: config.key, set: { value } })
    .execute();
}

export async function deleteConfigValue<T extends ConfigType>(
  configValue: ConfigValue<T>,
): Promise<void> {
  await db.delete(config).where(eq(config.key, configValue.key));
}

/**
 * Parses a value based on the configValue configuration
 * @param configValue the configValue that is being parsed
 * @param value the value to parse
 */
function parseValue<T extends ConfigType>(
  configValue: ConfigValue<T>,
  value: string,
): ConfigTypeMap[T] {
  if (Array.isArray(configValue.validator)) {
    for (const validator of configValue.validator) {
      const parsed = validator.safeParse(value);
      if (parsed.success) {
        return parsed.data as ConfigTypeMap[T];
      }
    }
    throw new Error(
      `"${configValue.key}" contains an invalid value: "${value}"`,
    );
  }
  // Zod parsing for booleans is considering everything truthy as true, so it needs special handling
  if (configValue.type === ConfigType.BOOLEAN) {
    return (value === "true") as ConfigTypeMap[T];
  }
  const parsed = configValue.validator.safeParse(value);
  if (!parsed.success) {
    throw new Error(
      `"${configValue.key}" contains an invalid value: "${value}"`,
    );
  }
  return parsed.data as ConfigTypeMap[T];
}
