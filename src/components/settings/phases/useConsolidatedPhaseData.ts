
import React, { useState, useCallback } from "react";
import { ConsolidatedPhaseDataService, Phase, PhaseCategory } from "./ConsolidatedPhaseDataService";
import { ConsolidatedPhaseService } from "@/services/consolidatedPhaseService";
import { DefaultPhaseDatingService } from "@/services/defaultPhaseDatingService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useConsolidatedPhaseData(companyId?: string) {
  const [phases, setPhases] = useState<Phase[]>([]);
  const [availablePhases, setAvailablePhases] = useState<Phase[]>([]);
  const [categories, setCategories] = useState<PhaseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  const refreshData = useCallback(async (silent = false) => {
    if (!companyId) {
      setLoading(false);
      return;
    }

    try {
      // Only show loading spinner if not a silent refresh
      if (!silent) {
        setLoading(true);
      }
      setLoadingError(null);

      const [phasesData, categoriesData] = await Promise.all([
        ConsolidatedPhaseDataService.loadPhases(companyId),
        ConsolidatedPhaseDataService.loadCategories(companyId)
      ]);

      setPhases(phasesData.activePhases);
      setAvailablePhases(phasesData.availablePhases);
      setCategories(categoriesData);

      // Recalculate cumulative day starts to ensure they're up to date
      await ConsolidatedPhaseService.recalculateCumulativeDayStarts(companyId);
    } catch (error) {
      console.error('[useConsolidatedPhaseData] Error loading data:', error);
      setLoadingError(error instanceof Error ? error.message : 'Failed to load phase data');
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [companyId]);

  React.useEffect(() => {
    refreshData();
  }, [refreshData]);

  const addPhase = useCallback(async (phaseId: string) => {
    if (!companyId) return;

    try {
      // Find the phase in availablePhases
      const phaseToAdd = availablePhases.find(p => p.id === phaseId);
      if (!phaseToAdd) {
        toast.error('Phase not found');
        return;
      }

      // Optimistically update local state (no loading spinner)
      const newPosition = phases.length > 0 ? Math.max(...phases.map(p => p.position)) + 1 : 0;
      const updatedPhase = { ...phaseToAdd, position: newPosition, is_active: true };

      setPhases(prev => [...prev, updatedPhase]);
      setAvailablePhases(prev => prev.filter(p => p.id !== phaseId));

      // Persist to database
      await ConsolidatedPhaseDataService.addPhaseToActive(companyId, phaseId);
      toast.success('Phase added to active phases');
    } catch (error) {
      console.error('Error adding phase:', error);
      toast.error('Failed to add phase');
      // Revert on error by refreshing data
      await refreshData();
    }
  }, [companyId, phases, availablePhases, refreshData]);

  const addPhaseAggrid = useCallback(async (phaseId: string) => {
    if (!companyId) return;

    try {
      // Find the phase in availablePhases
      const phaseToAdd = availablePhases.find(p => p.id === phaseId);
      if (!phaseToAdd) {
        toast.error('Phase not found');
        return;
      }

      // Optimistically update local state (no loading spinner)
      const newPosition = phases.length > 0 ? Math.max(...phases.map(p => p.position)) + 1 : 0;
      const updatedPhase = { ...phaseToAdd, position: newPosition, is_active: true };

      setPhases(prev => [...prev, updatedPhase]);
      setAvailablePhases(prev => prev.filter(p => p.id !== phaseId));

      // Persist to database
      await ConsolidatedPhaseDataService.addPhaseToActive(companyId, phaseId);
      toast.success('Phase added to active phases');
    } catch (error) {
      console.error('Error adding phase:', error);
      toast.error('Failed to add phase');
      // Revert on error by refreshing data
      await refreshData();
    }
  }, [companyId, phases, availablePhases, refreshData]);

  const removePhase = useCallback(async (phaseId: string, phaseName: string) => {
    if (!companyId) return;

    try {
      // Find the phase in active phases
      const phaseToRemove = phases.find(p => p.id === phaseId);
      if (!phaseToRemove) {
        toast.error('Phase not found');
        return;
      }

      // Optimistically update local state (no loading spinner)
      const removedPhase = { ...phaseToRemove, is_active: false };

      setPhases(prev => prev.filter(p => p.id !== phaseId));
      setAvailablePhases(prev => [...prev, removedPhase].sort((a, b) => a.position - b.position));

      // Persist to database
      await ConsolidatedPhaseDataService.removePhaseFromActive(companyId, phaseId);
      toast.success(`Removed "${phaseName}" from active phases`);
    } catch (error) {
      console.error('Error removing phase:', error);
      toast.error('Failed to remove phase');
      // Revert on error by refreshing data
      await refreshData();
    }
  }, [companyId, phases, refreshData]);

  const removePhaseAggrid = useCallback(async (phaseId: string, phaseName: string) => {
    if (!companyId) return;

    try {
      // Find the phase in active phases
      const phaseToRemove = phases.find(p => p.id === phaseId);
      if (!phaseToRemove) {
        toast.error('Phase not found');
        return;
      }

      // Optimistically update local state (no loading spinner)
      const removedPhase = { ...phaseToRemove, is_active: false };

      setPhases(prev => prev.filter(p => p.id !== phaseId));
      setAvailablePhases(prev => [...prev, removedPhase].sort((a, b) => a.position - b.position));

      // Persist to database
      await ConsolidatedPhaseDataService.removePhaseFromActive(companyId, phaseId);
      toast.success(`Removed "${phaseName}" from active phases`);
    } catch (error) {
      console.error('Error removing phase:', error);
      toast.error('Failed to remove phase');
      // Revert on error by refreshing data
      await refreshData();
    }
  }, [companyId, phases, refreshData]);
  const movePhase = useCallback(async (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || toIndex < 0 || toIndex >= phases.length) return;

    const newPhases = [...phases];
    const [movedPhase] = newPhases.splice(fromIndex, 1);
    newPhases.splice(toIndex, 0, movedPhase);

    // Optimistically update local state (no loading spinner)
    setPhases(newPhases);

    try {
      await ConsolidatedPhaseDataService.reorderPhases(companyId!, newPhases);
      toast.success('Phase order updated');
    } catch (error) {
      console.error('Error reordering phases:', error);
      toast.error('Failed to reorder phases');
      // Revert on error by refreshing data
      await refreshData();
    }
  }, [phases, companyId, refreshData]);

  const reorderPhases = useCallback(async (fromIndex: number, toIndex: number) => {
    await movePhase(fromIndex, toIndex);
  }, [movePhase]);

  const editPhase = useCallback(async (phaseId: string, updates: { name?: string; description?: string; categoryId?: string; compliance_section_ids?: string[] }) => {
    try {
      // Optimistically update local state (no loading spinner)
      const updatePhaseInList = (phaseList: Phase[]) =>
        phaseList.map(p => {
          if (p.id !== phaseId) return p;
          return {
            ...p,
            name: updates.name ?? p.name,
            description: updates.description ?? p.description,
            category_id: updates.categoryId ?? p.category_id,
          };
        });

      setPhases(prev => updatePhaseInList(prev));
      setAvailablePhases(prev => updatePhaseInList(prev));

      // Persist to database
      await ConsolidatedPhaseService.updatePhase(phaseId, {
        name: updates.name,
        description: updates.description,
        category_id: updates.categoryId,
      });
      toast.success('Phase updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating phase:', error);
      toast.error('Failed to update phase');
      // Revert on error by refreshing data
      await refreshData();
      return false;
    }
  }, [refreshData]);
  const editPhaseAggrid = useCallback(async (phaseId: string, updates: {
    name?: string;
    description?: string;
    categoryId?: string;
    typical_start_day?: number | null;
    typical_duration_days?: number | null;
    duration_days?: number;
    start_percentage?: number;
    end_percentage?: number;
    is_continuous_process?: boolean;
    start_phase_id?: string | null;
    end_phase_id?: string | null;
    start_position?: string | null;
    end_position?: string | null;
  }) => {
    try {
      console.log('[useConsolidatedPhaseData] editPhaseAggrid called with:', { phaseId, updates });

      // Optimistically update local state (no loading spinner)
      const updatePhaseInList = (phaseList: Phase[]) =>
        phaseList.map(p => {
          if (p.id !== phaseId) return p;
          return {
            ...p,
            name: updates.name ?? p.name,
            description: updates.description ?? p.description,
            category_id: updates.categoryId ?? p.category_id,
            duration_days: updates.duration_days ?? p.duration_days,
            typical_start_day: updates.typical_start_day !== undefined ? updates.typical_start_day : (p as any).typical_start_day,
            typical_duration_days: updates.typical_duration_days !== undefined ? updates.typical_duration_days : (p as any).typical_duration_days,
            start_percentage: updates.start_percentage ?? p.start_percentage,
            end_percentage: updates.end_percentage ?? p.end_percentage,
          };
        });

      setPhases(prev => updatePhaseInList(prev));
      setAvailablePhases(prev => updatePhaseInList(prev));

      // Persist to database
      await ConsolidatedPhaseService.updatePhase(phaseId, {
        name: updates.name,
        description: updates.description,
        category_id: updates.categoryId,
        typical_start_day: updates.typical_start_day,
        typical_duration_days: updates.typical_duration_days,
        duration_days: updates.duration_days,
        start_percentage: updates.start_percentage,
        end_percentage: updates.end_percentage,

        start_phase_id: updates.start_phase_id,
        end_phase_id: updates.end_phase_id,
        start_position: updates.start_position,
        end_position: updates.end_position
      });

      // If timing settings were changed, recalculate timeline for all products using this phase
      if (updates.start_percentage !== undefined || updates.end_percentage !== undefined) {
        await recalculateTimelinesForPhase(phaseId);
      }

      toast.success('Phase updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating phase:', error);
      toast.error('Failed to update phase');
      // Revert on error by refreshing data
      await refreshData();
      return false;
    }
  }, [refreshData]);

  const recalculateTimelinesForPhase = useCallback(async (phaseId: string) => {
    try {
      // Find all products that use this phase
      const { data: products } = await supabase
        .from('lifecycle_phases')
        .select('product_id')
        .eq('phase_id', phaseId);

      if (products && products.length > 0) {
        const uniqueProductIds = [...new Set(products.map(p => p.product_id))];

        // Recalculate timeline for each product
        for (const productId of uniqueProductIds) {
          await DefaultPhaseDatingService.initializeDefaultTimeline(productId);
        }

        console.log(`Recalculated timelines for ${uniqueProductIds.length} products`);
      }
    } catch (error) {
      console.error('Error recalculating timelines:', error);
    }
  }, []);

  return {
    phases,
    availablePhases,
    categories,
    loading,
    loadingError,
    refreshData,
    addPhase,
    removePhase,
    movePhase,
    reorderPhases,
    editPhase,
    addPhaseAggrid,
    removePhaseAggrid,
    editPhaseAggrid
  };
}
