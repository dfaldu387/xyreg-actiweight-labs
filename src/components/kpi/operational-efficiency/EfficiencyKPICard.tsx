import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendIndicator } from "../TrendIndicator";
import { CircularProgress } from "@/components/common/CircularProgress";
import { SparklineChart } from "./SparklineChart";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface EfficiencyKPICardProps {
  title: string;
  value: number;
  format: "percentage" | "number" | "currency" | "decimal";
  unit?: string;
  currency?: string;
  subtitle?: React.ReactNode;
  trend?: {
    direction: "up" | "down" | "neutral";
    percentage?: number;
    label?: string;
  };
  status?: "success" | "warning" | "danger" | "neutral";
  icon?: React.ReactNode;
  className?: string;
  sparklineData: Array<{ period: string; value: number }>;
  visualization?: "circular" | "donut" | "number" | "bar";
  tooltipContent?: {
    formula: string;
    description: string;
  };
}

export function EfficiencyKPICard({
  title,
  value,
  format,
  unit,
  currency = "USD",
  subtitle,
  trend,
  status = "neutral",
  icon,
  className,
  sparklineData,
  visualization = "number",
  tooltipContent,
}: EfficiencyKPICardProps) {
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

  const formatValue = () => {
    switch (format) {
      case "percentage":
        return `${value}%`;
      case "currency":
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: currency,
        }).format(value);
      case "decimal":
        return value.toFixed(1);
      case "number":
      default:
        return value.toLocaleString();
    }
  };

  const renderVisualization = () => {
    switch (visualization) {
      case "circular":
      case "donut":
        return (
          <div className="flex items-center justify-center mb-2">
            <CircularProgress 
              percentage={value} 
              size={80}
            />
          </div>
        );
      default:
        return (
          <div className="text-3xl font-bold mb-2">
            {formatValue()}
            {unit && <span className="text-lg font-normal text-muted-foreground ml-1">{unit}</span>}
          </div>
        );
    }
  };

  return (
    <TooltipProvider>
      <Card className={cn("relative", getStatusColors(), className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            {title}
            {tooltipContent && (
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3 text-muted-foreground/60 hover:text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <div className="space-y-2">
                    <div>
                      <div className="font-medium">Formula:</div>
                      <div className="text-sm">{tooltipContent.formula}</div>
                    </div>
                    <div>
                      <div className="font-medium">Description:</div>
                      <div className="text-sm">{tooltipContent.description}</div>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            )}
          </CardTitle>
          {icon && (
            <div className="h-4 w-4 text-muted-foreground">
              {icon}
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Main Value Display */}
            {renderVisualization()}
            
            {/* Trend and Sparkline */}
            <div className="flex items-center justify-between">
              {trend && <TrendIndicator {...trend} />}
              <div className="flex-1 ml-2">
                <SparklineChart data={sparklineData} />
              </div>
            </div>

            {/* Subtitle/Additional Info */}
            {subtitle && (
              <div className="pt-2 border-t">
                {subtitle}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}