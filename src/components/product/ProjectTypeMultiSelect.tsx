import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Info, ChevronDown } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface ProjectTypeMultiSelectProps {
  availableTypes: string[];
  selectedTypes: string[];
  onSelectionChange: (types: string[]) => void;
  tooltips: Record<string, string>;
}

export function ProjectTypeMultiSelect({
  availableTypes,
  selectedTypes,
  onSelectionChange,
  tooltips
}: ProjectTypeMultiSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleSelect = (value: string) => {
    if (selectedTypes.includes(value)) {
      onSelectionChange(selectedTypes.filter(type => type !== value));
    } else {
      onSelectionChange([...selectedTypes, value]);
    }
    // Keep dropdown open for multi-selection
  };

  const removeType = (typeToRemove: string) => {
    onSelectionChange(selectedTypes.filter(type => type !== typeToRemove));
  };

  return (
    <TooltipProvider>
      <div className="space-y-3">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              role="combobox"
              aria-expanded={isOpen}
              className="w-full justify-between"
            >
              {selectedTypes.length === 0 ? (
                <span className="text-muted-foreground">Select project types...</span>
              ) : (
                <span className="text-sm">
                  {selectedTypes.length} type{selectedTypes.length !== 1 ? 's' : ''} selected
                </span>
              )}
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0 bg-background border shadow-md z-50" align="start">
            <div className="max-h-64 overflow-auto">
              {availableTypes.map((type) => (
                <div
                  key={type}
                  className="flex items-center justify-between cursor-pointer hover:bg-accent px-3 py-2"
                  onClick={() => handleSelect(type)}
                >
                  <div className="flex items-center gap-2 flex-1">
                    <span className="flex-1">{type}</span>
                    {tooltips[type] && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="left" className="max-w-xs z-50">
                          <p className="text-sm">{tooltips[type]}</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  {selectedTypes.includes(type) && (
                    <div className="w-2 h-2 bg-primary rounded-full ml-2" />
                  )}
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
        
        {selectedTypes.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedTypes.map((type) => (
              <Badge key={type} variant="secondary" className="flex items-center gap-1">
                <span className="text-xs">{type}</span>
                <button
                  type="button"
                  onClick={() => removeType(type)}
                  className="ml-1 hover:bg-muted rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
