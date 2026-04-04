import React from "react";
import { VariantGroupSummary } from "@/services/variantGroupService";
import { Badge } from "@/components/ui/badge";

interface Props {
  summary: VariantGroupSummary;
  mode?: "compact" | "expanded";
}

export function VariantSummaryDisplay({ summary, mode = "compact" }: Props) {
  const dimensions = Object.entries(summary);

  if (dimensions.length === 0) {
    return null;
  }

  if (mode === "compact") {
    return (
      <div className="flex flex-wrap gap-1.5 text-xs">
        {dimensions.map(([dimName, dimData]) => (
          <Badge key={dimName} variant="secondary" className="font-normal">
            {dimName}: {dimData.count}
          </Badge>
        ))}
      </div>
    );
  }

  // Expanded mode
  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-muted-foreground">Variants:</div>
      <div className="space-y-1.5">
        {dimensions.map(([dimName, dimData]) => (
          <div key={dimName} className="text-xs">
            <span className="font-medium">{dimName}:</span>{" "}
            {dimData.count === 1 && dimData.value ? (
              <span className="text-muted-foreground">{dimData.value}</span>
            ) : (
              <span className="text-muted-foreground">
                {dimData.count} ({dimData.values?.join(", ")})
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
