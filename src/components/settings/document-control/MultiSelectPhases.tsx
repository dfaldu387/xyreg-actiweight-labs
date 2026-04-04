
import React, { useState } from "react";
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

interface MultiSelectPhasesProps {
  availablePhases: string[];
  selectedPhases: string[];
  onChange: (value: string[]) => void;
}

export function MultiSelectPhases({
  availablePhases = [],
  selectedPhases = [],
  onChange,
}: MultiSelectPhasesProps) {
  const [open, setOpen] = useState(false);

  // Ensure we always have arrays, never undefined
  const safeAvailablePhases = Array.isArray(availablePhases) ? availablePhases : [];
  const safeSelectedPhases = Array.isArray(selectedPhases) ? selectedPhases : [];

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
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Search phases..." />
            <CommandList>
              <CommandEmpty>No phases found.</CommandEmpty>
              <CommandGroup className="max-h-64 overflow-auto">
                {safeAvailablePhases.map((phase) => (
                  <CommandItem
                    key={phase}
                    value={phase}
                    onSelect={() => handleSelect(phase)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        safeSelectedPhases.includes(phase) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {phase}
                  </CommandItem>
                ))}
              </CommandGroup>
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
