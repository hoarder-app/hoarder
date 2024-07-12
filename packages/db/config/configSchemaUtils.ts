import { z, ZodLiteral, ZodTypeAny } from "zod";

import { ConfigKeys, ConfigSectionName, serverConfig } from "./config";

/*
 * A general description of what is happening here:
 * The serverConfig contains the definition of all the config values possible and how they depend on each other:
 * * fullscreen screenshots only make sense if screenshot taking is turned on.
 * * when inference is turned off, there is no need to provide Ollama/OpenAPI information
 *
 * To properly validate this with Zod, we need to generate different schemas for different scenarios.
 * This file generates those schemas, by figuring out the dependencies between config flags, then generating the permutations of the values a config can take on
 * and then using this information to check which fields of the config would be rendered if a config flag has a certain value.
 * Those permutations are gathered up and the zod schemas are returned as a union for the UI to run the validations against.
 *
 * Sample:
 * * There are flags "a" and "b", which are both boolean, but "b" only makes sense if "a" is "true".
 * * First we figure out that b depends on a
 * * We figure out that a can take value "true" and "false"
 * * The permutations are simply "true" and "false"
 * * We then check which fields would be rendered if:
 *   * "a" is "true" --> "a" and "b" --> schema 1
 *   * "a" is "false" --> "a" --> schema 2
 * * These 2 schemas are returned with z.union([schema1, schema2]) and then the validations can be performed
 */

type AllowedMultiplications = ZodLiteral<boolean>[] | ZodLiteral<string>[];
type Multiplicators = Record<ConfigKeys, AllowedMultiplications>;
type Permutations = Record<
  ConfigKeys,
  ZodLiteral<boolean> | ZodLiteral<string>
>;

/**
 * Turns zod validators into their separate possible values they can take on
 * @param validator the validator from a ConfigValue to transform
 */
function mapValidatorToValues(
  validator: ZodTypeAny | ZodLiteral<string>[],
): AllowedMultiplications {
  if (Array.isArray(validator)) {
    return validator;
  }
  return [z.literal(true), z.literal(false)];
}

/**
 * @param input an object where the key is the config that can take multiple values and the value is the list of possible values for this key.
 * @returns an array with all the different permutations of the keys and values provided
 */
function calculatePermutations(input: Partial<Multiplicators>): Permutations[] {
  const keys: ConfigKeys[] = Object.keys(input) as ConfigKeys[];
  if (keys.length === 0) {
    return [{} as Permutations];
  }
  const [firstKey, ...restKeys] = keys;
  const restInput = restKeys.reduce(
    (obj, key) => ({ ...obj, [key]: input[key] }),
    {} as Multiplicators,
  );
  const restPermutations = calculatePermutations(restInput);
  return input[firstKey]!.flatMap((value) =>
    restPermutations.map((permutation) => ({
      [firstKey]: value,
      ...permutation,
    })),
  );
}

/**
 * @param configSectionName the name of the configSection to check for Dependencies
 * @returns an object containing all the config values another config value is depending on and the values the config can take on
 */
function calculateDependencies(
  configSectionName: ConfigSectionName,
): Partial<Multiplicators> {
  const configSection = serverConfig[configSectionName];
  const dependencies: Partial<Multiplicators> = {};
  for (const configValue of Object.values(configSection)) {
    if (configValue.dependsOn.length) {
      for (const dependentConfigKey of configValue.dependsOn) {
        dependencies[dependentConfigKey] = mapValidatorToValues(
          configSection[dependentConfigKey].validator,
        );
      }
    }
  }
  return dependencies;
}

/**
 * @param permutation The permutation to convert
 * @returns a new record where the zod validator is replaced with the actual value it can take on
 */
function convertPermutation(
  permutation: Partial<Permutations>,
): Record<string, string | boolean> {
  const result: Record<string, string | boolean> = {};
  for (const key in permutation) {
    result[key] = permutation[key as ConfigKeys]!.value;
  }
  return result;
}

/**
 * @param configSectionName the name of the section to create the schema for
 * @returns the config schema for the passed in config section
 */
export function getConfigSchema(
  configSectionName: ConfigSectionName,
): z.ZodType {
  const dependencies = calculateDependencies(configSectionName);
  const permutations = calculatePermutations(dependencies);

  const configSubSection = serverConfig[configSectionName];
  const results: Record<string, ZodTypeAny>[] = [];
  for (const permutation of permutations) {
    const convertedPermutation = convertPermutation(permutation);
    const result: Record<string, ZodTypeAny> = {};
    for (const configValue of Object.values(configSubSection)) {
      if (configValue.shouldRender(convertedPermutation)) {
        if (Object.keys(permutation).includes(configValue.key)) {
          result[configValue.key] = permutation[configValue.key];
        } else {
          result[configValue.key] = configValue.validator as ZodTypeAny;
        }
      }
    }
    results.push(result);
  }
  if (results.length === 1) {
    return z.object(results[0]);
  }
  // @ts-expect-error -- z.union is not type-able with dynamic values right now, so it does not work
  return z.union(results.map((result) => z.object(result)));
}
