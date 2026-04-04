import { supabase } from '@/integrations/supabase/client';

export interface DatabasePhase {
  id: string;
  name: string;
  description?: string;
  position: number;
  company_id: string;
  category_id?: string;
  is_predefined_core_phase?: boolean;
  is_custom?: boolean;
  is_deletable?: boolean;
  is_pre_launch?: boolean;
  is_continuous_process?: boolean;
}

export interface DatabasePhaseDocument {
  id: string;
  name: string;
  type: string;
  description?: string;
}

export interface DatabasePhasesData {
  activePhases: DatabasePhase[];
  totalPhases: number;
  availablePhases?: DatabasePhase[];
}

// Type guard to check if the data is valid and not an error
function isValidPhaseData(data: any): data is { company_phases: any; position?: number } {
  return data && typeof data === 'object' && data.company_phases && typeof data.company_phases === 'object';
}

// Type guard to check if company_phases has the required properties
function hasRequiredPhaseProperties(companyPhases: any): companyPhases is { 
  id: string; 
  name: string; 
  company_id: string; 
  description?: string; 
  category_id?: string; 
  is_predefined_core_phase?: boolean; 
  is_custom?: boolean; 
  is_deletable?: boolean; 
} {
  return companyPhases && 
         typeof companyPhases.id === 'string' && 
         typeof companyPhases.name === 'string' &&
         typeof companyPhases.company_id === 'string';
}

// Type guard to check if a phase object is valid
function isValidPhaseObject(phase: any): phase is {
  id: string;
  name: string;
  description?: string;
  position?: number;
  company_id: string;
  category_id?: string;
  is_predefined_core_phase?: boolean;
  is_custom?: boolean;
  is_deletable?: boolean;
} {
  return phase && 
         typeof phase === 'object' && 
         typeof phase.id === 'string' &&
         typeof phase.name === 'string' &&
         typeof phase.company_id === 'string';
}

// Type for validation result from the database function
interface PhaseValidationResult {
  valid: boolean;
  error?: string;
  phase_name?: string;
}

export class DatabasePhaseService {
  static async getPhases(companyId: string): Promise<DatabasePhasesData> {
    try {
      // Get active phases with category information including system flag
      const { data: activePhaseData, error } = await supabase
        .from('company_chosen_phases')
        .select(`
          position,
          company_phases!inner(
            id,
            name,
            description,
            company_id,
            category_id,
            is_active,
            phase_categories(
              id,
              name,
              is_system_category
            )
          )
        `)
        .eq('company_id', companyId)
        .order('position');

      if (error) throw error;

      // Map active phases
      const activePhases = (activePhaseData || [])
        .filter(isValidPhaseData)
        .filter(cp => hasRequiredPhaseProperties(cp.company_phases))
        .map(cp => {
          const companyPhasesRaw = cp.company_phases;
          const companyPhases = Array.isArray(companyPhasesRaw) ? companyPhasesRaw[0] : companyPhasesRaw;
          
          // Determine if this is a system phase based on category OR phase name patterns
          const isSystemCategory = companyPhases.phase_categories?.is_system_category || false;
          const isDesignControlPhase = this.isDesignControlPhase(companyPhases.name);
          const isSystemPhase = isSystemCategory || isDesignControlPhase;
          
          return {
            id: companyPhases.id,
            name: companyPhases.name,
            description: companyPhases.description || undefined,
            position: cp.position || 0,
            company_id: companyPhases.company_id,
            category_id: companyPhases.category_id || undefined,
            is_predefined_core_phase: isSystemPhase,
            is_custom: !isSystemPhase,
            is_deletable: !isSystemPhase
          };
        });

      // Get all phases from the company_phases table to determine available phases
      const { data: allPhases, error: allPhasesError } = await supabase
        .from('company_phases')
        .select(`
          id, 
          name, 
          description, 
          company_id, 
          category_id, 
          position,
          is_active,
          phase_categories(
            id,
            name,
            is_system_category
          )
        `)
        .eq('company_id', companyId)
        .order('position');

      if (allPhasesError) {
        console.warn('Error fetching all phases:', allPhasesError);
      }

      // Calculate available phases (phases that are not currently active)
      const activePhaseIds = new Set(activePhases.map(p => p.id));
      const availablePhases = (allPhases || [])
        .filter(isValidPhaseObject)
        .filter(phase => !activePhaseIds.has(phase.id))
        .map(phase => {
          const isSystemCategory = (phase as any).phase_categories?.is_system_category || false;
          const isDesignControlPhase = this.isDesignControlPhase(phase.name);
          const isSystemPhase = isSystemCategory || isDesignControlPhase;
          
          return {
            id: phase.id,
            name: phase.name,
            description: phase.description || undefined,
            position: phase.position || 0,
            company_id: phase.company_id,
            category_id: phase.category_id || undefined,
            is_predefined_core_phase: isSystemPhase,
            is_custom: !isSystemPhase,
            is_deletable: !isSystemPhase
          };
        });

      console.log(`[DatabasePhaseService] Company ${companyId}: ${activePhases.length} active phases, ${availablePhases.length} available phases`);

      return {
        activePhases,
        totalPhases: activePhases.length + availablePhases.length,
        availablePhases
      };
    } catch (error) {
      console.error('Error fetching company phases:', error);
      throw error;
    }
  }

