
import React, { useState } from 'react';
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Info, ChevronDown } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface ConditionalRequirementToggleProps {
  isRequired: boolean;
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
  agentTypeName: string;
  requirementMessage: string;
  marketName: string;
  children?: React.ReactNode;
}

export function ConditionalRequirementToggle({
  isRequired,
  isEnabled,
  onToggle,
  agentTypeName,
  requirementMessage,
  marketName,
  children
}: ConditionalRequirementToggleProps) {
  const [isOpen, setIsOpen] = useState(isRequired || isEnabled);
  
  const handleChevronClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleEnableToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newEnabled = !isEnabled;
    onToggle(newEnabled);
    if (newEnabled) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="space-y-3">
        {/* Status indicator */}
        <div className={`flex items-center gap-2 p-3 border rounded-md ${
          isRequired 
            ? "bg-blue-50 border-blue-200" 
            : "bg-green-50 border-green-200"
        }`}>
          <Info className={`h-4 w-4 ${isRequired ? "text-blue-500" : "text-green-500"}`} />
          <span className={`text-sm font-medium ${
            isRequired ? "text-blue-700" : "text-green-700"
          }`}>
            {isRequired ? "Required:" : "Optional:"}
          </span>
          <span className={`text-sm ${isRequired ? "text-blue-600" : "text-green-600"}`}>
            {requirementMessage}
          </span>
        </div>
        
        {/* Collapsible trigger */}
        <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-3 flex-1">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-muted rounded-md flex items-center justify-center">
                <Info className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div className="space-y-0.5 flex-1">
              <Label className="text-sm font-medium">
                {isRequired 
                  ? `${agentTypeName} Information` 
                  : `Require ${agentTypeName} for this market`
                }
              </Label>
              <p className="text-sm text-muted-foreground">
                {isRequired 
                  ? `Mandatory ${agentTypeName.toLowerCase()} information for this market`
                  : `Enable this if you want to designate a ${agentTypeName.toLowerCase()} even though it's not mandatory.`
                }
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {!isRequired && (
              <>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        While not legally required, having a {agentTypeName.toLowerCase()} can still be beneficial for business operations, local support, and customer relations.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Switch
                  checked={isEnabled}
                  onCheckedChange={() => onToggle(!isEnabled)}
                  onClick={handleEnableToggle}
                />
              </>
            )}
            <CollapsibleTrigger asChild>
              <button
                onClick={handleChevronClick}
                className="p-1 rounded-sm hover:bg-muted transition-colors"
              >
                <ChevronDown 
                  className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                    isOpen ? "rotate-180" : ""
                  }`} 
                />
              </button>
            </CollapsibleTrigger>
          </div>
        </div>

        {/* Collapsible content */}
        <CollapsibleContent className="space-y-4">
          {children}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
