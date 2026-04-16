import { supabase } from '@/integrations/supabase/client';

export interface ConsolidatedPhase {
  id: string;
  name: string;
  description?: string;
  position: number;
  company_id: string;
  category_id?: string;
  sub_section_id?: string | null;
  compliance_section_ids?: string[];
  is_active: boolean;
  is_predefined_core_phase: boolean;
  is_deletable: boolean;
  is_custom: boolean;
  start_date?: string | null;
  duration_days?: number | null;

  // Phase type fields
  is_continuous_process?: boolean; // true = Concurrent Phase, false = Linear Development Phase
  typical_start_day?: number | null;
  typical_duration_days?: number | null;

  // CALCULATED FIELDS - Added for phase scheduling service
  calculated_start_day?: number;
  calculated_end_day?: number;
  is_calculated?: boolean;

  category?: {
    id: string;
    name: string;
    position: number;
  };
}

export interface PhaseCategory {
  id: string;
  name: string;
  position: number;
  company_id: string;
}

/**
 * Consolidated Phase Service
 * Works with the unified company_phases table after consolidation
 */
export class ConsolidatedPhaseService {

  /**
   * Get all phases for a company with categories
   */
  static async getCompanyPhases(companyId: string): Promise<ConsolidatedPhase[]> {
    try {
      const { data, error } = await supabase
        .from('company_phases')
        .select(`
          id,
          name,
          description,
          position,
          company_id,
          category_id,
          is_active,
          is_predefined_core_phase,
          is_custom,
          is_deletable,
          start_date,
          duration_days,
          is_continuous_process,
          typical_start_day,
          typical_duration_days,
          phase_categories:category_id(
            id,
            name,
            position
          )
        `)
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('position');

      if (error) throw error;

      // Cast to any to handle columns that exist in DB but not in generated Supabase types
      return (data || []).map((phase: any) => ({
        id: phase.id,
        name: phase.name,
        description: phase.description,
        position: phase.position,
        company_id: phase.company_id,
        category_id: phase.category_id,
        is_active: phase.is_active,
        is_predefined_core_phase: phase.is_predefined_core_phase || false,
        is_deletable: phase.is_deletable || true,
        is_custom: phase.is_custom || false,
        start_date: phase.start_date,
        duration_days: phase.duration_days,
        is_continuous_process: phase.is_continuous_process || false,
        typical_start_day: phase.typical_start_day,
        typical_duration_days: phase.typical_duration_days,
        category: phase.phase_categories ? {
          id: phase.phase_categories.id,
          name: phase.phase_categories.name,
          position: phase.phase_categories.position
        } : undefined
      }));
    } catch (error) {
      console.error('Error fetching company phases:', error);
      throw error;
    }
  }

  /**
   * Get active phases for company dashboard
   */
  static async getActivePhases(companyId: string): Promise<ConsolidatedPhase[]> {
    try {
      const { data, error } = await supabase
        .from('company_chosen_phases')
        .select(`
          position,
          company_phases!inner(
            id,
            name,
            description,
            position,
            company_id,
            category_id,
            sub_section_id,
            compliance_section_ids,
            is_active,
            is_predefined_core_phase,
            is_custom,
            is_deletable,
            start_date,
            duration_days,
            is_continuous_process,
            typical_start_day,
            typical_duration_days,
            phase_categories:category_id(
              id,
              name,
              position
            )
          )
        `)
        .eq('company_id', companyId)
        .order('position');

      if (error) throw error;

      // Cast to any to handle columns that exist in DB but not in generated Supabase types
      return (data || []).map((cp: any) => ({
        id: cp.company_phases.id,
        name: cp.company_phases.name,
        description: cp.company_phases.description,
        position: cp.position || cp.company_phases.position,
        company_id: cp.company_phases.company_id,
        category_id: cp.company_phases.category_id,
        sub_section_id: cp.company_phases.sub_section_id || null,
        compliance_section_ids: cp.company_phases.compliance_section_ids || [],
        is_active: cp.company_phases.is_active,
        is_predefined_core_phase: cp.company_phases.is_predefined_core_phase || false,
        is_deletable: cp.company_phases.is_deletable || true,
        is_custom: cp.company_phases.is_custom || false,
        start_date: cp.company_phases.start_date,
        duration_days: cp.company_phases.duration_days,
        is_continuous_process: cp.company_phases.is_continuous_process || false,
        typical_start_day: cp.company_phases.typical_start_day,
        typical_duration_days: cp.company_phases.typical_duration_days,
        category: cp.company_phases.phase_categories ? {
          id: cp.company_phases.phase_categories.id,
          name: cp.company_phases.phase_categories.name,
          position: cp.company_phases.phase_categories.position
        } : undefined
      }));
    } catch (error) {
      console.error('Error fetching active phases:', error);
      throw error;
    }
  }

