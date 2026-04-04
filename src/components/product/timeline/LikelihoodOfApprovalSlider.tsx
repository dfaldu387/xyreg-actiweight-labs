
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface LikelihoodOfApprovalSliderProps {
  likelihood: number;
  onUpdate?: (newLikelihood: number) => void;
  editable?: boolean;
  size?: 'sm' | 'default' | 'lg';
}

export function LikelihoodOfApprovalSlider({ 
  likelihood = 100, 
  onUpdate, 
  editable = false,
  size = 'default'
}: LikelihoodOfApprovalSliderProps) {
  const getTextColor = (value: number) => {
    if (value >= 90) return 'text-green-600';
    if (value >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleValueChange = (value: string) => {
    const numValue = parseInt(value, 10);
    onUpdate?.(numValue);
  };

  // Generate options in 5% increments
  const options = Array.from({ length: 21 }, (_, i) => i * 5);

  const containerClass = size === 'sm' ? 'w-40' : size === 'lg' ? 'w-56' : 'w-48';
  const textClass = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-sm' : 'text-xs';

  // If not editable, render as a simple badge display
  if (!editable) {
    return (
      <div className={`flex items-center gap-2 ${containerClass}`}>
        <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
          LoS:
        </span>
        <Badge variant="outline" className={`${getTextColor(likelihood)} border-current bg-transparent`}>
          {likelihood}%
        </Badge>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${containerClass}`}>
      <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
        LoS:
      </span>
      <div className="flex-1">
        <Select
          value={likelihood.toString()}
          onValueChange={handleValueChange}
          disabled={!editable}
        >
          <SelectTrigger className={`${textClass} h-8`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-background border border-border shadow-lg z-50 max-h-60 overflow-auto">
            {options.map((option) => (
              <SelectItem 
                key={option} 
                value={option.toString()}
                className="hover:bg-accent hover:text-accent-foreground cursor-pointer"
              >
                <span className={getTextColor(option)}>
                  {option}%
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
