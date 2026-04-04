
import React, { useState, useEffect, useRef } from "react";
import { Check, ChevronsUpDown, Loader2, Plus } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { NotifiedBody } from "@/types/notifiedBody";
import { useNotifiedBodies } from "@/hooks/useNotifiedBodies";
import { formatNotifiedBodyNumber } from "@/utils/notifiedBodyUtils";
import { ManualNotifiedBodyForm } from "./ManualNotifiedBodyForm";

interface NotifiedBodySearchDropdownProps {
  value?: NotifiedBody;
  onSelect: (notifiedBody: NotifiedBody) => void;
  placeholder?: string;
}

export function NotifiedBodySearchDropdown({
  value,
  onSelect,
  placeholder = "Search for a Notified Body..."
}: NotifiedBodySearchDropdownProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showManualEntry, setShowManualEntry] = useState(false);
  const { notifiedBodies, loading, error, search, refetch } = useNotifiedBodies();
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load all notified bodies when dropdown opens
  useEffect(() => {
    if (open && notifiedBodies.length === 0 && !searchQuery) {
      refetch();
    }
  }, [open]);

  // Handle debounced search
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    if (searchQuery.trim()) {
      debounceTimeoutRef.current = setTimeout(() => {
        search(searchQuery);
      }, 300);
    } else if (open) {
      // Reset to full list when search is cleared
      refetch();
    }

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const handleInputChange = (newValue: string) => {
    setSearchQuery(newValue);
  };

  const handleManualEntry = () => {
    setShowManualEntry(true);
    setOpen(false);
  };

  const handleManualSubmit = (notifiedBody: NotifiedBody) => {
    onSelect(notifiedBody);
    setShowManualEntry(false);
  };

  const handleManualCancel = () => {
    setShowManualEntry(false);
  };

  if (error) {
    return (
      <div className="w-full p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
        Error loading Notified Bodies: {error}
      </div>
    );
  }

  if (showManualEntry) {
    return (
      <ManualNotifiedBodyForm
        onSubmit={handleManualSubmit}
        onCancel={handleManualCancel}
      />
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={loading}
        >
          {value ? (
            <span className="truncate flex items-center gap-2">
              {value.source === 'manual' && (
                <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Manual</span>
              )}
              {value.name} (NB {formatNotifiedBodyNumber(value.nb_number)})
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          {loading ? (
            <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin" />
          ) : (
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search by name or NB number..."
            value={searchQuery}
            onValueChange={handleInputChange}
          />
          <CommandList>
            {loading && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
              </div>
            )}
            {!loading && notifiedBodies.length === 0 && (
              <CommandEmpty>
                <div className="flex flex-col items-center gap-3 py-4">
                  <p className="text-sm text-muted-foreground">No Notified Body found.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleManualEntry}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Custom NB
                  </Button>
                </div>
              </CommandEmpty>
            )}
            {!loading && notifiedBodies.length > 0 && (
              <>
                <CommandGroup>
                  {notifiedBodies.map((nb) => (
                    <CommandItem
                      key={nb.id}
                      value={nb.id}
                      onSelect={() => {
                        console.log('Selected NotifiedBody:', nb);
                        console.log('NotifiedBody scope:', nb.scope);
                        onSelect(nb);
                        setOpen(false);
                      }}
                      className="flex flex-col items-start py-3"
                    >
                      <div className="flex items-center w-full">
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            value?.id === nb.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex-1">
                          <div className="font-medium">{nb.name}</div>
                          <div className="text-sm text-muted-foreground">
                            NB {formatNotifiedBodyNumber(nb.nb_number)} • {nb.country}
                          </div>
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
                <div className="border-t p-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleManualEntry}
                    className="w-full flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Custom NB
                  </Button>
                </div>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
