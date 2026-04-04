
import { supabase } from "@/integrations/supabase/client";

export interface PhaseVerificationResult {
  productId: string;
  productName: string;
  companyName: string;
  currentPhase: string | null;
  lifecyclePhase: string | null;
  isConsistent: boolean;
  issues: string[];
}

export async function verifyProductPhaseConsistency(companyId?: string): Promise<PhaseVerificationResult[]> {
  try {
    console.log('[PhaseVerification] Starting verification process...');
    
    let query = supabase
      .from('products')
      .select(`
        id,
        name,
        current_lifecycle_phase,
        company_id,
        companies!inner(name),
        lifecycle_phases(
          id,
          is_current_phase,
          name
        )
      `)
      .eq('is_archived', false);
    
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    
    const { data: products, error } = await query;
    
    if (error) {
      console.error('[PhaseVerification] Error fetching products:', error);
      throw error;
    }
    
    const results: PhaseVerificationResult[] = [];
    
    for (const product of products || []) {
      // Find the current lifecycle phase from the array
      const currentLifecyclePhase = Array.isArray(product.lifecycle_phases) 
        ? product.lifecycle_phases.find(lp => lp.is_current_phase)
        : null;
      const lifecyclePhaseName = currentLifecyclePhase?.name || null;
      
      const issues: string[] = [];
      let isConsistent = true;
      
      // Check if there's a current phase
      if (!currentLifecyclePhase?.is_current_phase) {
        issues.push('No current lifecycle phase assigned');
        isConsistent = false;
      }
      
      // Check if phase names match
      if (product.current_lifecycle_phase !== lifecyclePhaseName) {
        issues.push(`Phase name mismatch: product="${product.current_lifecycle_phase}", lifecycle="${lifecyclePhaseName}"`);
        isConsistent = false;
      }
      
      // Check if product phase is null/empty
      if (!product.current_lifecycle_phase) {
        issues.push('Product current_lifecycle_phase is null or empty');
        isConsistent = false;
      }
      
      results.push({
        productId: product.id,
        productName: product.name,
        companyName: product.companies?.name || 'Unknown',
        currentPhase: product.current_lifecycle_phase,
        lifecyclePhase: lifecyclePhaseName,
        isConsistent,
        issues
      });
    }
    
    const inconsistentCount = results.filter(r => !r.isConsistent).length;
    console.log(`[PhaseVerification] Found ${inconsistentCount} inconsistent products out of ${results.length} total`);
    
    return results;
    
  } catch (error) {
    console.error('[PhaseVerification] Error in verification:', error);
    throw error;
  }
}

export async function repairPhaseInconsistencies(productIds?: string[]): Promise<{ 
  repaired: number; 
  failed: number; 
  results: Array<{ productId: string; success: boolean; error?: string }> 
}> {
  try {
    console.log('[PhaseVerification] Starting repair process...');
    
    // First, get the products to repair
    let query = supabase
      .from('products')
      .select(`
        id,
        name,
        current_lifecycle_phase,
        lifecycle_phases(
          id,
          is_current_phase,
          name
        )
      `)
      .eq('is_archived', false);
    
    if (productIds && productIds.length > 0) {
      query = query.in('id', productIds);
    }
    
    const { data: products, error } = await query;
    
    if (error) {
      console.error('[PhaseVerification] Error fetching products for repair:', error);
      throw error;
    }
    
    const results: Array<{ productId: string; success: boolean; error?: string }> = [];
    let repaired = 0;
    let failed = 0;
    
    for (const product of products || []) {
      try {
        // Find the current lifecycle phase from the array
        const currentLifecyclePhase = Array.isArray(product.lifecycle_phases) 
          ? product.lifecycle_phases.find(lp => lp.is_current_phase)
          : null;
        const lifecyclePhaseName = currentLifecyclePhase?.name || null;
        
        let needsRepair = false;
        
        // Determine the authoritative phase value
        let authoritativePhase = product.current_lifecycle_phase || lifecyclePhaseName;
        
        if (!currentLifecyclePhase?.is_current_phase) {
          needsRepair = true;
        }
        
        if (product.current_lifecycle_phase !== lifecyclePhaseName) {
          needsRepair = true;
        }
        
        if (needsRepair && authoritativePhase) {
          // Update lifecycle_phases table
          const { error: lifecycleError } = await supabase
            .from('lifecycle_phases')
            .update({
              name: authoritativePhase,
              is_current_phase: true
            })
            .eq('product_id', product.id);
          
          if (lifecycleError) throw lifecycleError;
          
          // Update products table
          const { error: productError } = await supabase
            .from('products')
            .update({
              current_lifecycle_phase: authoritativePhase
            })
            .eq('id', product.id);
          
          if (productError) throw productError;
          
          console.log(`[PhaseVerification] Repaired product ${product.name} with phase "${authoritativePhase}"`);
        }
        
        results.push({ productId: product.id, success: true });
        repaired++;
        
      } catch (error) {
        console.error(`[PhaseVerification] Failed to repair product ${product.id}:`, error);
        results.push({ 
          productId: product.id, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
        failed++;
      }
    }
    
    console.log(`[PhaseVerification] Repair complete. Repaired: ${repaired}, Failed: ${failed}`);
    
    return { repaired, failed, results };
    
  } catch (error) {
    console.error('[PhaseVerification] Error in repair process:', error);
    throw error;
  }
}