  /**
   * Helper method to identify Design Control phases by name pattern
   */
  private static isDesignControlPhase(phaseName: string): boolean {
    const designControlPatterns = [
      'Design Input',
      'Design Output', 
      'Verification',
      'Validation',
      'Design Transfer',
      'Design Change Control',
      'Risk Management',
      'Technical Documentation',
      'Clinical Evaluation',
      'Design Review',
      'Design History File',
      'Concept',
      'Planning'
    ];
    
    return designControlPatterns.some(pattern => 
      phaseName.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  static async getPhaseDocuments(phaseId: string): Promise<DatabasePhaseDocument[]> {
    try {
      const { data, error } = await supabase
        .from('phase_assigned_documents')
        .select('*')
        .eq('phase_id', phaseId);

      if (error) throw error;

      return (data || []).map(doc => ({
        id: doc.id,
        name: doc.name,
        type: doc.document_type || 'Standard',
        description: doc.tech_applicability
      }));
    } catch (error) {
      console.error('Error fetching phase documents:', error);
      throw error;
    }
  }

  static async ensureStandardizedPhases(companyId: string): Promise<void> {
    console.log('Ensuring standardized phases for company:', companyId);
  }

  static async addPhaseToActive(companyId: string, phaseId: string): Promise<void> {
    try {
      console.log(`[DatabasePhaseService] ========== STARTING PHASE ADDITION ==========`);
      console.log(`[DatabasePhaseService] Adding phase ${phaseId} to active for company ${companyId}`);
      
      // Use the enhanced validation function that returns JSON
      const { data: validation, error: validationError } = await supabase
        .rpc('validate_phase_addition', {
          p_company_id: companyId,
          p_phase_id: phaseId
        });

      if (validationError) {
        console.error('[DatabasePhaseService] Error validating phase addition:', validationError);
        throw new Error(`Validation failed: ${validationError.message}`);
      }

      console.log(`[DatabasePhaseService] Validation result:`, validation);

      // Type assertion for the validation result (safe conversion)
      const validationResult = validation as unknown as PhaseValidationResult;

      if (!validationResult?.valid) {
        const errorMessage = validationResult?.error || 'Phase cannot be added';
        console.log(`[DatabasePhaseService] Validation failed: ${errorMessage}`);
        throw new Error(errorMessage);
      }

      const phaseName = validationResult?.phase_name || 'Unknown';
      console.log(`[DatabasePhaseService] Validation passed for phase "${phaseName}"`);

      // Get the next position (append to end)
      const { data: lastPhase, error: positionError } = await supabase
        .from('company_chosen_phases')
        .select('position')
        .eq('company_id', companyId)
        .order('position', { ascending: false })
        .limit(1);

      if (positionError) {
        console.error('[DatabasePhaseService] Error getting position:', positionError);
        throw new Error(`Failed to determine position: ${positionError.message}`);
      }

      const nextPosition = lastPhase && lastPhase.length > 0 ? lastPhase[0].position + 1 : 0;
      console.log(`[DatabasePhaseService] Next position will be: ${nextPosition}`);

      // Insert the phase into active phases
      console.log(`[DatabasePhaseService] Inserting phase into company_chosen_phases...`);
      const { error } = await supabase
        .from('company_chosen_phases')
        .insert({
          company_id: companyId,
          phase_id: phaseId,
          position: nextPosition
        });

      if (error) {
        console.error('[DatabasePhaseService] Database insert error:', error);
        
        // Handle specific error types with user-friendly messages
        if (error.code === '23505') { // Unique constraint violation
          if (error.message.includes('company_chosen_phases_company_id_phase_id_key')) {
            throw new Error(`This phase is already active for your company`);
          } else if (error.message.includes('unique_company_phase_name')) {
            throw new Error(`A phase with this name already exists`);
          } else {
            throw new Error(`Phase "${phaseName}" is already active`);
          }
        } else if (error.code === '42501') { // Insufficient privilege (RLS)
          throw new Error(`You do not have permission to add phases for this company. Please check your access level.`);
        } else if (error.message?.toLowerCase().includes('policy')) {
          throw new Error(`Access denied: You do not have permission to modify phases for this company`);
        } else if (error.message?.toLowerCase().includes('rls')) {
          throw new Error(`Security policy violation: Unable to add phase due to access restrictions`);
        } else {
          // Generic error with more context
          throw new Error(`Failed to add phase "${phaseName}": ${error.message || 'Unknown database error'}`);
        }
      }
      
      console.log(`[DatabasePhaseService] ✅ Successfully added phase "${phaseName}" (${phaseId}) to position ${nextPosition} for company ${companyId}`);
      console.log(`[DatabasePhaseService] ========== PHASE ADDITION COMPLETE ==========`);
    } catch (error) {
      console.error('[DatabasePhaseService] ❌ Error adding phase to active:', error);
      // Ensure the error message is propagated properly to the UI
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error(`Unexpected error occurred while adding phase: ${String(error)}`);
      }
    }
  }

  static async removePhaseFromActive(companyId: string, phaseId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('company_chosen_phases')
        .delete()
        .eq('company_id', companyId)
        .eq('phase_id', phaseId);

      if (error) throw error;
    } catch (error) {
      console.error('Error removing phase from active:', error);
      throw error;
    }
  }

