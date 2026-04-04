
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface DocumentPhaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: {
    name: string;
    phases?: string[];
  };
  phases: { id: string; name: string }[];
  onUpdatePhases: (phases: string[]) => Promise<boolean>;
}

export function DocumentPhaseDialog({ 
  open, 
  onOpenChange, 
  document, 
  phases,
  onUpdatePhases 
}: DocumentPhaseDialogProps) {
  const [selectedPhases, setSelectedPhases] = useState<string[]>(document.phases || []);
  const [isUpdating, setIsUpdating] = useState(false);
  const [availablePhaseIds, setAvailablePhaseIds] = useState<Record<string, string>>({});
  
  // Fetch phase IDs on component mount
  useEffect(() => {
    if (open && phases.length > 0) {
      // Build a map of phase names to IDs for easier reference
      const phaseMap: Record<string, string> = {};
      phases.forEach(phase => {
        phaseMap[phase.name] = phase.id;
      });
      setAvailablePhaseIds(phaseMap);
    }
  }, [open, phases]);
  
  const handlePhaseToggle = (phase: string) => {
    setSelectedPhases((prevSelected) => {
      if (prevSelected.includes(phase)) {
        return prevSelected.filter(p => p !== phase);
      } else {
        return [...prevSelected, phase];
      }
    });
  };
  
  const handleSave = async () => {
    setIsUpdating(true);
    try {
      const success = await onUpdatePhases(selectedPhases);
      if (success) {
        // Sync with Supabase by updating phase_assigned_documents ONLY
        await syncDocumentPhases(document.name, selectedPhases);
        onOpenChange(false);
        toast.success(`Updated phases for ${document.name}`);
      } else {
        toast.error(`Failed to update phases for ${document.name}`);
      }
    } catch (error) {
      console.error("Error saving document phases:", error);
      toast.error("An error occurred while updating phases");
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Sync document phases with Supabase using only phase_assigned_documents
  const syncDocumentPhases = async (documentName: string, phases: string[]): Promise<void> => {
    try {
      // Convert phase names to IDs
      const phaseIds = phases.map(phaseName => {
        const phaseId = availablePhaseIds[phaseName];
        if (!phaseId) {
          console.warn(`No ID found for phase: ${phaseName}`);
        }
        return phaseId;
      }).filter(Boolean);
      
      // Clear existing assignments
      const { error: deleteError } = await supabase
        .from('phase_assigned_documents')
        .delete()
        .eq('name', documentName);
        
      if (deleteError) {
        console.error("Error clearing existing assignments:", deleteError);
        throw deleteError;
      }
      
      // Insert new assignments
      if (phaseIds.length > 0) {
        const assignments = phaseIds.map(phaseId => ({
          phase_id: phaseId,
          name: documentName,
          status: 'Not Started',
          document_type: 'Standard'
        }));
        
        const { error: insertError } = await supabase
          .from('phase_assigned_documents')
          .insert(assignments);
          
        if (insertError) {
          console.error("Error inserting new assignments:", insertError);
          throw insertError;
        }
      }
    } catch (err) {
      console.error("Error in syncDocumentPhases:", err);
      throw err;
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Phases for {document.name}</DialogTitle>
          <DialogDescription>
            Select which phases this document should be assigned to.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <ScrollArea className="h-72 pr-4">
            <div className="space-y-4">
              {phases.map((phase) => (
                <div key={phase.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`phase-${phase.id}`}
                    checked={selectedPhases.includes(phase.name)}
                    onCheckedChange={() => handlePhaseToggle(phase.name)}
                  />
                  <label
                    htmlFor={`phase-${phase.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {phase.name}
                  </label>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isUpdating}>
            {isUpdating && <LoadingSpinner className="mr-2 h-4 w-4" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
