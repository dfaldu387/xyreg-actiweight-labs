
import React, { useState, useMemo } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface EnhancedMultiSelectPhasesProps {
  availablePhases: string[];
  selectedPhases: string[];
  onChange: (value: string[]) => void;
  phaseOrder?: string[]; // Master lifecycle phase order for sorting selected phases
}

export function EnhancedMultiSelectPhases({
  availablePhases = [],
  selectedPhases = [],
  onChange,
  phaseOrder = [],
}: EnhancedMultiSelectPhasesProps) {
  const [open, setOpen] = useState(false);

  // Ensure we always have arrays, never undefined
  const safeAvailablePhases = Array.isArray(availablePhases) ? availablePhases : [];
  const safeSelectedPhases = Array.isArray(selectedPhases) ? selectedPhases : [];
  const safePhaseOrder = Array.isArray(phaseOrder) ? phaseOrder : [];

  // Create the ordered dropdown list as specified in the requirements
  const orderedDropdownPhases = useMemo(() => {
    // Group 1: Currently selected phases, ordered by master lifecycle sequence
    const selectedPhasesOrdered = safeSelectedPhases
      .slice()
      .sort((a, b) => {
        const indexA = safePhaseOrder.indexOf(a);
        const indexB = safePhaseOrder.indexOf(b);
        
        // If both phases are in the master order, sort by that order
        if (indexA !== -1 && indexB !== -1) {
          return indexA - indexB;
        }
        // If only one is in the master order, prioritize it
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        // If neither is in the master order, sort alphabetically
        return a.localeCompare(b);
      });

    // Group 3: Unselected phases, sorted alphabetically
    const unselectedPhases = safeAvailablePhases
      .filter(phase => !safeSelectedPhases.includes(phase))
      .slice()
      .sort((a, b) => a.localeCompare(b));

    return {
      selectedPhases: selectedPhasesOrdered,
      unselectedPhases: unselectedPhases,
      hasSelectedPhases: selectedPhasesOrdered.length > 0,
      hasUnselectedPhases: unselectedPhases.length > 0
    };
  }, [safeAvailablePhases, safeSelectedPhases, safePhaseOrder]);

  const handleSelect = (phase: string) => {
    // If already selected, remove it, otherwise add it
    const newSelectedPhases = safeSelectedPhases.includes(phase)
      ? safeSelectedPhases.filter((p) => p !== phase)
      : [...safeSelectedPhases, phase];
    
    onChange(newSelectedPhases);
  };

  const handleRemove = (phase: string) => {
    onChange(safeSelectedPhases.filter((p) => p !== phase));
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {safeSelectedPhases.length > 0 ? `${safeSelectedPhases.length} phases selected` : "Select phases"}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" style={{ zIndex: 50 }}>
          <Command>
            <CommandInput placeholder="Search phases..." />
            <CommandList>
              <CommandEmpty>No phases found.</CommandEmpty>
              
              {/* Group 1: Selected phases (ordered by master lifecycle sequence) */}
              {orderedDropdownPhases.hasSelectedPhases && (
                <>
                  <CommandGroup heading="Selected Phases" className="max-h-32 overflow-auto">
                    {orderedDropdownPhases.selectedPhases.map((phase) => (
                      <CommandItem
                        key={`selected-${phase}`}
                        value={phase}
                        onSelect={() => handleSelect(phase)}
                        className="bg-accent/50"
                      >
                        <Check className="mr-2 h-4 w-4 opacity-100" />
                        {phase}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  
                  {/* Group 2: Visual separator */}
                  {orderedDropdownPhases.hasUnselectedPhases && (
                    <Separator className="my-1" />
                  )}
                </>
              )}
              
              {/* Group 3: Unselected phases (alphabetically sorted) */}
              {orderedDropdownPhases.hasUnselectedPhases && (
                <CommandGroup 
                  heading={orderedDropdownPhases.hasSelectedPhases ? "Available Phases" : undefined}
                  className="max-h-32 overflow-auto"
                >
                  {orderedDropdownPhases.unselectedPhases.map((phase) => (
                    <CommandItem
                      key={`unselected-${phase}`}
                      value={phase}
                      onSelect={() => handleSelect(phase)}
                    >
                      <Check className="mr-2 h-4 w-4 opacity-0" />
                      {phase}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {safeSelectedPhases.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {safeSelectedPhases.map((phase) => (
            <Badge key={phase} variant="secondary" className="flex items-center gap-1">
              {phase}
              <button
                type="button"
                onClick={() => handleRemove(phase)}
                className="rounded-full hover:bg-muted ml-1"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
