
import { useState, useEffect } from 'react';
import { ConsolidatedPhaseService, type ConsolidatedPhase, type PhaseCategory } from '@/services/consolidatedPhaseService';
import { PhaseSchedulingService } from '@/services/phaseSchedulingService';
import { PhaseDependencyService } from '@/services/phaseDependencyService';
import { sortPhasesByDependencies } from '@/utils/dependencySorting';
import { toast } from 'sonner';

export function useConsolidatedPhases(companyId?: string) {
  const [activePhases, setActivePhases] = useState<ConsolidatedPhase[]>([]);
  const [availablePhases, setAvailablePhases] = useState<ConsolidatedPhase[]>([]);
  const [categories, setCategories] = useState<PhaseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async (silent = false) => {

    if (!companyId) {

      return;
    }

    try {
      if (!silent) setLoading(true);
      setError(null);
      

      // Get dependencies and scheduled phases
      const [dependenciesResult, scheduledPhases] = await Promise.all([
        PhaseDependencyService.getDependencies(companyId),
        PhaseSchedulingService.getPhasesWithScheduling(companyId)
      ]);
      
     
      
      // Sort phases by dependencies (upstream phases first)
      const dependencies = dependenciesResult.success ? dependenciesResult.dependencies : [];
      const sortedPhases = sortPhasesByDependencies(scheduledPhases, dependencies);
      
      
      // Get available phases and categories using regular service (no calculations needed)
      const [availablePhasesData, categoriesData] = await Promise.all([
        ConsolidatedPhaseService.getAvailablePhases(companyId),
        ConsolidatedPhaseService.getPhaseCategories(companyId)
      ]);

      // Convert sorted phases to ConsolidatedPhase format and set calculated fields
      const activeWithCalculated: ConsolidatedPhase[] = sortedPhases.map(phase => {
        // Find the category for this phase
        const category = categoriesData.find(cat => cat.id === phase.category_id);
        
        return {
          id: phase.id,
          name: phase.name,
          description: phase.description,
          position: phase.position,
          company_id: phase.company_id,
          category_id: phase.category_id,
          sub_section_id: phase.sub_section_id || null,
          compliance_section_ids: phase.compliance_section_ids || [],
          category: category ? {
            id: category.id,
            name: category.name,
            position: category.position || 0
          } : undefined,
          is_active: phase.is_active,
          is_predefined_core_phase: false, // Add default values for required fields
          is_deletable: true,
          is_custom: false,
          duration_days: phase.duration_days,
          start_date: phase.start_date,
          calculated_start_day: phase.calculated_start_day,
          calculated_end_day: phase.calculated_end_day,
          is_calculated: phase.is_calculated
        };
      });

      setActivePhases(activeWithCalculated);
      setAvailablePhases(availablePhasesData);
      setCategories(categoriesData);
    } catch (err) {
      console.error('Error loading phase data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load phase data');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (companyId) {
      loadData();
    }
  }, [companyId]);

  const addPhaseToActive = async (phaseId: string, phaseName: string) => {
    if (!companyId) return false;

    try {
      await ConsolidatedPhaseService.addPhaseToActive(companyId, phaseId);
      toast.success(`Added "${phaseName}" to active phases`);
      await loadData();
      return true;
    } catch (error) {
      console.error('Error adding phase to active:', error);
      toast.error('Failed to add phase to active phases');
      return false;
    }
  };

  const removePhaseFromActive = async (phaseId: string, phaseName: string) => {
    if (!companyId) return false;

    try {
      await ConsolidatedPhaseService.removePhaseFromActive(companyId, phaseId);
      toast.success(`Removed "${phaseName}" from active phases`);
      await loadData();
      return true;
    } catch (error) {
      console.error('Error removing phase from active:', error);
      toast.error('Failed to remove phase from active phases');
      return false;
    }
  };

  const reorderPhases = async (phaseIds: string[]) => {
    if (!companyId) return false;

    try {
      await ConsolidatedPhaseService.reorderPhases(companyId, phaseIds);
      toast.success('Phase order updated');
      await loadData(true);
      return true;
    } catch (error) {
      console.error('Error reordering phases:', error);
      toast.error('Failed to reorder phases');
      return false;
    }
  };

  const reorderCategories = async (categoryIds: string[]) => {
    try {
      await ConsolidatedPhaseService.reorderCategories(categoryIds);
      toast.success('Category order updated');
      await loadData(true);
      return true;
    } catch (error) {
      console.error('Error reordering categories:', error);
      toast.error('Failed to reorder categories');
      return false;
    }
  };

  const createPhase = async (name: string, description?: string, categoryId?: string) => {
    if (!companyId) return false;

    try {
      await ConsolidatedPhaseService.createPhase(companyId, name, description, categoryId);
      toast.success(`Created phase "${name}"`);
      await loadData();
      return true;
    } catch (error) {
      console.error('Error creating phase:', error);
      toast.error('Failed to create phase');
      return false;
    }
  };

  const updatePhase = async (phaseId: string, updates: { name?: string; description?: string; category_id?: string; sub_section_id?: string | null; typical_duration_days?: number; duration_days?: number }) => {
    try {
      // Optimistically update local state to preserve current order
      setActivePhases(prev => prev.map(p => {
        if (p.id !== phaseId) return p;
        return {
          ...p,
          ...(updates.name !== undefined && { name: updates.name }),
          ...(updates.description !== undefined && { description: updates.description }),
          ...(updates.category_id !== undefined && { category_id: updates.category_id }),
          ...(updates.sub_section_id !== undefined && { sub_section_id: updates.sub_section_id }),
          ...(updates.duration_days !== undefined && { duration_days: updates.duration_days }),
          ...(updates.typical_duration_days !== undefined && { typical_duration_days: updates.typical_duration_days }),
        };
      }));

      await ConsolidatedPhaseService.updatePhase(phaseId, updates);
      toast.success('Phase updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating phase:', error);
      toast.error('Failed to update phase');
      // Revert on error by doing full reload
      await loadData();
      return false;
    }
  };

  const deletePhase = async (phaseId: string, phaseName: string) => {
    try {
      await ConsolidatedPhaseService.deletePhase(phaseId);
      toast.success(`Deleted phase "${phaseName}"`);
      await loadData();
      return true;
    } catch (error) {
      console.error('Error deleting phase:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete phase';
      toast.error(errorMessage);
      return false;
    }
  };

  const refreshCategories = async () => {
    if (!companyId) return;
    try {
      const categoriesData = await ConsolidatedPhaseService.getPhaseCategories(companyId);
      setCategories(categoriesData);
    } catch (err) {
      console.error('Error refreshing categories:', err);
    }
  };

  return {
    activePhases,
    availablePhases,
    categories,
    loading,
    error,
    loadData,
    refreshCategories,
    addPhaseToActive,
    removePhaseFromActive,
    reorderPhases,
    reorderCategories,
    createPhase,
    updatePhase,
    deletePhase
  };
}
