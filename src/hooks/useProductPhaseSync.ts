
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PhaseSyncResult {
  success: boolean;
  message: string;
  syncedCount: number;
}

export function useProductPhaseSync(productId: string, companyId: string) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<PhaseSyncResult | null>(null);

  const syncProductPhases = async (): Promise<PhaseSyncResult> => {
    if (!productId || !companyId) {
      return {
        success: false,
        message: 'Product ID and Company ID are required',
        syncedCount: 0
      };
    }

    setIsSyncing(true);
    try {
      // Get company active phases - FIXED: Use company_phases
      const { data: activePhases, error: phasesError } = await supabase
        .from('company_chosen_phases')
        .select(`
          position,
          company_phases!inner(id, name, description, company_id, category_id, sub_section_id)
        `)
        .eq('company_id', companyId)
        .order('position');

      if (phasesError) {
        throw phasesError;
      }

      if (!activePhases || activePhases.length === 0) {
        return {
          success: false,
          message: 'No active phases found for company',
          syncedCount: 0
        };
      }

      // Get existing lifecycle phases for product
      const { data: existingPhases } = await supabase
        .from('lifecycle_phases')
        .select('phase_id')
        .eq('product_id', productId);

      const existingPhaseIds = new Set(existingPhases?.map(ep => ep.phase_id) || []);

      // Create missing lifecycle phases
      const newPhases = activePhases
        .filter(ap => !existingPhaseIds.has(ap.company_phases.id))
        .map(ap => ({
          product_id: productId,
          phase_id: ap.company_phases.id,
          name: ap.company_phases.name,
          description: ap.company_phases.description,
          category_id: (ap.company_phases as any).category_id || null,
          sub_section_id: (ap.company_phases as any).sub_section_id || null,
          status: 'Not Started',
          progress: 0,
          is_current_phase: false
        }));

      if (newPhases.length > 0) {
        const { error: insertError } = await supabase
          .from('lifecycle_phases')
          .insert(newPhases);

        if (insertError) {
          throw insertError;
        }
      }

      const result = {
        success: true,
        message: `Synced ${newPhases.length} phases`,
        syncedCount: newPhases.length
      };

      setLastSyncResult(result);
      return result;

    } catch (error) {
      console.error('Error syncing product phases:', error);
      const result = {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to sync phases',
        syncedCount: 0
      };
      setLastSyncResult(result);
      return result;
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    isSyncing,
    lastSyncResult,
    syncProductPhases
  };
}
