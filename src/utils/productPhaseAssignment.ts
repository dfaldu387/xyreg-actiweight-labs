
import { supabase } from '@/integrations/supabase/client';

export interface PhaseAssignmentResult {
  success: boolean;
  error?: string;
  phaseAssigned?: string;
}

/**
 * Automatically assigns a legacy product to the Post-Market Surveillance phase (position 11)
 * Legacy products should be in post-market phase, not development phases
 */
export async function assignProductToPostMarketPhase(
  productId: string, 
  companyId: string
): Promise<PhaseAssignmentResult> {
  try {
    console.log(`[ProductPhaseAssignment] Assigning legacy product ${productId} to Post-Market Surveillance phase`);

    // Step 1: Get the Post-Market Surveillance phase (position 11) for this company
    const { data: postMarketPhase, error: phaseError } = await supabase
      .from('company_chosen_phases')
      .select(`
        position,
        company_phases!inner(id, name)
      `)
      .eq('company_id', companyId)
      .eq('position', 11)
      .single();

    if (phaseError || !postMarketPhase) {
      console.warn(`[ProductPhaseAssignment] No Post-Market Surveillance phase found for company ${companyId}, falling back to first phase`);
      // Fallback to first active phase if Post-Market phase not found
      return assignProductToFirstActivePhase(productId, companyId);
    }

    const targetPhase = postMarketPhase.company_phases;

    // Step 2: Create lifecycle_phases record
    const { error: insertError } = await supabase
      .from('lifecycle_phases')
      .insert({
        product_id: productId,
        phase_id: targetPhase.id,
        name: targetPhase.name,
        is_current_phase: true,
        status: 'Not Started'
      });

    if (insertError) {
      console.error(`[ProductPhaseAssignment] Error creating lifecycle phase:`, insertError);
      return {
        success: false,
        error: `Failed to assign phase: ${insertError.message}`
      };
    }

    // Step 3: Update the product's current_lifecycle_phase field
    const { error: productUpdateError } = await supabase
      .from('products')
      .update({ current_lifecycle_phase: targetPhase.name })
      .eq('id', productId);

    if (productUpdateError) {
      console.warn(`[ProductPhaseAssignment] Failed to update product phase field:`, productUpdateError);
      // Don't fail the entire operation for this
    }

    console.log(`[ProductPhaseAssignment] Successfully assigned legacy product to "${targetPhase.name}"`);
    
    return {
      success: true,
      phaseAssigned: targetPhase.name
    };
  } catch (error) {
    console.error(`[ProductPhaseAssignment] Unexpected error:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during phase assignment'
    };
  }
}

/**
 * Automatically assigns a product to the first active phase for its company
 * This prevents products from appearing as "unmapped"
 * @param specificPhaseId - Optional specific phase ID to assign to (overrides first active phase)
 */
export async function assignProductToFirstActivePhase(
  productId: string,
  companyId: string,
  specificPhaseId?: string
): Promise<PhaseAssignmentResult> {
  try {
    // Check if lifecycle phases already exist for this product
    const { data: existingPhases, error: existingError } = await supabase
      .from('lifecycle_phases')
      .select('id, name, phase_id, is_current_phase')
      .eq('product_id', productId);

    if (existingPhases && existingPhases.length > 0) {
      // Phases already exist (likely from phase sync), just update the current phase marker
      // Find the first phase (position 0) and mark it as current
      const { data: firstPhase } = await supabase
        .from('lifecycle_phases')
        .select('id, name, phase_id')
        .eq('product_id', productId)
        .order('position', { ascending: true })
        .limit(1)
        .single();

      if (firstPhase) {
        // Update this phase to be current
        await supabase
          .from('lifecycle_phases')
          .update({ is_current_phase: true, status: 'in_progress' })
          .eq('id', firstPhase.id);

        // Update product's current_lifecycle_phase
        await supabase
          .from('products')
          .update({ current_lifecycle_phase: firstPhase.name })
          .eq('id', productId);

        return {
          success: true,
          phaseAssigned: firstPhase.name
        };
      }
    }

    // No existing phases, create one

    let targetPhase;

    if (specificPhaseId) {
      console.log(`[ProductPhaseAssignment] Assigning product ${productId} to specific phase ${specificPhaseId}`);

      // Get the specific phase details
      const { data: specificPhase, error: specificPhaseError } = await supabase
        .from('company_phases')
        .select('id, name')
        .eq('id', specificPhaseId)
        .eq('company_id', companyId)
        .single();

      if (specificPhaseError || !specificPhase) {
        console.warn(`[ProductPhaseAssignment] Specific phase ${specificPhaseId} not found, falling back to first active phase`);
        // Fall back to first active phase logic below
      } else {
        targetPhase = specificPhase;
      }
    }

    if (!targetPhase) {
      console.log(`[ProductPhaseAssignment] Assigning product ${productId} to first active phase`);

      // Step 1: Get the first active phase for this company
      const { data: firstActivePhase, error: phaseError } = await supabase
        .from('company_chosen_phases')
        .select(`
          position,
          company_phases!inner(id, name)
        `)
        .eq('company_id', companyId)
        .order('position')
        .limit(1)
        .single();

      if (phaseError || !firstActivePhase) {
        console.warn(`[ProductPhaseAssignment] No active phases found for company ${companyId}`);
        return {
          success: false,
          error: 'No active phases configured for this company'
        };
      }

      targetPhase = firstActivePhase.company_phases;
    }

    // Step 2: Create lifecycle_phases record
    const { error: insertError } = await supabase
      .from('lifecycle_phases')
      .insert({
        product_id: productId,
        phase_id: targetPhase.id, // Direct reference to company_phases
        name: targetPhase.name,
        is_current_phase: true,
        status: 'Not Started'
      });

    if (insertError) {
      console.error(`[ProductPhaseAssignment] Error creating lifecycle phase:`, insertError);
      return {
        success: false,
        error: `Failed to assign phase: ${insertError.message}`
      };
    }

    // Step 3: Update the product's current_lifecycle_phase field
    const { error: productUpdateError } = await supabase
      .from('products')
      .update({ current_lifecycle_phase: targetPhase.name })
      .eq('id', productId);

    if (productUpdateError) {
      console.warn(`[ProductPhaseAssignment] Failed to update product phase field:`, productUpdateError);
      // Don't fail the entire operation for this
    }

    return {
      success: true,
      phaseAssigned: targetPhase.name
    };
  } catch (error) {
    console.error(`[ProductPhaseAssignment] Unexpected error:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during phase assignment'
    };
  }
}
