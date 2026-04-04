
import * as React from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { PopoverPortal } from "@radix-ui/react-popover";

interface MultiSelectProps {
  options: { label: string; value: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
}

export function MultiSelect({
  options = [],
  selected = [],
  onChange,
  placeholder = "Select options...",
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  const safeOptions = Array.isArray(options) ? options : [];
  const safeSelected = Array.isArray(selected) ? selected : [];

  const handleUnselect = (item: string) => {
    onChange(safeSelected.filter((i) => i !== item));
  };

  const handleSelect = (value: string) => {
    if (safeSelected.includes(value)) {
      onChange(safeSelected.filter((item) => item !== value));
    } else {
      onChange([...safeSelected, value]);
    }
  };

  const clearAll = () => {
    onChange([]);
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start text-left font-normal"
          >
            <span className="truncate">
              {safeSelected.length === 0
                ? placeholder
                : `${safeSelected.length} items selected`}
            </span>
          </Button>
        </PopoverTrigger>

        {/* ❗ FIXED: Portal prevents clipping inside modals */}
     <PopoverPortal>
      <PopoverContent
        className="w-80 p-0 z-[9999]"
        align="start"
        sideOffset={5}
      >
        <Command className="w-full">
          <div className="p-3 border-b">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Select Options</span>
              {safeSelected.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAll}
                  className="h-6 px-2 text-xs"
                >
                  Clear All
                </Button>
              )}
            </div>
          </div>

          {/* ❗ FIX: enable scrolling + stop scroll from bubbling */}
          <CommandList
            className="max-h-48 overflow-y-auto"
            onWheel={(e) => e.stopPropagation()}
          >
            <CommandGroup>
              {safeOptions.length === 0 ? (
                <div className="p-3 text-sm text-muted-foreground">
                  No options available
                </div>
              ) : (
                safeOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    onSelect={() => handleSelect(option.value)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center space-x-2 w-full">
                      <div
                        className={`w-4 h-4 border border-gray-300 rounded flex items-center justify-center ${
                          safeSelected.includes(option.value)
                            ? "bg-primary border-primary"
                            : ""
                        }`}
                      >
                        {safeSelected.includes(option.value) && (
                          <div className="w-2 h-2 bg-white rounded"></div>
                        )}
                      </div>
                      <span className="flex-1">{option.label}</span>
                    </div>
                  </CommandItem>
                ))
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </PopoverPortal>

      </Popover>

      {safeSelected.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {safeSelected.map((selectedItem) => {
            const option = safeOptions.find((opt) => opt.value === selectedItem);
            return (
              <Badge
                key={selectedItem}
                variant="secondary"
                className="text-xs px-2 py-1 flex items-center gap-1"
              >
                {option ? option.label : selectedItem}
                <X
                  className="h-3 w-3 cursor-pointer hover:text-destructive"
                  onClick={() => handleUnselect(selectedItem)}
                />
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}