  /**
   * Get available phases (not currently active for company)
   */
  static async getAvailablePhases(companyId: string): Promise<ConsolidatedPhase[]> {
    try {
      // First, get the active phase IDs
      const { data: activePhaseIds, error: activeError } = await supabase
        .from('company_chosen_phases')
        .select('phase_id')
        .eq('company_id', companyId);

      if (activeError) throw activeError;

      const activeIds = (activePhaseIds || []).map(item => item.phase_id);

      // Then get phases not in the active list (includes both is_active true and false)
      let query = supabase
        .from('company_phases')
        .select(`
          id,
          name,
          description,
          position,
          company_id,
          category_id,
          sub_section_id,
          compliance_section_ids,
          is_active,
          is_predefined_core_phase,
          is_custom,
          is_deletable,
          duration_days,
          start_date,
          is_continuous_process,
          typical_start_day,
          typical_duration_days,
          phase_categories:category_id(
            id,
            name,
            position
          )
        `)
        .eq('company_id', companyId)
        .order('position');

      // Only add the not.in filter if there are active phase IDs
      if (activeIds.length > 0) {
        query = query.not('id', 'in', `(${activeIds.join(',')})`);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Cast to any to handle columns that exist in DB but not in generated Supabase types
      const mappedPhases = (data || []).map((phase: any) => ({
        id: phase.id,
        name: phase.name,
        description: phase.description,
        position: phase.position,
        company_id: phase.company_id,
        category_id: phase.category_id,
        sub_section_id: phase.sub_section_id || null,
        compliance_section_ids: phase.compliance_section_ids || [],
        is_active: phase.is_active,
        is_predefined_core_phase: phase.is_predefined_core_phase || false,
        is_deletable: phase.is_deletable || true,
        is_custom: phase.is_custom || false,
        start_date: phase.start_date,
        duration_days: phase.duration_days,
        is_continuous_process: phase.is_continuous_process || false,
        typical_start_day: phase.typical_start_day,
        typical_duration_days: phase.typical_duration_days,
        category: phase.phase_categories ? {
          id: phase.phase_categories.id,
          name: phase.phase_categories.name,
          position: phase.phase_categories.position
        } : undefined
      }));
      
      
      
      return mappedPhases;
    } catch (error) {
      console.error('Error fetching available phases:', error);
      throw error;
    }
  }

  /**
   * Get phase categories for a company
   */
  static async getPhaseCategories(companyId: string): Promise<PhaseCategory[]> {
    try {
      const { data, error } = await supabase
        .from('phase_categories')
        .select('*')
        .eq('company_id', companyId)
        .order('position');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching phase categories:', error);
      throw error;
    }
  }

  /**
   * Reorder phase categories by updating their position values
   */
  static async reorderCategories(categoryIds: string[]): Promise<void> {
    try {
      for (let i = 0; i < categoryIds.length; i++) {
        const { error } = await supabase
          .from('phase_categories')
          .update({ position: i })
          .eq('id', categoryIds[i]);

        if (error) throw error;
      }
    } catch (error) {
      console.error('[ConsolidatedPhaseService] Error reordering categories:', error);
      throw error;
    }
  }

  /**
   * Add phase to active phases
   */
  static async addPhaseToActive(companyId: string, phaseId: string): Promise<void> {
    try {
      // Get the highest position for new phase
      const { data: existingPhases } = await supabase
        .from('company_chosen_phases')
        .select('position')
        .eq('company_id', companyId)
        .order('position', { ascending: false })
        .limit(1);

      const newPosition = (existingPhases?.[0]?.position || 0) + 1;

      const { error } = await supabase
        .from('company_chosen_phases')
        .insert({
          company_id: companyId,
          phase_id: phaseId,
          position: newPosition
        });

      if (error) throw error;

      // Recalculate cumulative day starts after adding a new phase
      await this.recalculateCumulativeDayStarts(companyId);
    } catch (error) {
      console.error('Error adding phase to active:', error);
      throw error;
    }
  }

  /**
   * Remove phase from active phases
   */
  static async removePhaseFromActive(companyId: string, phaseId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('company_chosen_phases')
        .delete()
        .eq('company_id', companyId)
        .eq('phase_id', phaseId);

      if (error) throw error;

      // Recalculate cumulative day starts after removing a phase
      await this.recalculateCumulativeDayStarts(companyId);
    } catch (error) {
      console.error('Error removing phase from active:', error);
      throw error;
    }
  }

