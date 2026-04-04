
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
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
import { toast } from "sonner";

interface Phase {
  id: string;
  name: string;
}

interface DocumentPhaseSelectorProps {
  documentName: string;
  currentPhases?: string[];
  onPhasesChange?: (phases: string[]) => void;
  companyId?: string;
  isLoading?: boolean;
  availablePhases?: string[];
  onPhaseSelect?: (documentName: string, phases: string[]) => void;
  onUpdatePhases?: () => Promise<void>;
}

export function DocumentPhaseSelector({
  documentName,
  currentPhases = [],
  onPhasesChange,
  companyId,
  isLoading = false,
  availablePhases = [],
  onPhaseSelect,
  onUpdatePhases
}: DocumentPhaseSelectorProps) {
  const [open, setOpen] = useState(false);
  const [availablePhasesFromDB, setAvailablePhasesFromDB] = useState<Phase[]>([]);
  const [selectedPhases, setSelectedPhases] = useState<string[]>(currentPhases);

  useEffect(() => {
    if (companyId && availablePhases.length === 0) {
      fetchAvailablePhases();
    } else if (availablePhases.length > 0) {
      // Convert string array to Phase objects for consistency
      const phaseObjects = availablePhases.map((phase, index) => ({
        id: `phase-${index}`,
        name: phase
      }));
      setAvailablePhasesFromDB(phaseObjects);
    }
  }, [companyId, availablePhases]);

  useEffect(() => {
    setSelectedPhases(currentPhases);
  }, [currentPhases]);

  const fetchAvailablePhases = async () => {
    if (!companyId) return;

    try {
      const { data: phases, error } = await supabase
        .from('phases')
        .select('id, name')
        .eq('company_id', companyId)
        .order('position');

      if (error) {
        console.error('Error fetching phases:', error);
        return;
      }

      setAvailablePhasesFromDB(phases || []);
    } catch (error) {
      console.error('Error in fetchAvailablePhases:', error);
    }
  };

  const handlePhaseToggle = async (phaseName: string) => {
    const newSelectedPhases = selectedPhases.includes(phaseName)
      ? selectedPhases.filter(p => p !== phaseName)
      : [...selectedPhases, phaseName];

    setSelectedPhases(newSelectedPhases);

    try {
      // Call onPhaseSelect if provided (for DocumentListItem usage)
      if (onPhaseSelect) {
        onPhaseSelect(documentName, newSelectedPhases);
        return;
      }

      // Legacy behavior for direct phase updates
      if (onPhasesChange) {
        onPhasesChange(newSelectedPhases);
      }

      // Get document assignments for this document and this company's phases
      const { data: assignments, error: assignmentError } = await supabase
        .from('phase_assigned_documents')
        .select(`
          id,
          name,
          phase_id,
          phases!phase_assigned_documents_phase_id_fkey(name)
        `)
        .eq('name', documentName);

      if (assignmentError) {
        console.error('Error fetching document assignments:', assignmentError);
        return;
      }

      // Update the phases
      if (onUpdatePhases) {
        await onUpdatePhases();
      }
      
      toast.success(`Document phases updated`);
    } catch (error) {
      console.error('Error updating document phases:', error);
      toast.error('Failed to update document phases');
    }
  };

  const phasesToDisplay = availablePhasesFromDB.length > 0 ? availablePhasesFromDB : [];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={isLoading}
        >
          {selectedPhases.length === 0
            ? "Select phases..."
            : `${selectedPhases.length} phase${selectedPhases.length === 1 ? '' : 's'} selected`}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search phases..." />
          <CommandList>
            <CommandEmpty>No phases found.</CommandEmpty>
            <CommandGroup>
              {phasesToDisplay.map((phase) => (
                <CommandItem
                  key={phase.id}
                  value={phase.name}
                  onSelect={() => handlePhaseToggle(phase.name)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedPhases.includes(phase.name) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {phase.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
