import type { IconProps } from "@roninoss/icons";
import * as React from "react";
import { Platform, View, ViewProps, ViewStyle } from "react-native";
import { Text } from "@/components/ui/Text";
import { useColorScheme } from "@/lib/useColorScheme";
import { cn } from "@/lib/utils";
import { Icon } from "@roninoss/icons";

const Form = React.forwardRef<View, ViewProps>(
  ({ className, ...props }, ref) => {
    return (
      <View ref={ref} className={cn("flex-1 gap-9", className)} {...props} />
    );
  },
);

// Add as class when possible: https://github.com/marklawlor/nativewind/issues/522
const BORDER_CURVE: ViewStyle = {
  borderCurve: "continuous",
};

type FormSectionProps = ViewProps & {
  rootClassName?: string;
  footnote?: string;
  footnoteClassName?: string;
  ios?: {
    title: string;
    titleClassName?: string;
  };
  materialIconProps?: Omit<IconProps<"material">, "namingScheme" | "ios">;
};

const FormSection = React.forwardRef<
  React.ElementRef<typeof View>,
  FormSectionProps
>(
  (
    {
      rootClassName,
      className,
      footnote,
      footnoteClassName,
      ios,
      materialIconProps,
      style = BORDER_CURVE,
      children: childrenProps,
      ...props
    },
    ref,
  ) => {
    const { colors } = useColorScheme();
    const children = React.useMemo(() => {
      if (Platform.OS !== "ios") return childrenProps;
      const childrenArray = React.Children.toArray(childrenProps);
      // Add isLast prop to last child
      return React.Children.map(childrenArray, (child, index) => {
        if (!React.isValidElement(child)) return child;
        const isLast = index === childrenArray.length - 1;
        if (typeof child === "string") {
          console.log("FormSection - Invalid asChild element", child);
        }
        return React.cloneElement<ViewProps & { isLast?: boolean }, View>(
          typeof child === "string" ? <></> : child,
          { isLast },
        );
      });
    }, [childrenProps]);

    return (
      <View
        className={cn(
          "relative",
          Platform.OS !== "ios" && !!materialIconProps && "flex-row gap-4",
          rootClassName,
        )}
      >
        {Platform.OS === "ios" && !!ios?.title && (
          <Text
            variant="footnote"
            className={cn(
              "pb-1 pl-3 uppercase text-muted-foreground",
              ios?.titleClassName,
            )}
          >
            {ios.title}
          </Text>
        )}
        {!!materialIconProps && (
          <View className="ios:hidden pt-0.5">
            <Icon
              color={colors.grey}
              size={24}
              {...(materialIconProps as IconProps<"material">)}
            />
          </View>
        )}
        <View className="flex-1">
          <View
            ref={ref}
            className={cn(
              "ios:overflow-hidden ios:rounded-lg ios:bg-card ios:gap-0 ios:pl-1 gap-4",
              className,
            )}
            style={style}
            {...props}
          >
            {children}
          </View>
          {!!footnote && (
            <Text
              className={cn(
                "ios:pl-3 ios:pt-1 pl-3 pt-0.5 text-muted-foreground",
                footnoteClassName,
              )}
              variant="footnote"
            >
              {footnote}
            </Text>
          )}
        </View>
      </View>
    );
  },
);

const FormItem = React.forwardRef<
  View,
  ViewProps & {
    isLast?: boolean;
    iosSeparatorClassName?: string;
  }
>(({ className, isLast, iosSeparatorClassName, ...props }, ref) => {
  return (
    <>
      <View ref={ref} className={cn("ios:pr-1", className)} {...props} />
      {Platform.OS === "ios" && !isLast && (
        <View
          className={cn("ml-2 h-px flex-1 bg-border", iosSeparatorClassName)}
        />
      )}
    </>
  );
});

export { Form, FormItem, FormSection };
