import { View } from "react-native";
import { cn } from "@/lib/utils";

function Divider({
  color = "#DFE4EA",
  className,
  orientation,
  ...props
}: {
  color?: string;
  orientation: "horizontal" | "vertical";
} & React.ComponentPropsWithoutRef<typeof View>) {
  const dividerStyles = [{ backgroundColor: color }];

  return (
    <View
      className={cn(
        orientation === "horizontal" ? "h-0.5" : "w-0.5",
        className,
      )}
      style={dividerStyles}
      {...props}
    />
  );
}

export { Divider };
