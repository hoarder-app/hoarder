import * as React from "react";
import { Pressable, TextInput, View } from "react-native";
import { Text } from "@/components/ui/Text";
import { cn } from "@/lib/utils";
import { useAugmentedRef, useControllableState } from "@rn-primitives/hooks";

import type { TextFieldProps, TextFieldRef } from "./types";

const TextField = React.forwardRef<TextFieldRef, TextFieldProps>(
  (
    {
      value: valueProp,
      onChangeText: onChangeTextProp,
      editable,
      className,
      children: _children,
      leftView,
      rightView,
      label,
      labelClassName,
      containerClassName,
      accessibilityHint,
      errorMessage,
      materialVariant: _materialVariant,
      materialRingColor: _materialRingColor,
      materialHideActionIcons: _materialHideActionIcons,
      ...props
    },
    ref,
  ) => {
    const inputRef = useAugmentedRef({ ref, methods: { focus, blur, clear } });

    const [value = "", onChangeText] = useControllableState({
      prop: valueProp,
      defaultProp: valueProp ?? "",
      onChange: onChangeTextProp,
    });

    function focus() {
      inputRef.current?.focus();
    }

    function blur() {
      inputRef.current?.blur();
    }

    function clear() {
      onChangeText("");
    }

    return (
      <Pressable
        className={cn(editable === false && "opacity-50", containerClassName)}
        disabled={editable === false}
        onPress={focus}
      >
        {!!label && (
          <View className={cn("flex-row pt-2", !leftView ? "pl-1.5" : "pl-2")}>
            {leftView}
            <Text
              className={cn(
                "text-muted-foreground",
                !leftView ? "pl-1" : "pl-2",
                labelClassName,
              )}
            >
              {label}
            </Text>
          </View>
        )}
        <View className="flex-row">
          {!!leftView && !label && leftView}
          <TextInput
            ref={inputRef}
            editable={editable}
            className={cn(
              "flex-1 px-2.5 py-3 text-[17px] text-foreground",
              className,
            )}
            onChangeText={onChangeText}
            value={value}
            clearButtonMode="while-editing"
            accessibilityHint={accessibilityHint ?? errorMessage}
            {...props}
          />
          {rightView}
        </View>
      </Pressable>
    );
  },
);

TextField.displayName = "iOSTextField";

export { TextField };
