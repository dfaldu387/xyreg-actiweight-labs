
import { useState, useEffect } from 'react';
import { useProductPhases } from '@/hooks/useProductPhases';

export interface DocumentPhaseTimeline {
  phaseId?: string;
  phaseName?: string;
  phaseStartDate?: Date;
  phaseEndDate?: Date;
  hasTimeline: boolean;
}

export const useDocumentPhaseTimeline = (
  productId?: string, 
  companyId?: string, 
  documentPhaseId?: string
): DocumentPhaseTimeline => {
  const { phases, isLoading } = useProductPhases(productId, companyId);
  const [phaseTimeline, setPhaseTimeline] = useState<DocumentPhaseTimeline>({
    hasTimeline: false
  });

  useEffect(() => {
   

    

    if (isLoading || !documentPhaseId || !phases.length) {
      
      setPhaseTimeline({ hasTimeline: false });
      return;
    }

    // Find the phase that matches the document's phase_id
    const documentPhase = phases.find(phase => phase.id === documentPhaseId);
    
    
    
    if (!documentPhase) {
     
      setPhaseTimeline({ hasTimeline: false });
      return;
    }

    // Check if BOTH start date AND end date exist (both required for a complete timeline)
    const hasTimeline = !!(documentPhase.start_date && documentPhase.end_date);
    
    
    
    setPhaseTimeline({
      phaseId: documentPhase.id,
      phaseName: documentPhase.name,
      phaseStartDate: documentPhase.start_date ? new Date(documentPhase.start_date) : undefined,
      phaseEndDate: documentPhase.end_date ? new Date(documentPhase.end_date) : undefined,
      hasTimeline
    });
  }, [phases, documentPhaseId, isLoading]);

  

  return phaseTimeline;
};
