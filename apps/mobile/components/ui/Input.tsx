import { forwardRef } from "react";
import { Text, TextInput, View } from "react-native";
import { cn } from "@/lib/utils";

import { TailwindResolver } from "../TailwindResolver";

export interface InputProps
  extends React.ComponentPropsWithoutRef<typeof TextInput> {
  label?: string;
  labelClasses?: string;
  inputClasses?: string;
}

const Input = forwardRef<React.ElementRef<typeof TextInput>, InputProps>(
  ({ className, label, labelClasses, inputClasses, ...props }, ref) => (
    <View className={cn("flex flex-col gap-1.5", className)}>
      {label && <Text className={cn("text-base", labelClasses)}>{label}</Text>}
      <TailwindResolver
        className="text-gray-400"
        comp={(styles) => (
          <TextInput
            placeholderTextColor={styles?.color?.toString()}
            ref={ref}
            className={cn(
              "bg-background text-foreground",
              inputClasses,
              "rounded-lg border border-input px-4 py-2.5",
            )}
            {...props}
          />
        )}
      />
    </View>
  ),
);
Input.displayName = "Input";

export { Input };
