
import { supabase } from '@/integrations/supabase/client';
import { DefaultPhaseDatingService } from './defaultPhaseDatingService';
import { toast } from 'sonner';

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  errors: string[];
  defaultDatesApplied?: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  issues: string[];
}

export class EnhancedPhaseSyncService {
  /**
   * Synchronize product lifecycle phases with company chosen phases
   * and apply default dates if phases are newly created
   */
  static async syncProductPhases(productId: string, companyId: string, options?: { skipDefaultDates?: boolean }): Promise<SyncResult> {
    try {
      
      // Check if product already has phases
      const { data: existingPhases } = await supabase
        .from('lifecycle_phases')
        .select('id, category_id, sub_section_id')
        .eq('product_id', productId)
        .limit(1);

      const isFirstTimeSync = !existingPhases || existingPhases.length === 0;
 
      let syncedCount = 0;
      let syncError = null;

      try {
        // Manual sync: Get company chosen phases and create lifecycle phases
        const { data: chosenPhases, error: chosenError } = await supabase
          .from('company_chosen_phases')
          .select(`
            phase_id,
            position,
            company_phases!inner(id, name, description, category_id, sub_section_id)
          `)
          .eq('company_id', companyId);

        if (chosenError) {
          syncError = chosenError;
        } else if (chosenPhases) {
          // Create or update lifecycle phases for each chosen phase
          for (const chosenPhase of chosenPhases) {
            const phaseData = chosenPhase.company_phases;
            if (Array.isArray(phaseData)) continue; // Skip invalid data

            // Check if lifecycle phase already exists to preserve status
            const { data: existingPhase } = await supabase
              .from('lifecycle_phases')
              .select('status')
              .eq('product_id', productId)
              .eq('phase_id', chosenPhase.phase_id)
              .single();

            const typedPhaseData = phaseData as { name: string; description?: string; category_id?: string; sub_section_id?: string | null; duration_days?: number };
            const upsertData: any = {
              product_id: productId,
              phase_id: chosenPhase.phase_id,
              name: typedPhaseData.name,
              description: typedPhaseData.description,
              position: chosenPhase.position,
              sub_section_id: typedPhaseData.sub_section_id || null
            };
            // Only set category_id if it exists — avoid setting null which creates "Uncategorized" in Gantt
            if (typedPhaseData.category_id) {
              upsertData.category_id = typedPhaseData.category_id;
            }
            
            // Only set status for new phases, preserve existing status
            if (!existingPhase) {
              upsertData.status = 'not_started';
            }
            
            const { error: upsertError } = await supabase
              .from('lifecycle_phases')
              .upsert(upsertData, {
                onConflict: 'product_id,phase_id'
              });
              
            if (!upsertError) {
              syncedCount++;
            }
          }
        }
      } catch (err) {
        console.error('Manual sync failed:', err);
        syncError = { message: `Manual sync failed: ${err}` };
      }

      if (syncError) {
        console.error('Error syncing product phases:', syncError);
        return { success: false, syncedCount: 0, errors: [syncError.message] };
      }

      let defaultDatesApplied = false;

      // If this is the first time sync or if we have phases without dates, apply default timeline
      if (isFirstTimeSync && syncedCount > 0 && !options?.skipDefaultDates) {
        console.log(`[EnhancedPhaseSyncService] First time sync detected, applying default timeline`);
        const timelineResult = await DefaultPhaseDatingService.initializeDefaultTimeline(productId);
        
        if (timelineResult.success) {
          defaultDatesApplied = true;
          console.log(`[EnhancedPhaseSyncService] Applied default dates to ${timelineResult.updatedCount} phases`);
        } else {
          console.warn(`[EnhancedPhaseSyncService] Failed to apply default timeline: ${timelineResult.error}`);
        }
      }

      console.log(`[EnhancedPhaseSyncService] Sync completed. Synced: ${syncedCount} phases, Default dates applied: ${defaultDatesApplied}`);
      
      return {
        success: true,
        syncedCount: syncedCount || 0,
        errors: [],
        defaultDatesApplied
      };
    } catch (error) {
      console.error('[EnhancedPhaseSyncService] Sync failed:', error);
      return {
        success: false,
        syncedCount: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Validate product phases for consistency
   */
  static async validateProductPhases(productId: string): Promise<ValidationResult> {
    try {
      const issues: string[] = [];

      // Check for phases without dates
      const { data: unscheduledPhases } = await supabase
        .from('lifecycle_phases')
        .select('id, name, category_id, sub_section_id')
        .eq('product_id', productId)
        .or('start_date.is.null,end_date.is.null');

      if (unscheduledPhases && unscheduledPhases.length > 0) {
        issues.push(`${unscheduledPhases.length} phases without scheduled dates`);
      }

      // Check for overlapping phases
      const { data: phases } = await supabase
        .from('lifecycle_phases')
        .select('id, name, start_date, end_date, category_id, sub_section_id')
        .eq('product_id', productId)
        .not('start_date', 'is', null)
        .not('end_date', 'is', null)
        .order('start_date');

      if (phases && phases.length > 1) {
        for (let i = 0; i < phases.length - 1; i++) {
          const current = phases[i];
          const next = phases[i + 1];
          
          if (current.end_date && next.start_date && new Date(current.end_date) >= new Date(next.start_date)) {
            issues.push(`Phase "${current.name}" overlaps with "${next.name}"`);
          }
        }
      }

      return {
        isValid: issues.length === 0,
        issues
      };
    } catch (error) {
      console.error('[EnhancedPhaseSyncService] Validation error:', error);
      return {
        isValid: false,
        issues: [`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  /**
   * Emergency recovery for corrupted phase data
   */
  static async emergencyPhaseRecovery(productId: string, companyId: string): Promise<SyncResult> {
    try {
      console.log(`[EnhancedPhaseSyncService] Starting emergency recovery for product ${productId}`);
      
      // Delete all existing lifecycle phases for the product
      const { error: deleteError } = await supabase
        .from('lifecycle_phases')
        .delete()
        .eq('product_id', productId);

      if (deleteError) {
        throw deleteError;
      }

      // Re-sync phases
      const syncResult = await this.syncProductPhases(productId, companyId);
      
      if (syncResult.success) {
        console.log(`[EnhancedPhaseSyncService] Emergency recovery completed successfully`);
      }

      return syncResult;
    } catch (error) {
      console.error('[EnhancedPhaseSyncService] Emergency recovery failed:', error);
      return {
        success: false,
        syncedCount: 0,
        errors: [`Recovery failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }
}