  /**
   * Reorder active phases by deleting and re-inserting all chosen phases
   * in the correct order. This avoids unique constraint issues entirely.
   */
  static async reorderPhases(companyId: string, reorderedPhaseIds: string[]): Promise<void> {
    try {
      // Fetch all chosen phases ordered by current position
      const { data: allChosen, error: fetchError } = await supabase
        .from('company_chosen_phases')
        .select('phase_id, position')
        .eq('company_id', companyId)
        .order('position');

      if (fetchError) throw fetchError;
      if (!allChosen || allChosen.length === 0) return;

      // Build the new full order:
      // Keep non-dragged phases in their relative positions,
      // replace dragged phases with the new order at the first dragged position
      const draggedSet = new Set(reorderedPhaseIds);
      const fullOrder: string[] = [];
      let dragInserted = false;

      for (const row of allChosen) {
        if (draggedSet.has(row.phase_id)) {
          if (!dragInserted) {
            fullOrder.push(...reorderedPhaseIds);
            dragInserted = true;
          }
        } else {
          fullOrder.push(row.phase_id);
        }
      }

      // Delete all chosen phases for this company
      const { error: deleteError } = await supabase
        .from('company_chosen_phases')
        .delete()
        .eq('company_id', companyId);

      if (deleteError) throw deleteError;

      // Re-insert all phases with clean sequential positions
      const inserts = fullOrder.map((phaseId, index) => ({
        company_id: companyId,
        phase_id: phaseId,
        position: index,
      }));

      const { error: insertError } = await supabase
        .from('company_chosen_phases')
        .insert(inserts);

      if (insertError) throw insertError;

      // Recalculate cumulative day starts after reordering
      await this.recalculateCumulativeDayStarts(companyId);
    } catch (error) {
      console.error('[ConsolidatedPhaseService] Error reordering phases:', error);
      throw error;
    }
  }

  /**
   * Create a new phase for company
   */
  static async createPhase(
    companyId: string,
    name: string,
    description?: string,
    categoryId?: string
  ): Promise<ConsolidatedPhase> {
    try {
      // Get the highest position for new phase
      const { data: existingPhases } = await supabase
        .from('company_phases')
        .select('position')
        .eq('company_id', companyId)
        .order('position', { ascending: false })
        .limit(1);

      const newPosition = (existingPhases?.[0]?.position || 0) + 1;

      const { data, error } = await supabase
        .from('company_phases')
        .insert({
          company_id: companyId,
          name,
          description,
          position: newPosition,
          category_id: categoryId,
          is_active: true,
          is_predefined_core_phase: false,
          is_custom: true,
          is_deletable: true,
          duration_days: 30 // Default duration
        })
        .select()
        .single();

      if (error) throw error;

      return {
        ...data,
        is_predefined_core_phase: data.is_predefined_core_phase || false,
        is_deletable: data.is_deletable || true,
        is_custom: data.is_custom || true
      };
    } catch (error) {
      console.error('Error creating phase:', error);
      throw error;
    }
  }

