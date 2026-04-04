
import { useState, useEffect, useCallback } from 'react';
import { PhaseActivationService, type ActivePhase } from '@/services/phaseActivationService';

export function usePhaseActivation(companyId?: string) {
  const [activePhases, setActivePhases] = useState<ActivePhase[]>([]);
  const [availablePhases, setAvailablePhases] = useState<Array<{ id: string; name: string; description?: string; category_id?: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!companyId) {
      // console.log('[usePhaseActivation] No company ID provided');
      setLoading(false);
      setActivePhases([]);
      setAvailablePhases([]);
      return;
    }

    try {
      // console.log('[usePhaseActivation] Loading data for company:', companyId);
      setLoading(true);
      setError(null);
      
      const [activePhasesData, availablePhasesData] = await Promise.all([
        PhaseActivationService.getActivePhases(companyId),
        PhaseActivationService.getAvailablePhases(companyId)
      ]);
      
      // console.log('[usePhaseActivation] Data loaded successfully:', { activePhases: activePhasesData.length, availablePhases: availablePhasesData.length });
      
      setActivePhases(activePhasesData);
      setAvailablePhases(availablePhasesData);
    } catch (err) {
      console.error('[usePhaseActivation] Error loading phase activation data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activatePhase = useCallback(async (phaseId: string) => {
    if (!companyId) {
      console.error('[usePhaseActivation] Cannot activate phase: no company ID');
      return false;
    }

    // console.log('[usePhaseActivation] Activating phase:', phaseId);
    
    try {
      const success = await PhaseActivationService.activatePhase(companyId, phaseId);
      if (success) {
        // console.log('[usePhaseActivation] Phase activated successfully, refreshing data');
        await loadData(); // Refresh data after successful activation
      } else {
        // console.log('[usePhaseActivation] Phase activation failed');
      }
      return success;
    } catch (err) {
      console.error('[usePhaseActivation] Error activating phase:', err);
      return false;
    }
  }, [companyId, loadData]);

  const deactivatePhase = useCallback(async (phaseId: string) => {
    if (!companyId) {
      console.error('[usePhaseActivation] Cannot deactivate phase: no company ID');
      return false;
    }

    // console.log('[usePhaseActivation] Deactivating phase:', phaseId);

    try {
      const success = await PhaseActivationService.deactivatePhase(companyId, phaseId);
      if (success) {
        // console.log('[usePhaseActivation] Phase deactivated successfully, refreshing data');
        await loadData(); // Refresh data after successful deactivation
      } else {
        // console.log('[usePhaseActivation] Phase deactivation failed');
      }
      return success;
    } catch (err) {
      console.error('[usePhaseActivation] Error deactivating phase:', err);
      return false;
    }
  }, [companyId, loadData]);

  const reorderActivePhases = useCallback(async (phaseIds: string[]) => {
    if (!companyId) {
      console.error('[usePhaseActivation] Cannot reorder phases: no company ID');
      return false;
    }

    // console.log('[usePhaseActivation] Reordering phases:', phaseIds);

    try {
      const success = await PhaseActivationService.reorderActivePhases(companyId, phaseIds);
      if (success) {
        // console.log('[usePhaseActivation] Phases reordered successfully, refreshing data');
        await loadData(); // Refresh data after successful reorder
      } else {
        // console.log('[usePhaseActivation] Phase reordering failed');
      }
      return success;
    } catch (err) {
      console.error('[usePhaseActivation] Error reordering phases:', err);
      return false;
    }
  }, [companyId, loadData]);

  const standardizePhases = useCallback(async () => {
    if (!companyId) {
      console.error('[usePhaseActivation] Cannot standardize phases: no company ID');
      return false;
    }

    // console.log('[usePhaseActivation] Standardizing phases');

    try {
      const success = await PhaseActivationService.standardizePhases(companyId);
      if (success) {
        // console.log('[usePhaseActivation] Phases standardized successfully, refreshing data');
        await loadData(); // Refresh data after successful standardization
      } else {
        // console.log('[usePhaseActivation] Phase standardization failed');
      }
      return success;
    } catch (err) {
      console.error('[usePhaseActivation] Error standardizing phases:', err);
      return false;
    }
  }, [companyId, loadData]);

  const cleanupOrphanedPhases = useCallback(async () => {
    if (!companyId) {
      console.error('[usePhaseActivation] Cannot cleanup phases: no company ID');
      return { fixed: 0, errors: [] };
    }

    // console.log('[usePhaseActivation] Cleaning up orphaned phases');

    try {
      const result = await PhaseActivationService.cleanupOrphanedPhases(companyId);
      if (result.fixed > 0) {
        // console.log('[usePhaseActivation] Orphaned phases cleaned up, refreshing data');
        await loadData(); // Refresh data after cleanup
      }
      return result;
    } catch (err) {
      console.error('[usePhaseActivation] Error cleaning up orphaned phases:', err);
      return { fixed: 0, errors: [err instanceof Error ? err.message : 'Unknown error'] };
    }
  }, [companyId, loadData]);

  return {
    activePhases,
    availablePhases,
    loading,
    error,
    loadData,
    activatePhase,
    deactivatePhase,
    reorderActivePhases,
    standardizePhases,
    cleanupOrphanedPhases,
    refreshData: loadData
  };
}
