
import React, { useState } from 'react';
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Package, ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface ImporterInformationToggleProps {
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
  marketName: string;
  children?: React.ReactNode;
}

export function ImporterInformationToggle({
  isEnabled,
  onToggle,
  marketName,
  children
}: ImporterInformationToggleProps) {
  const [isOpen, setIsOpen] = useState(isEnabled);

  const handleToggle = () => {
    console.log('Importer toggle changed:', { enabled: !isEnabled, marketName, currentState: isEnabled });
    const newEnabled = !isEnabled;
    onToggle(newEnabled);
    if (!newEnabled) {
      setIsOpen(false);
    }
  };

  const handleSwitchChange = (checked: boolean) => {
    console.log('Importer switch changed:', { enabled: checked, marketName });
    onToggle(checked);
    if (!checked) {
      setIsOpen(false);
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="space-y-3">
        <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-muted rounded-md flex items-center justify-center">
                <Package className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Add Importer Information</Label>
              <p className="text-sm text-muted-foreground">
                Optional business partner information for import operations.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Switch
              checked={isEnabled}
              onCheckedChange={handleSwitchChange}
              className="data-[state=checked]:bg-primary"
            />
            <CollapsibleTrigger asChild>
              <button className="p-1 hover:bg-muted rounded-sm transition-colors">
                <ChevronDown 
                  className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                    isOpen ? "rotate-180" : ""
                  }`} 
                />
              </button>
            </CollapsibleTrigger>
          </div>
        </div>

        <CollapsibleContent className="space-y-4">
          {children}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
