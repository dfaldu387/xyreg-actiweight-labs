
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PhaseRepairResult {
  success: boolean;
  repairedProducts: number;
  errors: string[];
  details?: any;
}

export class EnhancedPhaseRepairService {
  /**
   * Repair all products for a company by assigning them to the first active phase
   */
  static async repairAllProductPhases(companyId: string): Promise<PhaseRepairResult> {
    try {
      console.log(`[EnhancedPhaseRepairService] Starting repair for company: ${companyId}`);
      
      let repairedProducts = 0;
      const errors: string[] = [];
      
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
        console.error('[EnhancedPhaseRepairService] No active phases found:', phaseError);
        return {
          success: false,
          repairedProducts: 0,
          errors: ['No active phases configured for this company. Please set up phases in company settings.']
        };
      }

      const targetPhase = firstActivePhase.company_phases;
      console.log(`[EnhancedPhaseRepairService] Using target phase: ${targetPhase.name} (${targetPhase.id})`);

      // Step 2: Get all products that need repair (no current phase or invalid phase)
      const { data: productsToRepair, error: productsError } = await supabase
        .from('products')
        .select('id, name, current_lifecycle_phase')
        .eq('company_id', companyId)
        .eq('is_archived', false);

      if (productsError) {
        console.error('[EnhancedPhaseRepairService] Error fetching products:', productsError);
        return {
          success: false,
          repairedProducts: 0,
          errors: [`Failed to fetch products: ${productsError.message}`]
        };
      }

      if (!productsToRepair || productsToRepair.length === 0) {
        console.log('[EnhancedPhaseRepairService] No products found to repair');
        return {
          success: true,
          repairedProducts: 0,
          errors: []
        };
      }

      console.log(`[EnhancedPhaseRepairService] Found ${productsToRepair.length} products to repair`);

      // Step 3: Repair each product
      for (const product of productsToRepair) {
        try {
          console.log(`[EnhancedPhaseRepairService] Repairing product: ${product.name}`);

          // Clear any existing current phase flags for this product
          const { error: clearError } = await supabase
            .from('lifecycle_phases')
            .update({ is_current_phase: false })
            .eq('product_id', product.id);

          if (clearError) {
            console.error(`[EnhancedPhaseRepairService] Error clearing phases for ${product.name}:`, clearError);
            errors.push(`Failed to clear phases for ${product.name}: ${clearError.message}`);
            continue;
          }

          // Check if a lifecycle phase already exists for this product and target phase
          const { data: existingPhase, error: checkError } = await supabase
            .from('lifecycle_phases')
            .select('id')
            .eq('product_id', product.id)
            .eq('phase_id', targetPhase.id)
            .single();

          if (checkError && checkError.code !== 'PGRST116') {
            console.error(`[EnhancedPhaseRepairService] Error checking existing phase for ${product.name}:`, checkError);
            errors.push(`Failed to check existing phase for ${product.name}: ${checkError.message}`);
            continue;
          }

          if (existingPhase) {
          // Update existing lifecycle phase
          const { error: updateError } = await supabase
            .from('lifecycle_phases')
            .update({
              is_current_phase: true,
              name: targetPhase.name,
              status: 'Not Started'
            })
            .eq('id', existingPhase.id);

            if (updateError) {
              console.error(`[EnhancedPhaseRepairService] Error updating lifecycle phase for ${product.name}:`, updateError);
              errors.push(`Failed to update lifecycle phase for ${product.name}: ${updateError.message}`);
              continue;
            }
          } else {
          // Create new lifecycle phase
          const { error: insertError } = await supabase
            .from('lifecycle_phases')
            .insert({
              product_id: product.id,
              phase_id: targetPhase.id,
              name: targetPhase.name,
              is_current_phase: true,
              status: 'Not Started'
            });

            if (insertError) {
              console.error(`[EnhancedPhaseRepairService] Error creating lifecycle phase for ${product.name}:`, insertError);
              errors.push(`Failed to create lifecycle phase for ${product.name}: ${insertError.message}`);
              continue;
            }
          }

          // Update the product's current_lifecycle_phase field
          const { error: productUpdateError } = await supabase
            .from('products')
            .update({ current_lifecycle_phase: targetPhase.name })
            .eq('id', product.id);

          if (productUpdateError) {
            console.warn(`[EnhancedPhaseRepairService] Failed to update product phase field for ${product.name}:`, productUpdateError);
            // Don't fail the entire operation for this
          }

          repairedProducts++;
          console.log(`[EnhancedPhaseRepairService] Successfully repaired product: ${product.name}`);

        } catch (error) {
          console.error(`[EnhancedPhaseRepairService] Unexpected error repairing ${product.name}:`, error);
          errors.push(`Unexpected error repairing ${product.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      const success = errors.length === 0 || repairedProducts > 0;
      console.log(`[EnhancedPhaseRepairService] Repair completed. Success: ${success}, Repaired: ${repairedProducts}, Errors: ${errors.length}`);

      return {
        success,
        repairedProducts,
        errors,
        details: {
          totalProducts: productsToRepair.length,
          targetPhase: targetPhase.name,
          companyId
        }
      };

    } catch (error) {
      console.error('[EnhancedPhaseRepairService] Unexpected repair error:', error);
      return {
        success: false,
        repairedProducts: 0,
        errors: [`Unexpected repair error: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  /**
   * Repair a single product by ID
   */
  static async repairSingleProductById(productId: string, companyId: string): Promise<PhaseRepairResult> {
    try {
      console.log(`[EnhancedPhaseRepairService] Starting single product repair: ${productId}`);
      
      // Get the first active phase for this company
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
        return {
          success: false,
          repairedProducts: 0,
          errors: ['No active phases configured for this company']
        };
      }

      const targetPhase = firstActivePhase.company_phases;

      // Get the product
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id, name')
        .eq('id', productId)
        .single();

      if (productError || !product) {
        return {
          success: false,
          repairedProducts: 0,
          errors: ['Product not found']
        };
      }

      // Clear existing current phase flags
      await supabase
        .from('lifecycle_phases')
        .update({ is_current_phase: false })
        .eq('product_id', productId);

      // Create or update lifecycle phase
      const { error: upsertError } = await supabase
        .from('lifecycle_phases')
        .upsert({
          product_id: productId,
          phase_id: targetPhase.id,
          name: targetPhase.name,
          is_current_phase: true,
          status: 'Not Started'
        }, {
          onConflict: 'product_id,phase_id'
        });

      if (upsertError) {
        return {
          success: false,
          repairedProducts: 0,
          errors: [`Failed to repair product: ${upsertError.message}`]
        };
      }

      // Update product's current phase field
      await supabase
        .from('products')
        .update({ current_lifecycle_phase: targetPhase.name })
        .eq('id', productId);

      return {
        success: true,
        repairedProducts: 1,
        errors: []
      };

    } catch (error) {
      return {
        success: false,
        repairedProducts: 0,
        errors: [`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }
}
