import React from "react";
import { Button } from "@/components/ui/button";
import { Filter, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

interface PhaseFilterProps {
  phaseFilter: string[];
  onPhaseFilterChange: (phase: string) => void;
  availablePhases: string[];
}

export function PhaseFilter({ phaseFilter, onPhaseFilterChange, availablePhases }: PhaseFilterProps) {
  const isShowingAll = phaseFilter.length === 0;
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2 bg-background">
          <Filter className="h-4 w-4" />
          <span>
            {isShowingAll 
              ? "Filter by Phase" 
              : phaseFilter.length === 1 
                ? phaseFilter[0]
                : `${phaseFilter.length} Phases`
            }
          </span>
          {isShowingAll ? (
            <Badge variant="outline" className="ml-1">All</Badge>
          ) : (
            <Badge variant="secondary" className="ml-1">
              {phaseFilter.length}
            </Badge>
          )}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border border-border z-50">
        <DropdownMenuLabel>Phase</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem 
          checked={isShowingAll}
          onCheckedChange={() => onPhaseFilterChange('__SHOW_ALL__')}
          className="font-medium"
        >
          All Phases
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[300px]">
          {availablePhases.map((phase) => (
            <DropdownMenuCheckboxItem 
              key={phase}
              checked={phaseFilter.includes(phase)}
              onCheckedChange={(checked) => {
                onPhaseFilterChange(phase);
              }}
              onSelect={(e) => e.preventDefault()}
            >
              {phase}
            </DropdownMenuCheckboxItem>
          ))}
        </ScrollArea>
        {phaseFilter.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem 
              checked={false}
              onCheckedChange={() => onPhaseFilterChange('__CLEAR_ALL__')}
              className="text-muted-foreground"
            >
              Clear all filters
            </DropdownMenuCheckboxItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}