
import { useState, useEffect } from 'react';
import { ProductPhase } from '@/types/client';
import { toast } from 'sonner';

export function useAuditManagement(
  phases: ProductPhase[] = [],
  phaseAudits: Record<string, any[]> = {}
) {
  const [auditsPerPhase, setAuditsPerPhase] = useState<Record<string, any[]>>({});
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    try {
      if (!phases || !Array.isArray(phases)) {
        console.log("No valid phases provided to useAuditManagement");
        setError("Invalid phases data");
        return;
      }
      
      // Initialize with the provided phaseAudits
      setAuditsPerPhase(phaseAudits || {});
      setError(null);
    } catch (err) {
      console.error("Error processing audits:", err);
      setError("Failed to process audit data");
    }
  }, [phases, phaseAudits]);
  
  const addAuditToTimeline = (phase: ProductPhase, kind: "audit" | "design-review") => {
    try {
      if (!phase || !phase.id) {
        console.error("Invalid phase provided to addAuditToTimeline");
        toast.error("Cannot add milestone: Invalid phase");
        return;
      }
      
      // Create a new audit object
      const newAudit = {
        id: `temp-${phase.id}-${Date.now()}`,
        type: kind,
        name: `${kind === "audit" ? "Audit" : "Design Review"} - ${phase.name}`,
        date: new Date(),
        status: "Planned"
      };
      
      // Add to state
      setAuditsPerPhase(prev => {
        const updatedAudits = {...prev};
        if (!updatedAudits[phase.id]) {
          updatedAudits[phase.id] = [];
        }
        updatedAudits[phase.id] = [...updatedAudits[phase.id], newAudit];
        return updatedAudits;
      });
      
      toast.success(`${kind === "audit" ? "Audit" : "Design Review"} scheduled successfully`);
    } catch (err) {
      console.error("Error adding audit:", err);
      toast.error("Failed to schedule milestone");
    }
  };
  
  return { auditsPerPhase, addAuditToTimeline, error };
}
