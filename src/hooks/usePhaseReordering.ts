
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PhaseReorderResult {
  success: boolean;
  error?: string;
}

export function usePhaseReordering() {
  const [isReordering, setIsReordering] = useState(false);

  const reorderPhases = async (
    companyId: string,
    phaseIds: string[]
  ): Promise<PhaseReorderResult> => {
    if (isReordering) {
      return { success: false, error: 'Reordering already in progress' };
    }

    setIsReordering(true);
    
    try {
      console.log('[usePhaseReordering] Starting reorder for company:', companyId);
      console.log('[usePhaseReordering] Phase IDs in new order:', phaseIds);

      // Use the new safe reordering function
      const { data: success, error } = await supabase.rpc('safe_reorder_company_phases', {
        target_company_id: companyId,
        phase_ids: phaseIds
      });

      if (error) {
        console.error('[usePhaseReordering] Database error:', error);
        throw error;
      }

      if (!success) {
        throw new Error('Reordering function returned false');
      }

      console.log('[usePhaseReordering] Reorder completed successfully');
      return { success: true };

    } catch (error) {
      console.error('[usePhaseReordering] Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      return { 
        success: false, 
        error: `Failed to reorder phases: ${errorMessage}` 
      };
    } finally {
      setIsReordering(false);
    }
  };

  const movePhase = async (
    companyId: string,
    currentPhases: Array<{ id: string; position: number }>,
    fromIndex: number,
    toIndex: number
  ): Promise<PhaseReorderResult> => {
    if (toIndex < 0 || toIndex >= currentPhases.length) {
      return { success: false, error: 'Invalid move position' };
    }

    // Create new order by moving the phase
    const newOrder = [...currentPhases];
    const [movedPhase] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, movedPhase);
    
    const phaseIds = newOrder.map(phase => phase.id);
    return await reorderPhases(companyId, phaseIds);
  };

  return {
    isReordering,
    reorderPhases,
    movePhase
  };
}
