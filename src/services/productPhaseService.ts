import { supabase } from '@/integrations/supabase/client';

export interface ProductPhase {
  id: string;
  name: string;
  description?: string;
  position: number;
  isCurrentPhase?: boolean;
  status?: string;
  start_date?: string;
  end_date?: string;
  phase_id?: string;
  is_current_phase?: boolean;
  is_overdue?: boolean;
}

export class ProductPhaseService {
  static async getProductPhases(productId: string): Promise<ProductPhase[]> {
    try {
      // Get product's company
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('company_id')
        .eq('id', productId)
        .single();

      if (productError) throw productError;

      // Get company chosen phases with company_phases data
      const { data, error } = await supabase
        .from('company_chosen_phases')
        .select(`
          position,
          company_phases!inner(id, name, description)
        `)
        .eq('company_id', product.company_id)
        .order('position');

      if (error) throw error;

      return (data || []).map(cp => ({
        id: cp.company_phases.id,
        name: cp.company_phases.name,
        description: cp.company_phases.description,
        position: cp.position
      }));
    } catch (error) {
      console.error('Error fetching product phases:', error);
      throw error;
    }
  }

  static async getProductPhasesWithTimeline(productId: string): Promise<ProductPhase[]> {
    try {
      // Get product's company for position mapping
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('company_id')
        .eq('id', productId)
        .single();

      if (productError) throw productError;

      // NOTE: Auto-sync has been removed. Phases should only sync when user
      // explicitly requests it via "Full Replace" or "Keep Existing" options.

      // Get lifecycle phases with timeline information
      const { data: lifecyclePhases, error } = await supabase
        .from('lifecycle_phases')
        .select('*')
        .eq('product_id', productId);

      if (error) throw error;

      // Get company chosen phases to map phase positions
      const { data: chosenPhases, error: chosenError } = await supabase
        .from('company_chosen_phases')
        .select('phase_id, position')
        .eq('company_id', product.company_id);

      if (chosenError) throw chosenError;

      // Create position map
      const positionMap = new Map();
      (chosenPhases || []).forEach(cp => {
        positionMap.set(cp.phase_id, cp.position);
      });

      // If no phases found, just return empty array - user needs to explicitly sync
      if (!lifecyclePhases || lifecyclePhases.length === 0) {
        console.log(`[ProductPhaseService] No lifecycle phases found for product ${productId}. User should use Settings Sync to initialize phases.`);
        return [];
      }

      // Remove duplicates and sort by position
      const uniquePhases = new Map();
      (lifecyclePhases || []).forEach(phase => {
        const key = `${phase.product_id}-${phase.phase_id}`;
        if (!uniquePhases.has(key) || uniquePhases.get(key).updated_at < phase.updated_at) {
          uniquePhases.set(key, phase);
        }
      });

      return Array.from(uniquePhases.values()).map(phase => ({
        id: phase.id,
        name: phase.name,
        description: phase.description,
        position: positionMap.get(phase.phase_id) || 0,
        status: phase.status,
        start_date: phase.start_date,
        end_date: phase.end_date,
        phase_id: phase.phase_id,
        is_current_phase: phase.is_current_phase,
        is_overdue: phase.is_overdue,
        isCurrentPhase: phase.is_current_phase,
        estimated_budget: phase.estimated_budget,
        is_pre_launch: true, // Default all phases to pre-launch until proper launch status tracking
        cost_category: phase.cost_category,
        budget_currency: phase.budget_currency
      })).sort((a, b) => a.position - b.position);
    } catch (error) {
      console.error('Error fetching product phases with timeline:', error);
      throw error;
    }
  }

  static async updateProductCurrentPhase(productId: string, phaseId: string): Promise<void> {
    try {
      console.log(`[ProductPhaseService] Updating current phase for product ${productId} to phase ${phaseId}`);
      
      // First clear all current phases for this product
      const { error: clearError } = await supabase
        .from('lifecycle_phases')
        .update({ is_current_phase: false })
        .eq('product_id', productId);

      if (clearError) {
        console.error('[ProductPhaseService] Failed to clear current phases:', clearError);
        throw clearError;
      }

      // Then set the specified phase as current using the lifecycle_phases.id
      const { data, error: setError } = await supabase
        .from('lifecycle_phases')
        .update({ is_current_phase: true })
        .eq('product_id', productId)
        .eq('id', phaseId) // Use 'id' instead of 'phase_id'
        .select('id, name, is_current_phase');

      if (setError) {
        console.error('[ProductPhaseService] Failed to set current phase:', setError);
        throw setError;
      }

      if (!data || data.length === 0) {
        console.error('[ProductPhaseService] No phase found with the specified ID');
        throw new Error(`Phase with ID ${phaseId} not found for product ${productId}`);
      }

      console.log(`[ProductPhaseService] Successfully set phase as current:`, data[0]);
    } catch (error) {
      console.error('Error updating product current phase:', error);
      throw error;
    }
  }

  static async ensureCompanyStandardPhases(companyId: string): Promise<void> {
    try {
      // Check if company already has standard phases
      const { data: existingPhases, error: checkError } = await supabase
        .from('company_chosen_phases')
        .select('id')
        .eq('company_id', companyId)
        .limit(1);

      if (checkError) throw checkError;

      if (existingPhases && existingPhases.length > 0) {
        console.log('Company already has phases configured');
        return;
      }

      // Add standard phases logic would go here
      console.log('Ensuring standard phases for company:', companyId);
    } catch (error) {
      console.error('Error ensuring company standard phases:', error);
      throw error;
    }
  }

  static async ensureProductPhases(productId: string, companyId: string): Promise<void> {
    // NOTE: Auto-sync has been removed. This method now only checks if phases exist.
    // Phases should only sync when user explicitly requests it via "Full Replace" or "Keep Existing" options.
    try {
      console.log('[ProductPhaseService] Checking product phases for:', productId);

      const { data: existingPhases, error } = await supabase
        .from('lifecycle_phases')
        .select('id')
        .eq('product_id', productId)
        .limit(1);

      if (error) throw error;

      if (!existingPhases || existingPhases.length === 0) {
        console.log(`[ProductPhaseService] No phases found for product ${productId}. User should use Settings Sync to initialize phases.`);
      } else {
        console.log(`[ProductPhaseService] Product ${productId} has existing phases.`);
      }
    } catch (error) {
      console.error('Error checking product phases:', error);
      throw error;
    }
  }
}

export async function getProductPhases(productId: string): Promise<ProductPhase[]> {
  return ProductPhaseService.getProductPhases(productId);
}

export async function updateProductCurrentPhase(productId: string, phaseId: string): Promise<void> {
  return ProductPhaseService.updateProductCurrentPhase(productId, phaseId);
}
