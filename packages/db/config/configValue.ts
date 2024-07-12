import { ZodLiteral, ZodTypeAny } from "zod";

import { ConfigKeys } from "./config";

export enum ConfigType {
  BOOLEAN,
  STRING,
  PASSWORD,
  URL,
  NUMBER,
  INFERENCE_PROVIDER_ENUM,
}

export enum InferenceProviderEnum {
  DISABLED = "disabled",
  OPEN_AI = "openai",
  OLLAMA = "ollama",
}

export interface ConfigTypeMap {
  [ConfigType.BOOLEAN]: boolean;
  [ConfigType.STRING]: string;
  [ConfigType.PASSWORD]: string;
  [ConfigType.URL]: string;
  [ConfigType.NUMBER]: number;
  [ConfigType.INFERENCE_PROVIDER_ENUM]: string;
}

export type ConfigTypes = boolean | number | string;

export interface ConfigProperties<T extends ConfigType> {
  key: ConfigKeys;
  name: string;
  type: T;
  defaultValue: ConfigTypeMap[T];
  validator: ZodTypeAny | ZodLiteral<string>[];
  dependsOn?: ConfigKeys[];
  renderIf?: (value: ConfigTypes) => boolean;
}

export class ConfigValue<T extends ConfigType> {
  key: ConfigKeys;
  name: string;
  type: T;
  defaultValue: ConfigTypeMap[T];
  validator: ZodTypeAny | ZodLiteral<string>[];
  value: ConfigTypeMap[T] | undefined;
  dependsOn: ConfigKeys[];
  renderIf?: (value: ConfigTypes) => boolean;

  constructor(props: ConfigProperties<T>) {
    this.key = props.key;
    this.name = props.name;
    this.type = props.type;
    this.defaultValue = props.defaultValue;
    this.validator = props.validator;
    this.dependsOn = props.dependsOn ?? [];
    this.renderIf = props.renderIf;
  }

  shouldRender(currentValues: Record<ConfigKeys, ConfigTypes>): boolean {
    if (this.renderIf) {
      for (const key of Object.keys(currentValues)) {
        const configKey = key as ConfigKeys;
        if (
          this.dependsOn.includes(configKey) &&
          !this.renderIf(currentValues[configKey])
        ) {
          return false;
        }
      }
    }
    return true;
  }
}
