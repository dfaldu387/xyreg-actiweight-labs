
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface DocumentPhasesSelectorProps {
  availablePhases: string[];
  selectedPhases: string[];
  onChange: (phases: string[]) => void;
  onSave: () => Promise<boolean>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function DocumentPhasesSelector({
  availablePhases,
  selectedPhases,
  onChange,
  onSave,
  onCancel,
  isLoading = false
}: DocumentPhasesSelectorProps) {
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  // Filter phases based on search term
  const filteredPhases = availablePhases.filter(phase =>
    phase.toLowerCase().includes(search.toLowerCase())
  );

  // Toggle phase selection
  const togglePhase = (phase: string) => {
    if (selectedPhases.includes(phase)) {
      onChange(selectedPhases.filter(p => p !== phase));
    } else {
      onChange([...selectedPhases, phase]);
    }
  };

  // Handle save button click
  const handleSave = async () => {
    setSaving(true);
    const success = await onSave();
    setSaving(false);
    if (success) {
      onCancel();
    }
  };

  return (
    <div className="border rounded-md p-4 bg-background">
      <div className="mb-3 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search phases..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      
      <div className="max-h-[200px] overflow-y-auto space-y-2 mb-4">
        {filteredPhases.length > 0 ? (
          filteredPhases.map(phase => (
            <div key={phase} className="flex items-center space-x-2">
              <Checkbox
                id={`phase-${phase}`}
                checked={selectedPhases.includes(phase)}
                onCheckedChange={() => togglePhase(phase)}
              />
              <label
                htmlFor={`phase-${phase}`}
                className="text-sm cursor-pointer flex-1"
              >
                {phase}
              </label>
            </div>
          ))
        ) : (
          <div className="text-sm text-muted-foreground text-center py-2">
            No phases found matching "{search}"
          </div>
        )}
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={saving || isLoading}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSave} 
          disabled={saving || isLoading}
        >
          {(saving || isLoading) ? (
            <>
              <LoadingSpinner className="h-4 w-4 mr-2" />
              Saving...
            </>
          ) : (
            'Save'
          )}
        </Button>
      </div>
    </div>
  );
}
