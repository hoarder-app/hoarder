import { forwardRef } from "react";
import { Text, TextInput, View } from "react-native";

import { cn } from "@/lib/utils";

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
      <TextInput
        className={cn(
          inputClasses,
          "border border-input py-2.5 px-4 rounded-lg",
        )}
        {...props}
      />
    </View>
  ),
);

export { Input };
