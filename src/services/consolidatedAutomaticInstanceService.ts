
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cleanupProductData } from "@/utils/consolidatedPhaseUtils";

/**
 * Consolidated Automatic Instance Service
 * Replaces the old AutomaticInstanceService with better error handling and cleanup
 */
export class ConsolidatedAutomaticInstanceService {
  constructor(
    private productId: string,
    private companyId: string
  ) {}

  async ensureInstancesForCurrentPhase(): Promise<{
    created: number;
    existing: number;
    errors: string[];
  }> {
    try {
      console.log(`[ConsolidatedAutoInstance] Ensuring instances for product ${this.productId}`);

      // First, cleanup any existing data issues
      await cleanupProductData(this.productId);

      // Get the current phase for this product
      const { data: lifecyclePhase, error: phaseError } = await supabase
        .from('lifecycle_phases')
        .select('phase_id, name')
        .eq('product_id', this.productId)
        .eq('is_current_phase', true)
        .maybeSingle();

      if (phaseError) {
        console.error('[ConsolidatedAutoInstance] Error fetching current phase:', phaseError);
        return { created: 0, existing: 0, errors: [phaseError.message] };
      }

      if (!lifecyclePhase) {
        console.warn('[ConsolidatedAutoInstance] No current phase found for product');
        return { created: 0, existing: 0, errors: ['No current phase assigned to product'] };
      }

      // Create instances using the consolidated document creation function
      const { data: result, error: createError } = await supabase.rpc(
        'create_product_document_instances',
        {
          target_product_id: this.productId,
          target_phase_id: lifecyclePhase.phase_id
        }
      );

      if (createError) {
        console.error('[ConsolidatedAutoInstance] Error creating instances:', createError);
        return { created: 0, existing: 0, errors: [createError.message] };
      }

      const created = result || 0;
      console.log(`[ConsolidatedAutoInstance] Created ${created} new document instances`);

      if (created > 0) {
        toast.success(`Created ${created} document instances for current phase`);
      }

      return { created, existing: 0, errors: [] };

    } catch (error) {
      console.error('[ConsolidatedAutoInstance] Unexpected error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { created: 0, existing: 0, errors: [errorMessage] };
    }
  }

  async syncAllCompanyTemplates(options?: { skipCleanup?: boolean }): Promise<{
    created: number;
    skipped: number;
    errors: string[];
  }> {
    try {
      console.log(`[ConsolidatedAutoInstance] Syncing all company templates for product ${this.productId}`);

      // First ensure product data is clean (unless skipCleanup is true - used during new product creation)
      if (!options?.skipCleanup) {
        await cleanupProductData(this.productId);
      } else {
        console.log(`[ConsolidatedAutoInstance] Skipping cleanup for new product`);
      }

      // Get all phases for the company
      const { data: companyPhases, error: phasesError } = await supabase
        .from('company_chosen_phases')
        .select('phase_id')
        .eq('company_id', this.companyId)
        .order('position');

      if (phasesError) {
        console.error('[ConsolidatedAutoInstance] Error fetching company phases:', phasesError);
        return { created: 0, skipped: 0, errors: [phasesError.message] };
      }

      let totalCreated = 0;
      const errors: string[] = [];

      // Create instances for each company phase
      for (const phase of companyPhases || []) {
        try {
          const { data: created, error } = await supabase.rpc(
            'create_product_document_instances',
            {
              target_product_id: this.productId,
              target_phase_id: phase.phase_id
            }
          );

          if (error) {
            errors.push(`Phase ${phase.phase_id}: ${error.message}`);
          } else {
            totalCreated += (created || 0);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Phase ${phase.phase_id}: ${errorMessage}`);
        }
      }

      console.log(`[ConsolidatedAutoInstance] Sync complete. Created ${totalCreated} instances`);

      if (totalCreated > 0) {
        toast.success(`Synced ${totalCreated} document instances across all phases`);
      }

      if (errors.length > 0) {
        toast.warning(`Sync completed with ${errors.length} warnings`);
      }

      return { created: totalCreated, skipped: 0, errors };

    } catch (error) {
      console.error('[ConsolidatedAutoInstance] Unexpected error during sync:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { created: 0, skipped: 0, errors: [errorMessage] };
    }
  }
}
