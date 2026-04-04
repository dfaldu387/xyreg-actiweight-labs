import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type DependencyType = 'finish_to_start' | 'start_to_start' | 'finish_to_finish' | 'start_to_finish' | 'span_between_phases';

export interface PhaseDependency {
  id: string;
  source_phase_id: string;
  target_phase_id: string;
  dependency_type: DependencyType;
  lag_days: number;
  company_id: string;
  created_at: string;
  updated_at: string;
  // For span_between_phases type
  end_phase_id?: string; // The phase that determines when target should end
}

// Database response type
interface PhaseDependencyRow {
  id: string;
  source_phase_id: string;
  target_phase_id: string;
  dependency_type: string;
  lag_days: number;
  company_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateDependencyData {
  source_phase_id: string;
  target_phase_id: string;
  dependency_type: DependencyType;
  lag_days?: number;
  company_id: string;
  end_phase_id?: string; // For span_between_phases type
}

export interface CalculatedPhaseDates {
  phase_id: string;
  calculated_start_date: string;
  calculated_end_date: string;
}

export class PhaseDependencyService {
  /**
   * Create a new phase dependency
   */
  static async createDependency(data: CreateDependencyData): Promise<{ success: boolean; error?: string }> {
    try {
      const insertData: any = {
        source_phase_id: data.source_phase_id,
        target_phase_id: data.target_phase_id,
        dependency_type: data.dependency_type,
        lag_days: data.lag_days || 0,
        company_id: data.company_id,
      };

      // Add end_phase_id for span dependencies
      if (data.dependency_type === 'span_between_phases' && data.end_phase_id) {
        insertData.end_phase_id = data.end_phase_id;
      }

      const { error } = await supabase
        .from('phase_dependencies')
        .insert(insertData);

      if (error) {
        console.error('[PhaseDependencyService] Error creating dependency:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('[PhaseDependencyService] Unexpected error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Update an existing dependency
   */
  static async updateDependency(
    dependencyId: string,
    updates: Partial<Pick<PhaseDependency, 'dependency_type' | 'lag_days'>>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('phase_dependencies')
        .update(updates)
        .eq('id', dependencyId);

      if (error) {
        console.error('[PhaseDependencyService] Error updating dependency:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('[PhaseDependencyService] Unexpected error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Delete a dependency
   */
  static async deleteDependency(dependencyId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('phase_dependencies')
        .delete()
        .eq('id', dependencyId);

      if (error) {
        console.error('[PhaseDependencyService] Error deleting dependency:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('[PhaseDependencyService] Unexpected error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Get all dependencies for a company
   */
  static async getDependencies(companyId: string): Promise<{
    success: boolean;
    dependencies: PhaseDependency[];
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('phase_dependencies')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('[PhaseDependencyService] Error loading dependencies:', error);
        return { success: false, dependencies: [], error: error.message };
      }

      // Transform database rows to typed interface
      const dependencies = (data || []).map((row: PhaseDependencyRow): PhaseDependency => ({
        ...row,
        dependency_type: row.dependency_type as DependencyType,
      }));

      return { success: true, dependencies };
    } catch (error) {
      console.error('[PhaseDependencyService] Unexpected error:', error);
      return { 
        success: false, 
        dependencies: [], 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Get dependencies for a specific phase
   */
  static async getPhaseDependencies(phaseId: string, companyId: string): Promise<{
    success: boolean;
    incoming: PhaseDependency[];
    outgoing: PhaseDependency[];
    error?: string;
  }> {
    try {
      if (!phaseId || !companyId) {
        console.error('[PhaseDependencyService] Missing required parameters:', { phaseId, companyId });
        return { success: false, incoming: [], outgoing: [], error: 'Missing phase ID or company ID' };
      }

      // Get incoming dependencies (where this phase is the target)
      // Include company_id for RLS policy compliance
      const { data: incoming, error: incomingError } = await supabase
        .from('phase_dependencies')
        .select('*')
        .eq('target_phase_id', phaseId)
        .eq('company_id', companyId);

      if (incomingError) {
        console.error('[PhaseDependencyService] Incoming error:', incomingError);
        return { success: false, incoming: [], outgoing: [], error: incomingError.message };
      }

      // Get outgoing dependencies (where this phase is the source)
      // Include company_id for RLS policy compliance
      const { data: outgoing, error: outgoingError } = await supabase
        .from('phase_dependencies')
        .select('*')
        .eq('source_phase_id', phaseId)
        .eq('company_id', companyId);

      if (outgoingError) {
        console.error('[PhaseDependencyService] Outgoing error:', outgoingError);
        return { success: false, incoming: [], outgoing: [], error: outgoingError.message };
      }

      // Transform database rows to typed interface
      const typedIncoming = (incoming || []).map((row: PhaseDependencyRow): PhaseDependency => ({
        ...row,
        dependency_type: row.dependency_type as DependencyType,
      }));
      
      const typedOutgoing = (outgoing || []).map((row: PhaseDependencyRow): PhaseDependency => ({
        ...row,
        dependency_type: row.dependency_type as DependencyType,
      }));

      return { 
        success: true, 
        incoming: typedIncoming, 
        outgoing: typedOutgoing 
      };
    } catch (error) {
      console.error('[PhaseDependencyService] Unexpected error:', error);
      return { 
        success: false, 
        incoming: [], 
        outgoing: [], 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Calculate scheduled dates for all phases based on dependencies
   */
  static async calculateSchedule(companyId: string): Promise<{
    success: boolean;
    schedule: CalculatedPhaseDates[];
    error?: string;
  }> {
    try {
      const { data, error } = await supabase.rpc('calculate_phase_dates', {
        p_company_id: companyId
      });

      if (error) {
        console.error('[PhaseDependencyService] Error calculating schedule:', error);
        return { success: false, schedule: [], error: error.message };
      }

      return { success: true, schedule: data || [] };
    } catch (error) {
      console.error('[PhaseDependencyService] Unexpected error:', error);
      return { 
        success: false, 
        schedule: [], 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Apply calculated schedule to company phases
   */
  static async applySchedule(companyId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // First calculate the schedule
      const scheduleResult = await this.calculateSchedule(companyId);
      if (!scheduleResult.success) {
        return { success: false, error: scheduleResult.error };
      }

      // Apply each calculated date
      const updatePromises = scheduleResult.schedule.map(({ phase_id, calculated_start_date, calculated_end_date }) =>
        supabase
          .from('company_phases')
          .update({
            start_date: calculated_start_date,
            end_date: calculated_end_date,
          })
          .eq('id', phase_id)
          .eq('company_id', companyId)
      );

      const results = await Promise.all(updatePromises);
      
      // Check for any errors
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        console.error('[PhaseDependencyService] Errors applying schedule:', errors);
        return { success: false, error: 'Failed to apply some schedule updates' };
      }

      toast.success('Phase schedule updated based on dependencies');
      return { success: true };
    } catch (error) {
      console.error('[PhaseDependencyService] Unexpected error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Get dependency type display name
   */
  static getDependencyTypeLabel(type: DependencyType): string {
    switch (type) {
      case 'finish_to_start':
        return 'Finish to Start';
      case 'start_to_start':
        return 'Start to Start';
      case 'finish_to_finish':
        return 'Finish to Finish';
      case 'start_to_finish':
        return 'Start to Finish';
      case 'span_between_phases':
        return 'Span Between Phases';
      default:
        return type;
    }
  }

  /**
   * Get dependency type description
   */
  static getDependencyTypeDescription(type: DependencyType): string {
    switch (type) {
      case 'finish_to_start':
        return 'Target phase cannot start until source phase finishes';
      case 'start_to_start':
        return 'Target phase cannot start until source phase starts';
      case 'finish_to_finish':
        return 'Target phase cannot finish until source phase finishes';
      case 'start_to_finish':
        return 'Target phase cannot finish until source phase starts';
      case 'span_between_phases':
        return 'Target phase starts after source finishes and ends when end phase finishes';
      default:
        return '';
    }
  }
}