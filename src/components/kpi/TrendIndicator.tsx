import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrendIndicatorProps {
  direction: "up" | "down" | "neutral";
  percentage?: number;
  label?: string;
  size?: "sm" | "md" | "lg";
}

export function TrendIndicator({ 
  direction, 
  percentage, 
  label, 
  size = "sm" 
}: TrendIndicatorProps) {
  const getIcon = () => {
    switch (direction) {
      case "up":
        return TrendingUp;
      case "down":
        return TrendingDown;
      case "neutral":
        return Minus;
    }
  };

  const getColors = () => {
    switch (direction) {
      case "up":
        return "text-success";
      case "down":
        return "text-destructive";
      case "neutral":
        return "text-muted-foreground";
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "h-3 w-3";
      case "md":
        return "h-4 w-4";
      case "lg":
        return "h-5 w-5";
    }
  };

  const Icon = getIcon();

  return (
    <div className={cn("flex items-center gap-1", getColors())}>
      <Icon className={getSizeClasses()} />
      {percentage !== undefined && (
        <span className="text-xs font-medium">
          {percentage > 0 ? "+" : ""}{Math.round(percentage)}%
        </span>
      )}
      {label && (
        <span className="text-xs">
          {label}
        </span>
      )}
    </div>
  );
}