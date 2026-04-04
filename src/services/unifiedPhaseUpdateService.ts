
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PhaseUpdateResult {
  success: boolean;
  message: string;
  productId?: string;
  newPhaseId?: string;
  phaseName?: string;
  error?: string;
}

export class UnifiedPhaseUpdateService {
  static async moveProductToPhase(
    productId: string,
    newPhaseId: string,
    companyId: string
  ): Promise<PhaseUpdateResult> {
    try {
      console.log(`[UnifiedPhaseUpdateService] Moving product ${productId} to phase ${newPhaseId}`);

      // Get the target phase details from company_phases
      const { data: targetPhase, error: phaseError } = await supabase
        .from('company_phases')
        .select('id, name')
        .eq('id', newPhaseId)
        .single();

      if (phaseError || !targetPhase) {
        throw new Error(`Target phase not found: ${phaseError?.message || 'Phase does not exist'}`);
      }

      // Clear current phase flag for this product (set all to false first)
      const { error: clearError } = await supabase
        .from('lifecycle_phases')
        .update({ is_current_phase: false })
        .eq('product_id', productId);

      if (clearError) {
        console.error('[UnifiedPhaseUpdateService] Error clearing current phase:', clearError);
        throw clearError;
      }

      // Use upsert to handle the new constraint properly
      // This will either insert a new record or update an existing one
      const { error: upsertError } = await supabase
        .from('lifecycle_phases')
        .upsert({
          product_id: productId,
          phase_id: newPhaseId, // Use actual active phase ID for foreign key constraint
          name: targetPhase.name,
          is_current_phase: true,
          status: 'Not Started'
        }, {
          onConflict: 'product_id,phase_id',
          ignoreDuplicates: false
        });

      if (upsertError) {
        console.error('[UnifiedPhaseUpdateService] Error upserting lifecycle phase:', upsertError);
        throw upsertError;
      }

      // Update the product's current_lifecycle_phase field
      const { error: productUpdateError } = await supabase
        .from('products')
        .update({ current_lifecycle_phase: targetPhase.name })
        .eq('id', productId);

      if (productUpdateError) {
        console.warn('[UnifiedPhaseUpdateService] Failed to update product phase field:', productUpdateError);
        // Don't fail the entire operation for this
      }

      console.log(`[UnifiedPhaseUpdateService] Successfully moved product to phase: ${targetPhase.name}`);

      return {
        success: true,
        message: 'Product phase updated successfully',
        productId,
        newPhaseId,
        phaseName: targetPhase.name
      };
    } catch (error) {
      console.error('[UnifiedPhaseUpdateService] Error moving product:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  static async repairProductPhaseMapping(productId: string, companyId: string): Promise<PhaseUpdateResult> {
    try {
      console.log(`[UnifiedPhaseUpdateService] Repairing product ${productId} phase mapping`);

      // Get first available phase for this company
      const { data: phases, error: phaseError } = await supabase
        .from('company_chosen_phases')
        .select(`
          company_phases!inner(id, name)
        `)
        .eq('company_id', companyId)
        .order('position')
        .limit(1);

      if (phaseError || !phases || phases.length === 0) {
        throw new Error('No phases available for this company');
      }

      const firstPhase = phases[0].company_phases;

      // Clear current phase flag for this product
      await supabase
        .from('lifecycle_phases')
        .update({ is_current_phase: false })
        .eq('product_id', productId);

      // Create or update lifecycle phase using upsert
      const { error: upsertError } = await supabase
        .from('lifecycle_phases')
        .upsert({
          product_id: productId,
          phase_id: firstPhase.id,
          name: firstPhase.name,
          is_current_phase: true,
          status: 'Not Started'
        }, {
          onConflict: 'product_id,phase_id',
          ignoreDuplicates: false
        });

      if (upsertError) throw upsertError;

      return {
        success: true,
        message: `Product assigned to ${firstPhase.name}`,
        productId,
        newPhaseId: firstPhase.id
      };
    } catch (error) {
      console.error('[UnifiedPhaseUpdateService] Error repairing product:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  static async updateProductPhase(
    productId: string,
    phaseId: string,
    companyId: string
  ): Promise<PhaseUpdateResult> {
    try {
      console.log(`[UnifiedPhaseUpdateService] Updating product ${productId} to phase ${phaseId}`);

      // Get phase name for response
      const { data: phaseData, error: phaseError } = await supabase
        .from('company_phases')
        .select('name')
        .eq('id', phaseId)
        .single();

      if (phaseError) {
        console.error('Error fetching phase name:', phaseError);
      }

      // Clear current phase flag for this product
      const { error: clearError } = await supabase
        .from('lifecycle_phases')
        .update({ is_current_phase: false })
        .eq('product_id', productId);

      if (clearError) throw clearError;

      // Set new current phase using phase_id
      const { error: setError } = await supabase
        .from('lifecycle_phases')
        .update({ is_current_phase: true })
        .eq('product_id', productId)
        .eq('phase_id', phaseId);

      if (setError) throw setError;

      return {
        success: true,
        message: 'Product phase updated successfully',
        productId,
        newPhaseId: phaseId,
        phaseName: phaseData?.name || 'Unknown Phase'
      };
    } catch (error) {
      console.error('[UnifiedPhaseUpdateService] Error updating product phase:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Export functions for backward compatibility
export async function moveProductToPhase(productId: string, newPhaseId: string, companyId: string): Promise<PhaseUpdateResult> {
  return UnifiedPhaseUpdateService.moveProductToPhase(productId, newPhaseId, companyId);
}

export async function repairProductPhaseMapping(productId: string, companyId: string): Promise<PhaseUpdateResult> {
  return UnifiedPhaseUpdateService.repairProductPhaseMapping(productId, companyId);
}
