import { useState, useCallback } from 'react';
import { PhaseDependencyService, type PhaseDependency, type CreateDependencyData, type CalculatedPhaseDates } from '@/services/phaseDependencyService';
import { toast } from 'sonner';

export function usePhaseDependencies(companyId: string) {
  const [dependencies, setDependencies] = useState<PhaseDependency[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastCalculatedSchedule, setLastCalculatedSchedule] = useState<CalculatedPhaseDates[]>([]);

  const loadDependencies = useCallback(async () => {
    if (!companyId) return;
    
    setIsLoading(true);
    try {
      const result = await PhaseDependencyService.getDependencies(companyId);
      if (result.success) {
        setDependencies(result.dependencies);
      } else {
        toast.error(`Failed to load dependencies: ${result.error}`);
      }
    } catch (error) {
      console.error('[usePhaseDependencies] Error loading dependencies:', error);
      toast.error('Failed to load dependencies');
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  const createDependency = useCallback(async (data: CreateDependencyData) => {
    const result = await PhaseDependencyService.createDependency(data);
    if (result.success) {
      toast.success('Dependency created successfully');
      await loadDependencies();
    } else {
      // toast.error(`Failed to create dependency: ${result.error}`);
      console.error(`Failed to create dependency: ${result.error}`);
    }
    return result;
  }, [loadDependencies]);

  const updateDependency = useCallback(async (
    dependencyId: string,
    updates: Partial<Pick<PhaseDependency, 'dependency_type' | 'lag_days'>>
  ) => {
    const result = await PhaseDependencyService.updateDependency(dependencyId, updates);
    if (result.success) {
      toast.success('Dependency updated successfully');
      await loadDependencies();
    } else {
      toast.error(`Failed to update dependency: ${result.error}`);
    }
    return result;
  }, [loadDependencies]);

  const deleteDependency = useCallback(async (dependencyId: string) => {
    const result = await PhaseDependencyService.deleteDependency(dependencyId);
    if (result.success) {
      toast.success('Dependency deleted successfully');
      await loadDependencies();
    } else {
      toast.error(`Failed to delete dependency: ${result.error}`);
    }
    return result;
  }, [loadDependencies]);

  const calculateSchedule = useCallback(async () => {
    if (!companyId) return null;
    
    setIsLoading(true);
    try {
      const result = await PhaseDependencyService.calculateSchedule(companyId);
      if (result.success) {
        setLastCalculatedSchedule(result.schedule);
        return result.schedule;
      } else {
        toast.error(`Failed to calculate schedule: ${result.error}`);
        return null;
      }
    } catch (error) {
      console.error('[usePhaseDependencies] Error calculating schedule:', error);
      toast.error('Failed to calculate schedule');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  const applySchedule = useCallback(async () => {
    if (!companyId) return false;
    
    setIsLoading(true);
    try {
      const result = await PhaseDependencyService.applySchedule(companyId);
      if (result.success) {
        // Clear the calculated schedule since it's now applied
        setLastCalculatedSchedule([]);
      } else {
        toast.error(`Failed to apply schedule: ${result.error}`);
      }
      return result.success;
    } catch (error) {
      console.error('[usePhaseDependencies] Error applying schedule:', error);
      toast.error('Failed to apply schedule');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  const getPhaseDependencies = useCallback(async (phaseId: string) => {
    if (!phaseId || !companyId) {
      console.error('[usePhaseDependencies] Invalid phase ID or company ID provided');
      return { success: false, incoming: [], outgoing: [], error: 'Invalid phase ID or company ID' };
    }

    try {
      const result = await PhaseDependencyService.getPhaseDependencies(phaseId, companyId);
      return result;
    } catch (error) {
      console.error('[usePhaseDependencies] Error getting phase dependencies:', error);
      return { 
        success: false, 
        incoming: [], 
        outgoing: [], 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }, [companyId]);

  const getDependencyTypeLabel = PhaseDependencyService.getDependencyTypeLabel;
  const getDependencyTypeDescription = PhaseDependencyService.getDependencyTypeDescription;

  return {
    dependencies,
    isLoading,
    lastCalculatedSchedule,
    loadDependencies,
    createDependency,
    updateDependency,
    deleteDependency,
    calculateSchedule,
    applySchedule,
    getPhaseDependencies,
    getDependencyTypeLabel,
    getDependencyTypeDescription,
  };
}