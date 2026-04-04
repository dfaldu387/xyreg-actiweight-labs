import React from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface ProjectTypeSingleSelectProps {
  availableTypes: string[];
  selectedType: string;
  onSelectionChange: (type: string) => void;
  tooltips?: Record<string, string>;
}

export function ProjectTypeSingleSelect({
  availableTypes,
  selectedType,
  onSelectionChange,
  tooltips = {}
}: ProjectTypeSingleSelectProps) {
  return (
    <RadioGroup value={selectedType} onValueChange={onSelectionChange}>
      <div className="space-y-2">
        {availableTypes.map((type) => (
          <div key={type} className="flex items-center space-x-2">
            <RadioGroupItem value={type} id={type} />
            <Label htmlFor={type} className="flex items-center gap-2 cursor-pointer flex-1">
              {type}
              {tooltips[type] && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="z-[9992] max-w-xs text-sm">
                    {tooltips[type]}
                  </TooltipContent>
                </Tooltip>
              )}
            </Label>
          </div>
        ))}
      </div>
    </RadioGroup>
  );
}
