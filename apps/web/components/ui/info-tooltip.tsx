"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { HelpCircle, Info } from "lucide-react";
import { useTheme } from "next-themes";

export default function InfoTooltip({
  className,
  children,
  size,
  variant = "tip",
}: {
  className?: string;
  size?: number;
  children?: React.ReactNode;
  variant?: "tip" | "explain";
}) {
  const { theme } = useTheme();
  const iconColor = theme === "dark" ? "#ffffff" : "#494949";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {variant === "tip" ? (
          <Info
            color={iconColor}
            className={cn("cursor-pointer", className)}
            size={size}
          />
        ) : (
          <HelpCircle
            color={iconColor}
            className={cn("cursor-pointer", className)}
            size={size}
          />
        )}
      </TooltipTrigger>
      <TooltipContent
        className={cn(
          theme === "dark" ? "bg-gray-800 text-white" : "bg-white text-black",
          className,
        )}
      >
        {children}
      </TooltipContent>
    </Tooltip>
  );
}
