
import { supabase } from "@/integrations/supabase/client";
import { getCompanyPhaseMappings, findPhaseByName, getFirstPhase } from "@/utils/phaseMapping";

export interface PhaseRepairResult {
  success: boolean;
  repairedCount: number;
  errors: string[];
  details?: string[];
}

export interface PhaseIntegrityIssue {
  type: 'missing_phase' | 'invalid_phase' | 'orphaned_lifecycle_phase' | 'phase_id_mismatch';
  count: number;
  details: any[];
}

export async function validateCompanyPhaseIntegrity(companyId: string): Promise<{
  hasIssues: boolean;
  issues: PhaseIntegrityIssue[];
}> {
  try {
    // console.log(`[PhaseRepair] Starting comprehensive validation for company: ${companyId}`);
    const issues: PhaseIntegrityIssue[] = [];

    // Get company's valid phases using the new mapping utility
    const validPhases = await getCompanyPhaseMappings(companyId);
    const validPhaseIds = new Set(validPhases.map(p => p.id));
    const validPhaseNames = new Set(validPhases.map(p => p.name));

    // console.log(`[PhaseRepair] Company has ${validPhases.length} valid phases:`, validPhases.map(p => ({ id: p.id, name: p.name })));

    if (validPhases.length === 0) {
      console.warn(`[PhaseRepair] No valid phases found for company ${companyId}`);
      return { hasIssues: false, issues: [] };
    }

    // Check for products with missing phases (null or empty current_lifecycle_phase)
    const { data: productsWithoutPhase, error: missingError } = await supabase
      .from('products')
      .select('id, name, current_lifecycle_phase')
      .eq('company_id', companyId)
      .eq('is_archived', false)
      .or('current_lifecycle_phase.is.null,current_lifecycle_phase.eq.');

    if (!missingError && productsWithoutPhase && productsWithoutPhase.length > 0) {
      // console.log(`[PhaseRepair] Found ${productsWithoutPhase.length} products without phases:`, productsWithoutPhase.map(p => ({ name: p.name, phase: p.current_lifecycle_phase })));
      issues.push({
        type: 'missing_phase',
        count: productsWithoutPhase.length,
        details: productsWithoutPhase
      });
    }

    // Check for products with invalid phase names
    const { data: allProducts, error: allProductsError } = await supabase
      .from('products')
      .select('id, name, current_lifecycle_phase')
      .eq('company_id', companyId)
      .eq('is_archived', false)
      .not('current_lifecycle_phase', 'is', null)
      .neq('current_lifecycle_phase', '');

    if (!allProductsError && allProducts) {
      const invalidProducts = allProducts.filter(
        p => p.current_lifecycle_phase && !validPhaseNames.has(p.current_lifecycle_phase)
      );

      if (invalidProducts.length > 0) {
        // console.log(`[PhaseRepair] Found ${invalidProducts.length} products with invalid phases:`, invalidProducts.map(p => ({ name: p.name, phase: p.current_lifecycle_phase })));
        issues.push({
          type: 'invalid_phase',
          count: invalidProducts.length,
          details: invalidProducts
        });
      }
    }

    // Check for orphaned lifecycle_phases entries
    const { data: lifecyclePhases, error: lifecycleError } = await supabase
      .from('lifecycle_phases')
      .select(`
        id,
        product_id,
        phase_id,
        name,
        is_current_phase,
        products!inner(id, name, company_id)
      `)
      .eq('products.company_id', companyId)
      .eq('products.is_archived', false);

    if (!lifecycleError && lifecyclePhases) {
      // Find orphaned lifecycle phases (pointing to non-existent phases)
      const orphaned = lifecyclePhases.filter(lp => !validPhaseIds.has(lp.phase_id));
      
      if (orphaned.length > 0) {
        // console.log(`[PhaseRepair] Found ${orphaned.length} orphaned lifecycle phases:`, orphaned.map(lp => ({ product: lp.products?.name, phase_id: lp.phase_id, phase_name: lp.name })));
        issues.push({
          type: 'orphaned_lifecycle_phase',
          count: orphaned.length,
          details: orphaned
        });
      }

      // Find current phase ID mismatches
      const currentPhases = lifecyclePhases.filter(lp => lp.is_current_phase);
      const phaseMismatches = currentPhases.filter(lp => !validPhaseIds.has(lp.phase_id));
      
      if (phaseMismatches.length > 0) {
        // console.log(`[PhaseRepair] Found ${phaseMismatches.length} current phase ID mismatches:`, phaseMismatches.map(lp => ({ product: lp.products?.name, invalid_phase_id: lp.phase_id, phase_name: lp.name })));
        issues.push({
          type: 'phase_id_mismatch',
          count: phaseMismatches.length,
          details: phaseMismatches
        });
      }
    }

    const totalIssues = issues.reduce((total, issue) => total + issue.count, 0);
    // console.log(`[PhaseRepair] Validation complete. Found ${issues.length} issue types with total count: ${totalIssues}`);

    return {
      hasIssues: issues.length > 0,
      issues: issues
    };
  } catch (error) {
    console.error("[PhaseRepair] Unexpected error during validation:", error);
    return { hasIssues: false, issues: [] };
  }
}

