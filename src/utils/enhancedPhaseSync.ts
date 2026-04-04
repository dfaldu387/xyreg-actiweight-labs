
import { supabase } from '@/integrations/supabase/client';

export interface PhaseSyncResult {
  synced: number;
  errors: string[];
}

export interface PhaseHealthReport {
  healthScore: number;
  mappedProducts: number;
  unmappedProducts: number;
  issues: string[];
  repaired?: number;
  errors?: string[];
  metrics?: HealthMetric[];
  overallHealth?: 'good' | 'warning' | 'error';
}

interface HealthMetric {
  name: string;
  value: number;
  status: string;
  details: string;
}

export async function syncPhasesToProduct(productId: string, companyId: string): Promise<PhaseSyncResult> {
  try {
    const result: PhaseSyncResult = { synced: 0, errors: [] };

    // Get company phases
    const { data: phases, error: phasesError } = await supabase
      .from('company_chosen_phases')
      .select(`
        position,
        company_phases!inner(id, name, description, category_id, sub_section_id)
      `)
      .eq('company_id', companyId)
      .order('position');

    if (phasesError) throw phasesError;

    // Sync each phase to the product
    for (const cp of phases || []) {
      try {
        const { error: syncError } = await supabase
          .from('lifecycle_phases')
          .upsert({
            product_id: productId,
            phase_id: cp.company_phases.id,
            name: cp.company_phases.name,
            description: cp.company_phases.description,
            category_id: cp.company_phases.category_id,
            sub_section_id: cp.company_phases.sub_section_id || null,
            status: 'Not Started'
          }, {
            onConflict: 'product_id,phase_id'
          });

        if (syncError) {
          result.errors.push(`Failed to sync phase ${cp.company_phases.name}: ${syncError.message}`);
        } else {
          result.synced++;
        }
      } catch (error) {
        result.errors.push(`Error syncing phase ${cp.company_phases.name}: ${error.message}`);
      }
    }

    return result;
  } catch (error) {
    console.error('Error in syncPhasesToProduct:', error);
    return {
      synced: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  }
}

export async function moveProductToPhase(productId: string, newPhaseId: string, companyId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Clear current phase flag
    await supabase
      .from('lifecycle_phases')
      .update({ is_current_phase: false })
      .eq('product_id', productId);

    // Set new current phase
    const { error } = await supabase
      .from('lifecycle_phases')
      .update({ is_current_phase: true })
      .eq('product_id', productId)
      .eq('phase_id', newPhaseId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error moving product to phase:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function validateAndRepairCompanyProducts(companyId: string): Promise<PhaseHealthReport> {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        id,
        lifecycle_phases(id, phase_id, is_current_phase, category_id, sub_section_id)
      `)
      .eq('company_id', companyId);

    if (error) throw error;

    const mappedProducts = products?.filter(p => 
      Array.isArray(p.lifecycle_phases) && 
      p.lifecycle_phases.some(lp => lp.is_current_phase)
    ).length || 0;

    const unmappedProducts = (products?.length || 0) - mappedProducts;

    return {
      healthScore: products?.length ? Math.round((mappedProducts / products.length) * 100) : 100,
      mappedProducts,
      unmappedProducts,
      issues: unmappedProducts > 0 ? [`${unmappedProducts} products without phase mapping`] : [],
      repaired: 0,
      errors: []
    };
  } catch (error) {
    console.error('Error validating company products:', error);
    return {
      healthScore: 0,
      mappedProducts: 0,
      unmappedProducts: 0,
      issues: ['Failed to analyze product health'],
      repaired: 0,
      errors: ['Failed to analyze product health']
    };
  }
}

export async function recalculateContinuousProcessDates(productId: string): Promise<{ success: boolean; updates: any[]; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('recalculate_continuous_process_dates', {
      target_product_id: productId
    });

    if (error) {
      console.error('Error recalculating continuous process dates:', error);
      return { success: false, updates: [], error: error.message };
    }

    console.log('Recalculated continuous process dates:', data);
    return { success: true, updates: data || [] };
  } catch (error) {
    console.error('Error in recalculateContinuousProcessDates:', error);
    return { 
      success: false, 
      updates: [], 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export async function checkPhaseSystemHealth(companyId: string): Promise<PhaseHealthReport> {
  const baseReport = await validateAndRepairCompanyProducts(companyId);
  
  const metrics: HealthMetric[] = [
    {
      name: 'mapped_products',
      value: baseReport.mappedProducts,
      status: baseReport.mappedProducts > 0 ? 'good' : 'error',
      details: 'Products with valid phase mapping'
    },
    {
      name: 'unmapped_products', 
      value: baseReport.unmappedProducts,
      status: baseReport.unmappedProducts === 0 ? 'good' : 'error',
      details: 'Products needing phase repair'
    }
  ];

  const overallHealth: 'good' | 'warning' | 'error' = 
    baseReport.unmappedProducts === 0 ? 'good' : 
    baseReport.unmappedProducts < 3 ? 'warning' : 'error';

  return {
    ...baseReport,
    metrics,
    overallHealth
  };
}
