
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PhaseSyncResult {
  productId: string;
  productName: string;
  companyName: string;
  currentPhase: string | null;
  lifecyclePhase: string | null;
  wasRepaired: boolean;
  errorMessage?: string;
}

export async function syncProductPhasesToDatabase(productId?: string): Promise<PhaseSyncResult[]> {
  try {
    console.log('Starting phase sync operation...');
    
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
          phase_id,
          name,
          is_current_phase
        )
      `)
      .eq('is_archived', false);
    
    if (productId) {
      query = query.eq('id', productId);
    }
    
    const { data: products, error } = await query;
    
    if (error) {
      console.error('Error fetching products for sync:', error);
      throw error;
    }
    
    const results: PhaseSyncResult[] = [];
    
    for (const product of products || []) {
      // Find the current lifecycle phase from the array
      const currentLifecyclePhase = Array.isArray(product.lifecycle_phases) 
        ? product.lifecycle_phases.find(lp => lp.is_current_phase)
        : null;
      const lifecyclePhaseName = currentLifecyclePhase?.name || null;
      
      let wasRepaired = false;
      let errorMessage: string | undefined;
      
      // Check if sync is needed
      const needsSync = !currentLifecyclePhase?.is_current_phase || 
                      lifecyclePhaseName !== product.current_lifecycle_phase;
      
      if (needsSync) {
        try {
          // Try to repair the sync issue
          if (product.current_lifecycle_phase && !currentLifecyclePhase?.is_current_phase) {
            // Update lifecycle_phases to match product
            const { error: updateError } = await supabase
              .from('lifecycle_phases')
              .update({
                name: product.current_lifecycle_phase,
                is_current_phase: true
              })
              .eq('product_id', product.id)
              .eq('is_current_phase', false);
            
            if (updateError) throw updateError;
            wasRepaired = true;
          } else if (!product.current_lifecycle_phase && lifecyclePhaseName) {
            // Update product to match lifecycle_phases
            const { error: updateError } = await supabase
              .from('products')
              .update({
                current_lifecycle_phase: lifecyclePhaseName
              })
              .eq('id', product.id);
            
            if (updateError) throw updateError;
            wasRepaired = true;
          }
        } catch (repairError) {
          console.error(`Failed to repair product ${product.name}:`, repairError);
          errorMessage = repairError instanceof Error ? repairError.message : 'Unknown error';
        }
      }
      
      results.push({
        productId: product.id,
        productName: product.name,
        companyName: product.companies?.name || 'Unknown',
        currentPhase: product.current_lifecycle_phase,
        lifecyclePhase: lifecyclePhaseName,
        wasRepaired,
        errorMessage
      });
    }
    
    const repairedCount = results.filter(r => r.wasRepaired).length;
    const errorCount = results.filter(r => r.errorMessage).length;
    
    console.log(`Sync complete. Repaired: ${repairedCount}, Errors: ${errorCount}`);
    
    if (repairedCount > 0) {
      toast.success(`Successfully synced ${repairedCount} products`);
    }
    
    if (errorCount > 0) {
      toast.warning(`${errorCount} products could not be synced`);
    }
    
    return results;
  } catch (error) {
    console.error('Error in phase sync operation:', error);
    toast.error('Failed to sync product phases');
    throw error;
  }
}

export async function validatePhaseConsistency(productId?: string): Promise<PhaseSyncResult[]> {
  try {
    console.log('Validating phase consistency...');
    
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
          is_current_phase
        )
      `)
      .eq('is_archived', false);
    
    if (productId) {
      query = query.eq('id', productId);
    }
    
    const { data: products, error } = await query;
    
    if (error) {
      console.error('Error validating phase consistency:', error);
      throw error;
    }
    
    const results: PhaseSyncResult[] = [];
    
    for (const product of products || []) {
      // Find the current lifecycle phase from the array
      const currentLifecyclePhase = Array.isArray(product.lifecycle_phases) 
        ? product.lifecycle_phases.find(lp => lp.is_current_phase)
        : null;
      
      results.push({
        productId: product.id,
        productName: product.name,
        companyName: product.companies?.name || 'Unknown',
        currentPhase: product.current_lifecycle_phase,
        lifecyclePhase: currentLifecyclePhase?.is_current_phase ? 'Has current phase' : 'No current phase',
        wasRepaired: false
      });
    }
    
    return results;
  } catch (error) {
    console.error('Error validating phase consistency:', error);
    throw error;
  }
}