export async function repairCompanyPhases(companyId: string): Promise<PhaseRepairResult> {
  try {
    // console.log(`[PhaseRepair] Starting comprehensive repair for company: ${companyId}`);
    
    // First validate to see what needs repair
    const validation = await validateCompanyPhaseIntegrity(companyId);
    
    if (!validation.hasIssues) {
      // console.log("[PhaseRepair] No issues found to repair");
      return { 
        success: true, 
        repairedCount: 0, 
        errors: [], 
        details: ["No issues found - all phases are properly configured"] 
      };
    }

    let totalRepaired = 0;
    const errors: string[] = [];
    const details: string[] = [];

    // Get company phases using the mapping utility
    const companyPhases = await getCompanyPhaseMappings(companyId);
    const firstPhase = getFirstPhase(companyPhases);

    if (!firstPhase) {
      const error = 'No phases configured for this company. Please configure phases in Company Settings first.';
      console.error(`[PhaseRepair] ${error}`);
      return {
        success: false,
        repairedCount: 0,
        errors: [error]
      };
    }

    // console.log(`[PhaseRepair] Using first phase as fallback: ${firstPhase.name} (${firstPhase.id})`);

    // Repair missing phases (products without current_lifecycle_phase)
    const missingPhaseIssue = validation.issues.find(i => i.type === 'missing_phase');
    if (missingPhaseIssue) {
      // console.log(`[PhaseRepair] Repairing ${missingPhaseIssue.count} products with missing phases`);
      for (const product of missingPhaseIssue.details) {
        try {
          // Update product with first phase
          const { error: updateError } = await supabase
            .from('products')
            .update({ current_lifecycle_phase: firstPhase.name })
            .eq('id', product.id);

          if (updateError) {
            const errorMsg = `Failed to update product ${product.name}: ${updateError.message}`;
            console.error(`[PhaseRepair] ${errorMsg}`);
            errors.push(errorMsg);
            continue;
          }

          // Clear any existing current phase assignments first
          await supabase
            .from('lifecycle_phases')
            .update({ is_current_phase: false })
            .eq('product_id', product.id);

          // Create/update lifecycle_phases entry
          const { error: upsertError } = await supabase
            .from('lifecycle_phases')
            .upsert({
              product_id: product.id,
              phase_id: firstPhase.id,
              name: firstPhase.name,
              is_current_phase: true,
              status: 'In Progress',
              progress: 0
            }, {
              onConflict: 'product_id,phase_id'
            });

          if (upsertError) {
            const errorMsg = `Failed to create lifecycle phase for ${product.name}: ${upsertError.message}`;
            console.error(`[PhaseRepair] ${errorMsg}`);
            errors.push(errorMsg);
          } else {
            const successMsg = `Assigned "${product.name}" to ${firstPhase.name}`;
            // console.log(`[PhaseRepair] ${successMsg}`);
            details.push(successMsg);
            totalRepaired++;
          }
        } catch (error) {
          const errorMsg = `Unexpected error repairing ${product.name}: ${error}`;
          console.error(`[PhaseRepair] ${errorMsg}`);
          errors.push(errorMsg);
        }
      }
    }

    // Repair invalid phases (products with non-existent phase names)
    const invalidPhaseIssue = validation.issues.find(i => i.type === 'invalid_phase');
    if (invalidPhaseIssue) {
      // console.log(`[PhaseRepair] Repairing ${invalidPhaseIssue.count} products with invalid phases`);
      for (const product of invalidPhaseIssue.details) {
        try {
          // Try to find a matching phase first (fuzzy matching)
          const matchingPhase = findPhaseByName(companyPhases, product.current_lifecycle_phase);
          const targetPhase = matchingPhase || firstPhase;

          // Update product with corrected phase
          const { error: updateError } = await supabase
            .from('products')
            .update({ current_lifecycle_phase: targetPhase.name })
            .eq('id', product.id);

          if (updateError) {
            const errorMsg = `Failed to update product ${product.name}: ${updateError.message}`;
            console.error(`[PhaseRepair] ${errorMsg}`);
            errors.push(errorMsg);
            continue;
          }

          // Clear existing current phase assignments
          await supabase
            .from('lifecycle_phases')
            .update({ is_current_phase: false })
            .eq('product_id', product.id);

          // Create new lifecycle phase entry
          const { error: insertError } = await supabase
            .from('lifecycle_phases')
            .upsert({
              product_id: product.id,
              phase_id: targetPhase.id,
              name: targetPhase.name,
              is_current_phase: true,
              status: 'In Progress',
              progress: 0
            }, {
              onConflict: 'product_id,phase_id'
            });

          if (insertError) {
            const errorMsg = `Failed to create lifecycle phase for ${product.name}: ${insertError.message}`;
            console.error(`[PhaseRepair] ${errorMsg}`);
            errors.push(errorMsg);
          } else {
            const action = matchingPhase ? 'matched and corrected' : 'assigned to default';
            const successMsg = `Updated "${product.name}" from "${product.current_lifecycle_phase}" to "${targetPhase.name}" (${action})`;
            // console.log(`[PhaseRepair] ${successMsg}`);
            details.push(successMsg);
            totalRepaired++;
          }
        } catch (error) {
          const errorMsg = `Unexpected error repairing ${product.name}: ${error}`;
          console.error(`[PhaseRepair] ${errorMsg}`);
          errors.push(errorMsg);
        }
      }
    }

    // Repair phase ID mismatches (lifecycle_phases pointing to wrong phase IDs)
    const phaseMismatchIssue = validation.issues.find(i => i.type === 'phase_id_mismatch');
    if (phaseMismatchIssue) {
      // console.log(`[PhaseRepair] Repairing ${phaseMismatchIssue.count} products with phase ID mismatches`);
      for (const lifecyclePhase of phaseMismatchIssue.details) {
        try {
          // Try to find matching phase by name first
          const matchingPhase = findPhaseByName(companyPhases, lifecyclePhase.name);
          const targetPhase = matchingPhase || firstPhase;

          // Remove the current invalid lifecycle phase
          await supabase
            .from('lifecycle_phases')
            .delete()
            .eq('id', lifecyclePhase.id);

          // Clear any other current phase assignments for this product
          await supabase
            .from('lifecycle_phases')
            .update({ is_current_phase: false })
            .eq('product_id', lifecyclePhase.product_id);

          // Create a new lifecycle phase with the correct phase ID
          const { error: insertError } = await supabase
            .from('lifecycle_phases')
            .insert({
              product_id: lifecyclePhase.product_id,
              phase_id: targetPhase.id,
              name: targetPhase.name,
              is_current_phase: true,
              status: 'In Progress',
              progress: 0
            });

          if (insertError) {
            const errorMsg = `Failed to fix phase ID mismatch for product ${lifecyclePhase.products?.name}: ${insertError.message}`;
            console.error(`[PhaseRepair] ${errorMsg}`);
            errors.push(errorMsg);
          } else {
            // Also update the product's current_lifecycle_phase to ensure consistency
            await supabase
              .from('products')
              .update({ current_lifecycle_phase: targetPhase.name })
              .eq('id', lifecyclePhase.product_id);

            const successMsg = `Fixed phase ID mismatch for "${lifecyclePhase.products?.name}" (${lifecyclePhase.name} → ${targetPhase.name})`;
            // console.log(`[PhaseRepair] ${successMsg}`);
            details.push(successMsg);
            totalRepaired++;
          }
        } catch (error) {
          const errorMsg = `Unexpected error fixing phase ID mismatch for ${lifecyclePhase.products?.name}: ${error}`;
          console.error(`[PhaseRepair] ${errorMsg}`);
          errors.push(errorMsg);
        }
      }
    }

    // Remove orphaned lifecycle_phases entries (pointing to deleted phases)
    const orphanedIssue = validation.issues.find(i => i.type === 'orphaned_lifecycle_phase');
    if (orphanedIssue) {
      // console.log(`[PhaseRepair] Removing ${orphanedIssue.count} orphaned lifecycle phases`);
      const orphanedIds = orphanedIssue.details.map(d => d.id);
      const { error: deleteError } = await supabase
        .from('lifecycle_phases')
        .delete()
        .in('id', orphanedIds);

      if (deleteError) {
        const errorMsg = `Failed to remove orphaned lifecycle phases: ${deleteError.message}`;
        console.error(`[PhaseRepair] ${errorMsg}`);
        errors.push(errorMsg);
      } else {
        const successMsg = `Removed ${orphanedIds.length} orphaned lifecycle phase records`;
        // console.log(`[PhaseRepair] ${successMsg}`);
        details.push(successMsg);
        totalRepaired += orphanedIds.length;
      }
    }

    // console.log(`[PhaseRepair] Repair complete. Total repaired: ${totalRepaired}, Errors: ${errors.length}`);

    const finalResult = {
      success: errors.length === 0 || totalRepaired > 0,
      repairedCount: totalRepaired,
      errors: errors,
      details: details
    };

    if (totalRepaired > 0) {
      details.unshift(`Successfully repaired ${totalRepaired} items across ${validation.issues.length} issue types`);
    }

    return finalResult;
    
  } catch (error) {
    console.error("[PhaseRepair] Unexpected error during repair:", error);
    return { 
      success: false, 
      repairedCount: 0, 
      errors: [error instanceof Error ? error.message : 'Unknown error during repair operation'] 
    };
  }
}

export async function getUnmappedProductsCount(companyId: string): Promise<number> {
  try {
    const validation = await validateCompanyPhaseIntegrity(companyId);
    return validation.issues.reduce((total, issue) => total + issue.count, 0);
  } catch (error) {
    console.error("Error counting unmapped products:", error);
    return 0;
  }
}
