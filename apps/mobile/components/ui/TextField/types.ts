import type { TextInput, TextInputProps } from "react-native";

type TextFieldProps = TextInputProps & {
  children?: React.ReactNode;
  leftView?: React.ReactNode;
  rightView?: React.ReactNode;
  label?: string;
  labelClassName?: string;
  containerClassName?: string;
  /**
   * For accessibility, can be overridden by accessibilityHint
   * @Material - shows error state with destructive color and icon
   * @iOS - No visual change
   */
  errorMessage?: string;
  /**
   * @MaterialOnly
   * @default outlined
   * Material variant for the input.
   */
  materialVariant?: "outlined" | "filled";
  materialRingColor?: string;
  materialHideActionIcons?: boolean;
};

type TextFieldRef = TextInput;

export type { TextFieldProps, TextFieldRef };
