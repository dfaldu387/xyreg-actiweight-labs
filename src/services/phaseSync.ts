import { supabase } from '@/integrations/supabase/client';

/**
 * Manual phase sync service to sync company phases to product lifecycle phases
 */
export async function syncProductPhases(productId: string, companyId: string) {
  try {
    console.log(`[syncProductPhases] Starting sync for product ${productId}`);
    
    // Get company chosen phases
    const { data: chosenPhases, error: chosenError } = await supabase
      .from('company_chosen_phases')
      .select(`
        phase_id,
        position,
        company_phases!inner(id, name, description, category_id, sub_section_id)
      `)
      .eq('company_id', companyId)
      .order('position');
      
    if (chosenError) {
      throw chosenError;
    }
    
    if (!chosenPhases || chosenPhases.length === 0) {
      console.log('[syncProductPhases] No company phases found');
      return { success: false, error: 'No company phases configured' };
    }
    
    console.log(`[syncProductPhases] Found ${chosenPhases.length} company phases`);
    
    // Delete existing lifecycle phases for this product
    const { error: deleteError } = await supabase
      .from('lifecycle_phases')
      .delete()
      .eq('product_id', productId);
      
    if (deleteError) {
      console.error('[syncProductPhases] Error deleting existing phases:', deleteError);
      throw deleteError;
    }
    
    // Create lifecycle phases from company chosen phases
    let syncedCount = 0;
    for (const chosenPhase of chosenPhases) {
      const phaseData = chosenPhase.company_phases;
      if (Array.isArray(phaseData)) continue; // Skip invalid data
      
      const typedPhaseData = phaseData as { name: string; description?: string; category_id?: string; sub_section_id?: string | null };
      const { error: insertError } = await supabase
        .from('lifecycle_phases')
        .insert({
          product_id: productId,
          phase_id: chosenPhase.phase_id,
          name: typedPhaseData.name,
          description: typedPhaseData.description,
          position: chosenPhase.position,
          status: chosenPhase.position === 0 ? 'in_progress' : 'not_started',
          is_current_phase: chosenPhase.position === 0,
          category_id: typedPhaseData.category_id,
          sub_section_id: typedPhaseData.sub_section_id || null
        });
        
      if (insertError) {
        console.error('[syncProductPhases] Error inserting phase:', insertError);
        throw insertError;
      }
      
      syncedCount++;
    }
    
    console.log(`[syncProductPhases] Successfully synced ${syncedCount} phases`);
    return { success: true, syncedCount };
    
  } catch (error) {
    console.error('[syncProductPhases] Error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}