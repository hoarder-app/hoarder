import type { TextInput, TextInputProps } from "react-native";

interface SearchInputProps extends TextInputProps {
  containerClassName?: string;
  iconContainerClassName?: string;
  cancelText?: string;
  iconColor?: string;
}

type SearchInputRef = TextInput;

export type { SearchInputProps, SearchInputRef };
