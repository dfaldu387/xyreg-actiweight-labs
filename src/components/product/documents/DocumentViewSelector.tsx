
import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, FileText, Layers, Package } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

interface DocumentViewSelectorProps {
  activeView: string;
  onViewChange: (view: string) => void;
  counts: {
    currentPhase: number;
    allPhases: number;
    productSpecific: number;
  };
  currentPhaseName?: string;
}

export function DocumentViewSelector({ 
  activeView, 
  onViewChange, 
  counts,
  currentPhaseName 
}: DocumentViewSelectorProps) {
  
  const viewOptions = [
    {
      value: "all-phases",
      label: "Phase CIs",
      description: "Documents across all lifecycle phases",
      icon: <Layers className="h-4 w-4" />,
      count: counts.allPhases
    },
    {
      value: "product-specific",
      label: "Core CIs", 
      description: "Custom documents for this product",
      icon: <Package className="h-4 w-4" />,
      count: counts.productSpecific
    }
  ];

  const currentView = viewOptions.find(option => option.value === activeView);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2 min-w-[200px] justify-between bg-background">
          <div className="flex items-center gap-2">
            {currentView?.icon}
            <span>{currentView?.label}</span>
            <Badge variant="secondary">{currentView?.count || 0}</Badge>
          </div>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80 bg-background border shadow-lg z-50">{/* Ensure opaque background and high z-index */}
        <DropdownMenuLabel>Document Views</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {viewOptions.map((option) => (
          <DropdownMenuItem 
            key={option.value}
            onClick={() => onViewChange(option.value)}
            className="flex items-start gap-3 p-3 cursor-pointer"
          >
            <div className="text-muted-foreground mt-0.5">
              {option.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{option.label}</span>
                <Badge variant="outline">{option.count}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {option.description}
              </p>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