  /**
   * Calculate cumulative day starts for all phases in a company
   */
  static async recalculateCumulativeDayStarts(companyId: string): Promise<void> {
    try {
      // Get all active phases for the company, sorted by position
      const { data: phases, error } = await supabase
        .from('company_chosen_phases')
        .select(`
          id,
          position,
          phase_id,
          company_phases!inner (
            id,
            duration_days
          )
        `)
        .eq('company_id', companyId)
        .order('position');

      if (error) throw error;
      if (!phases || phases.length === 0) return;

      // Calculate cumulative day starts
      let cumulativeDay = 0;
      const updates: { phaseId: string; startDay: number }[] = [];

      for (const phase of phases) {
        const phaseData = phase.company_phases;

        // Set the start day for this phase
        updates.push({
          phaseId: phaseData.id,
          startDay: cumulativeDay
        });

        // Add duration to cumulative day for all phases
        const duration = phaseData.duration_days || 0;
        cumulativeDay += duration;
      }

      // Update all phases with new start_date values
      for (const update of updates) {
        await supabase
          .from('company_phases')
          .update({
            start_date: new Date(Date.now() + update.startDay * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            updated_at: new Date().toISOString()
          })
          .eq('id', update.phaseId);
      }

      
    } catch (error) {
      console.error('Error recalculating cumulative day starts:', error);
      throw error;
    }
  }

  /**
   * Update phase
   */
  static async updatePhase(
    phaseId: string,
    updates: {
      name?: string;
      description?: string;
      category_id?: string;
      typical_start_day?: number | null;
      typical_duration_days?: number | null;
      duration_days?: number | null;
      start_percentage?: number;
      end_percentage?: number;

      start_phase_id?: string | null;
      end_phase_id?: string | null;
      start_position?: string | null;
      end_position?: string | null;
    }
  ): Promise<void> {
    try {
      // First, get the company ID for this phase
      const { data: phaseData, error: phaseError } = await supabase
        .from('company_phases')
        .select('company_id')
        .eq('id', phaseId)
        .single();

      if (phaseError) throw phaseError;


      // Filter out undefined values from updates object
      const filteredUpdates = Object.fromEntries(
        Object.entries({
          name: updates.name,
          description: updates.description,
          category_id: updates.category_id,
          typical_start_day: updates.typical_start_day,
          duration_days: updates.duration_days ?? updates.typical_duration_days,
          start_percentage: updates.start_percentage,
          end_percentage: updates.end_percentage,
          start_phase_id: updates.start_phase_id,
          end_phase_id: updates.end_phase_id,
          start_position: updates.start_position,
          end_position: updates.end_position,
          updated_at: new Date().toISOString()
        }).filter(([key, value]) => value !== undefined)
      );
      
      
      
      const { error } = await supabase
        .from('company_phases')
        .update(filteredUpdates as any)
        .eq('id', phaseId);

      if (error) {
        console.error('[consolidatedPhaseService] Update error:', error);
        throw error;
      }

      // If duration was updated, recalculate cumulative day starts for all phases
      if (updates.typical_duration_days !== undefined || updates.duration_days !== undefined) {
        await this.recalculateCumulativeDayStarts(phaseData.company_id);
      }
    } catch (error) {
      console.error('Error updating phase:', error);
      throw error;
    }
  }

  /**
   * Delete phase with proper dependency checking
   */
  static async deletePhase(phaseId: string): Promise<void> {
    try {
      // Use the database function for safe deletion
      const { data, error } = await supabase
        .rpc('safe_delete_phase', {
          phase_id: phaseId
        });

      if (error) throw error;

      // Check if deletion was successful
      const result = data as { success: boolean; error?: string; message?: string };
      if (result && !result.success) {
        throw new Error(result.error || 'Failed to delete phase');
      }
    } catch (error) {
      console.error('Error deleting phase:', error);
      throw error;
    }
  }
}
