import type { TextInputProps } from "react-native";
import { forwardRef } from "react";
import { ActivityIndicator, Text, TextInput, View } from "react-native";
import { cn } from "@/lib/utils";

import { TailwindResolver } from "../TailwindResolver";

export interface InputProps extends TextInputProps {
  label?: string;
  labelClasses?: string;
  inputClasses?: string;
  loading?: boolean;
}

export const Input = forwardRef<TextInput, InputProps>(
  (
    { className, label, labelClasses, inputClasses, loading, ...props },
    ref,
  ) => {
    return (
      <View className={cn("flex flex-col gap-1.5", className)}>
        {label && (
          <Text className={cn("text-base", labelClasses)}>{label}</Text>
        )}
        <TailwindResolver
          className="text-gray-400"
          comp={(styles) => (
            <TextInput
              ref={ref}
              placeholderTextColor={styles?.color?.toString()}
              className={cn(
                "bg-background text-foreground",
                inputClasses,
                "rounded-lg border border-input px-4 py-2.5",
              )}
              {...props}
            />
          )}
        />
        {loading && (
          <ActivityIndicator className="absolute bottom-0 right-0 p-2" />
        )}
      </View>
    );
  },
);
