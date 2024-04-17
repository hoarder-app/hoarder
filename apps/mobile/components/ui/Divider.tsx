import { View } from "react-native";
import { cn } from "@/lib/utils";

function Divider({
  className,
  orientation,
  ...props
}: {
  color?: string;
  orientation: "horizontal" | "vertical";
} & React.ComponentPropsWithoutRef<typeof View>) {
  return (
    <View
      className={cn(
        "bg-accent",
        orientation === "horizontal" ? "h-0.5" : "w-0.5",
        className,
      )}
      {...props}
    />
  );
}

export { Divider };
