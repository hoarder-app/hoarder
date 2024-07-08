import { z } from "zod";

export enum ConfigType {
  BOOLEAN,
  STRING,
  PASSWORD,
  NUMBER,
  INFERENCE_PROVIDER_ENUM,
}

export enum InferenceProviderEnum {
  DISABLED = "disabled",
  OPEN_AI = "openai",
  OLLAMA = "ollama",
}

export const InferenceProviderEnumValidator = z.enum([
  InferenceProviderEnum.DISABLED,
  InferenceProviderEnum.OPEN_AI,
  InferenceProviderEnum.OLLAMA,
]);

export type InferenceProviderEnumZodType =
  typeof InferenceProviderEnumValidator;

export interface ConfigTypeMap {
  [ConfigType.BOOLEAN]: boolean;
  [ConfigType.STRING]: string;
  [ConfigType.PASSWORD]: string;
  [ConfigType.NUMBER]: number;
  [ConfigType.INFERENCE_PROVIDER_ENUM]: string;
}

export interface ConfigValidatorMap {
  [ConfigType.BOOLEAN]: z.ZodBoolean;
  [ConfigType.STRING]: z.ZodString;
  [ConfigType.PASSWORD]: z.ZodString;
  [ConfigType.NUMBER]: z.ZodNumber;
  [ConfigType.INFERENCE_PROVIDER_ENUM]: InferenceProviderEnumZodType;
}

export interface ConfigProperties<T extends ConfigType> {
  key: string;
  name: string;
  type: T;
  defaultValue: ConfigTypeMap[T];
  validator: ConfigValidatorMap[T];
}

export class ConfigValue<T extends ConfigType> implements ConfigProperties<T> {
  key: string;
  name: string;
  type: T;
  defaultValue: ConfigTypeMap[T];
  validator: ConfigValidatorMap[T];
  value: ConfigTypeMap[T] | undefined;

  constructor(props: ConfigProperties<T>) {
    this.key = props.key;
    this.name = props.name;
    this.type = props.type;
    this.defaultValue = props.defaultValue;
    this.validator = props.validator;
  }

  setValue(value: ConfigTypeMap[T]): void {
    this.value = value;
  }
}