  static async deletePhase(phaseId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('phases')
        .delete()
        .eq('id', phaseId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting phase:', error);
      throw error;
    }
  }

  static async getCategories(companyId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('phase_categories')
        .select('*')
        .eq('company_id', companyId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting categories:', error);
      return [];
    }
  }

  static async reorderPhases(companyId: string, phaseUpdates: { id: string; position: number }[]): Promise<void> {
    try {
      for (const update of phaseUpdates) {
        const { error } = await supabase
          .from('company_chosen_phases')
          .update({ position: update.position })
          .eq('company_id', companyId)
          .eq('phase_id', update.id);

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error reordering phases:', error);
      throw error;
    }
  }

  static async getPhaseByName(companyId: string, phaseName: string): Promise<DatabasePhase | null> {
    try {
      const { data, error } = await supabase
        .from('company_chosen_phases')
        .select(`
          position,
          company_phases!inner(
            id,
            name,
            description,
            company_id,
            category_id,
            is_active,
            phase_categories(
              id,
              name,
              is_system_category
            )
          )
        `)
        .eq('company_id', companyId)
        .eq('company_phases.name', phaseName)
        .single();

      if (error) throw error;

      // Safely return the data with proper type checking
      if (!isValidPhaseData(data) || !hasRequiredPhaseProperties(data.company_phases)) {
        return null;
      }

      const companyPhases = data.company_phases as {
        id: string;
        name: string;
        description?: string;
        company_id: string;
        category_id?: string;
        phase_categories?: {
          is_system_category?: boolean;
        };
      };
      
      // Determine if this is a system phase based on category
      const isSystemCategory = companyPhases.phase_categories?.is_system_category || false;
      const isDesignControlPhase = companyPhases.name.includes('Design') || 
                                 companyPhases.name.includes('Concept') ||
                                 companyPhases.name.includes('Verification') ||
                                 companyPhases.name.includes('Validation') ||
                                 companyPhases.name.includes('Risk') ||
                                 companyPhases.name.includes('Clinical') ||
                                 companyPhases.name.includes('Surveillance');
      
      return {
        id: companyPhases.id,
        name: companyPhases.name,
        description: companyPhases.description || undefined,
        position: data.position || 0,
        company_id: companyPhases.company_id,
        category_id: companyPhases.category_id || undefined,
        is_predefined_core_phase: isSystemCategory || isDesignControlPhase,
        is_custom: !isSystemCategory && !isDesignControlPhase,
        is_deletable: !isSystemCategory
      };
    } catch (error) {
      console.error('Error getting phase by name:', error);
      return null;
    }
  }

  static async getPhaseStatistics(companyId: string): Promise<any> {
    try {
      const phasesData = await this.getPhases(companyId);
      return {
        totalPhases: phasesData.totalPhases,
        activePhases: phasesData.activePhases.length
      };
    } catch (error) {
      console.error('Error getting phase statistics:', error);
      return { totalPhases: 0, activePhases: 0 };
    }
  }
}

// Export functions for backward compatibility
export async function getCompanyPhases(companyId: string): Promise<DatabasePhase[]> {
  const data = await DatabasePhaseService.getPhases(companyId);
  return data.activePhases;
}

export async function updatePhaseOrder(companyId: string, phaseUpdates: { id: string; position: number }[]): Promise<void> {
  try {
    for (const update of phaseUpdates) {
      const { error } = await supabase
        .from('company_chosen_phases')
        .update({ position: update.position })
        .eq('company_id', companyId)
        .eq('phase_id', update.id);

      if (error) throw error;
    }
  } catch (error) {
    console.error('Error updating phase order:', error);
    throw error;
  }
}
