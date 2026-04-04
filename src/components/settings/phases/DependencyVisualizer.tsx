import React, { useEffect, useCallback } from 'react';
import { usePhaseDependencies } from '@/hooks/usePhaseDependencies';
import { ConsolidatedPhase } from '@/services/consolidatedPhaseService';

interface DependencyDataHookProps {
  phases: ConsolidatedPhase[];
  companyId: string;
}

export function useDependencyData({ phases, companyId }: DependencyDataHookProps) {
  const { dependencies, loadDependencies } = usePhaseDependencies(companyId);

  useEffect(() => {
    loadDependencies();
  }, [loadDependencies]);

  const getUpstreamDependencies = useCallback((phaseId: string) => {
    if (!dependencies || dependencies.length === 0) {
      return [];
    }

    return dependencies
      .filter(dep => dep.target_phase_id === phaseId)
      .map(dep => {
        const sourcePhase = phases.find(p => p.id === dep.source_phase_id);
        return {
          phaseName: sourcePhase?.name || 'Unknown Phase',
          dependencyType: dep.dependency_type,
          lagDays: dep.lag_days
        };
      });
  }, [dependencies, phases]);

  return { getUpstreamDependencies };
}