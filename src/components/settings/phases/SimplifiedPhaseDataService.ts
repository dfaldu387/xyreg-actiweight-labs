
import { DatabasePhaseService } from '@/services/databasePhaseService';
import { EnhancedPhaseService } from '@/services/enhancedPhaseService';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PhaseNameSyncService } from "@/services/phaseNameSyncService";

export interface Phase {
  id: string;
  name: string;
  description?: string;
  position: number;
  category_id?: string;
  is_predefined_core_phase: boolean;
  is_deletable: boolean;
  is_custom: boolean;
  is_active: boolean;
  is_continuous_process?: boolean;
  company_id: string;
  category?: {
    id: string;
    name: string;
    position?: number;
  };
}

export interface PhaseCategory {
  id: string;
  name: string;
  company_id: string;
  is_system_category?: boolean;
}

/**
 * Updated SimplifiedPhaseDataService - Now properly reads system phase flags from database
 */
export class SimplifiedPhaseDataService {
  /**
   * Load phases for a company - now reads system phase flags from both phases and categories
   */
  static async loadPhases(companyId: string): Promise<{
    activePhases: Phase[];
    availablePhases: Phase[];
  }> {
    try {
      const phasesData = await DatabasePhaseService.getPhases(companyId);
      return {
        activePhases: phasesData.activePhases.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description,
          position: p.position,
          category_id: p.category_id,
          is_predefined_core_phase: p.is_predefined_core_phase || false,
          is_deletable: p.is_deletable !== false,
          is_custom: p.is_custom || false,
          is_active: true,
          is_continuous_process: p.is_continuous_process || false,
          company_id: p.company_id
        })),
        availablePhases: phasesData.availablePhases?.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description,
          position: p.position,
          category_id: p.category_id,
          is_predefined_core_phase: p.is_predefined_core_phase || false,
          is_deletable: p.is_deletable !== false,
          is_custom: p.is_custom || false,
          is_active: false,
          is_continuous_process: (p as any).is_continuous_process || false,
          company_id: p.company_id
        })) || []
      };
    } catch (error) {
      console.error('Error loading phases:', error);
      return { activePhases: [], availablePhases: [] };
    }
  }

  /**
   * Load categories for a company - now includes is_system_category flag
   */
  static async loadCategories(companyId: string): Promise<PhaseCategory[]> {
    try {
      const { data: categories, error } = await supabase
        .from('phase_categories')
        .select('id, name, company_id, is_system_category')
        .eq('company_id', companyId)
        .order('position');

      if (error) {
        console.error('Error loading categories:', error);
        throw error;
      }

      return categories || [];
    } catch (error) {
      console.error('Error in loadCategories:', error);
      return [];
    }
  }

  /**
   * Add phase to active phases
   */
  static async addPhaseToActive(companyId: string, phaseId: string): Promise<void> {
    return await DatabasePhaseService.addPhaseToActive(companyId, phaseId);
  }

  /**
   * Remove phase from active phases
   */
  static async removePhaseFromActive(companyId: string, phaseId: string): Promise<void> {
    return await DatabasePhaseService.removePhaseFromActive(companyId, phaseId);
  }

  /**
   * Reorder phases
   */
  static async reorderPhases(companyId: string, phases: Phase[]): Promise<void> {
    return await DatabasePhaseService.reorderPhases(companyId, phases);
  }

  /**
   * Delete a phase
   */
  static async deletePhase(phaseId: string): Promise<void> {
    return await DatabasePhaseService.deletePhase(phaseId);
  }

  /**
   * Get recommended documents for a phase from database
   */
  static async getRecommendedDocuments(phaseId: string): Promise<Array<{name: string; type: string}>> {
    return await DatabasePhaseService.getPhaseDocuments(phaseId);
  }

  /**
   * Get all phases for a company from database
   */
  static async getCompanyPhases(companyId: string) {
    const result = await this.loadPhases(companyId);
    return result.activePhases;
  }

  /**
   * Ensure company has standardized phase template
   */
  static async ensureStandardizedPhases(companyId: string): Promise<boolean> {
    try {
      await DatabasePhaseService.ensureStandardizedPhases(companyId);
      return true;
    } catch (error) {
      console.error('Error ensuring standardized phases:', error);
      return false;
    }
  }

  /**
   * Get phase by name from database
   */
  static async getPhaseByName(companyId: string, phaseName: string) {
    return await DatabasePhaseService.getPhaseByName(companyId, phaseName);
  }

  /**
   * Get standard phase template structure (for reference only)
   */
  static getStandardPhaseTemplate() {
    return EnhancedPhaseService.getStandardPhaseTemplate();
  }

  /**
   * DEPRECATED: Phase names should be preserved exactly as they are
   * This function is kept for backward compatibility but should not be used
   */
  static cleanPhaseName(phaseName: string): string {
    console.warn('cleanPhaseName() called - phase names should be preserved exactly');
    return phaseName; // Return name unchanged
  }

  /**
   * Get phase statistics
   */
  static async getPhaseStatistics(companyId: string) {
    return await DatabasePhaseService.getPhaseStatistics(companyId);
  }

  /**
   * Migration helper: Check if company needs phase standardization
   */
  static async validateCompanyPhases(companyId: string): Promise<{
    needsStandardization: boolean;
    currentCount: number;
    standardCount: number;
    missingPhases: string[];
  }> {
    try {
      const phases = await this.getCompanyPhases(companyId);
      const standardTemplate = this.getStandardPhaseTemplate();
      
      const currentPhaseNames = phases.map(p => p.name);
      const standardPhaseNames = standardTemplate.map(p => p.name);
      
      const missingPhases = standardPhaseNames.filter(
        standardName => !currentPhaseNames.includes(standardName)
      );
      
      return {
        needsStandardization: phases.length !== 15 || missingPhases.length > 0,
        currentCount: phases.length,
        standardCount: 15,
        missingPhases
      };
    } catch (error) {
      console.error('Error validating company phases:', error);
      const standardTemplate = this.getStandardPhaseTemplate();
      return {
        needsStandardization: true,
        currentCount: 0,
        standardCount: 15,
        missingPhases: standardTemplate.map(p => p.name)
      };
    }
  }

  /**
   * Update a phase with name synchronization
   */
  static async updatePhase(phaseId: string, updates: Partial<Phase>): Promise<boolean> {
    try {
      console.log('[SimplifiedPhaseDataService] Updating phase:', phaseId, updates);

      // Get the current phase name before update
      const { data: currentPhase, error: fetchError } = await supabase
        .from('phases')
        .select('name')
        .eq('id', phaseId)
        .single();

      if (fetchError) {
        console.error('[SimplifiedPhaseDataService] Error fetching current phase:', fetchError);
        throw fetchError;
      }

      // Update the phase
      const { error: updateError } = await supabase
        .from('phases')
        .update(updates)
        .eq('id', phaseId);

      if (updateError) {
        console.error('[SimplifiedPhaseDataService] Error updating phase:', updateError);
        throw updateError;
      }

      // If the name was changed, trigger synchronization
      if (updates.name && updates.name !== currentPhase?.name) {
        console.log('[SimplifiedPhaseDataService] Phase name changed, triggering sync');
        await PhaseNameSyncService.syncPhaseNamesAcrossAllTables(phaseId, updates.name);
      }

      console.log('[SimplifiedPhaseDataService] Phase updated successfully');
      return true;
    } catch (error) {
      console.error('[SimplifiedPhaseDataService] Error updating phase:', error);
      toast.error('Failed to update phase');
      return false;
    }
  }

  /**
   * Create a new phase
   */
  static async createPhase(companyId: string, phaseData: Omit<Phase, 'id' | 'company_id'>): Promise<string | null> {
    try {
      console.log('[SimplifiedPhaseDataService] Creating new phase:', phaseData);

      const { data: newPhase, error } = await supabase
        .from('phases')
        .insert({
          ...phaseData,
          company_id: companyId
        })
        .select('id')
        .single();

      if (error) {
        console.error('[SimplifiedPhaseDataService] Error creating phase:', error);
        throw error;
      }

      console.log('[SimplifiedPhaseDataService] Phase created successfully:', newPhase.id);
      return newPhase.id;
    } catch (error) {
      console.error('[SimplifiedPhaseDataService] Error creating phase:', error);
      toast.error('Failed to create phase');
      return null;
    }
  }
}
