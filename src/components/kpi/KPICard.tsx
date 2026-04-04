import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendIndicator } from "./TrendIndicator";
import { cn } from "@/lib/utils";
import { HelpCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    direction: "up" | "down" | "neutral";
    percentage?: number;
    label?: string;
  };
  status?: "success" | "warning" | "danger" | "neutral";
  icon?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
  tooltipContent?: {
    formula: string;
    description: string;
  };
}

export function KPICard({
  title,
  value,
  subtitle,
  trend,
  status = "neutral",
  icon,
  className,
  children,
  tooltipContent,
}: KPICardProps) {
  const getStatusColors = () => {
    switch (status) {
      case "success":
        return "border-l-4 border-l-success bg-success/5";
      case "warning":
        return "border-l-4 border-l-warning bg-warning/5";
      case "danger":
        return "border-l-4 border-l-destructive bg-destructive/5";
      default:
        return "border-l-4 border-l-border";
    }
  };

  return (
    <Card className={cn("relative", getStatusColors(), className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-1.5">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          {tooltipContent && (
            <Popover>
              <PopoverTrigger asChild>
                <button className="text-muted-foreground hover:text-foreground transition-colors">
                  <HelpCircle className="h-3.5 w-3.5" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80" side="top">
                <div className="space-y-2">
                  <p className="text-xs font-mono bg-muted p-2 rounded">{tooltipContent.formula}</p>
                  <p className="text-sm text-muted-foreground">{tooltipContent.description}</p>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
        {icon && (
          <div className="h-4 w-4 text-muted-foreground">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold">{value}</div>
            {trend && <TrendIndicator {...trend} />}
          </div>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
          {children}
        </div>
      </CardContent>
    </Card>
  );
}