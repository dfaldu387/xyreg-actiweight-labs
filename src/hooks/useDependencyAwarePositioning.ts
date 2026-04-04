import { useState, useCallback, useEffect } from 'react';
import { usePhaseDependencies } from './usePhaseDependencies';
import { addDays, differenceInDays, max } from 'date-fns';
import { toast } from 'sonner';

export interface PhasePosition {
  id: string;
  startDate: Date;
  endDate: Date;
  position: number;
}

export interface DependencyAdjustment {
  phaseId: string;
  originalStart: Date;
  originalEnd: Date;
  adjustedStart: Date;
  adjustedEnd: Date;
  reason: string;
}

export function useDependencyAwarePositioning(companyId: string, productId?: string) {
  const { dependencies, loadDependencies } = usePhaseDependencies(companyId);
  const [isAdjusting, setIsAdjusting] = useState(false);

  // Load dependencies when companyId changes
  useEffect(() => {
    if (companyId) {
      console.log('[useDependencyAwarePositioning] Loading company dependencies for company:', companyId);
      loadDependencies();
    }
  }, [companyId, loadDependencies]);

  // Debug log when dependencies change
  useEffect(() => {
    console.log('[useDependencyAwarePositioning] Dependencies loaded:', dependencies.length, dependencies);
  }, [dependencies]);

  // Calculate automatic adjustments based on dependencies
  const calculateDependencyAdjustments = useCallback((
    movedPhaseId: string,
    newStartDate: Date,
    newEndDate: Date,
    allPhases: PhasePosition[]
  ): DependencyAdjustment[] => {
    if (dependencies.length === 0) {
      return []; // No dependencies, no adjustments needed
    }

    const adjustments: DependencyAdjustment[] = [];
    const processedPhases = new Set<string>();
    
    // Create a map for quick phase lookup
    const phaseMap = new Map(allPhases.map(p => [p.id, { ...p }]));
    
    // Update the moved phase
    const movedPhase = phaseMap.get(movedPhaseId);
    if (movedPhase) {
      movedPhase.startDate = newStartDate;
      movedPhase.endDate = newEndDate;
    }

    // Recursive function to adjust dependent phases
    const adjustDependentPhases = (sourcePhaseId: string) => {
      if (processedPhases.has(sourcePhaseId)) return;
      processedPhases.add(sourcePhaseId);

      const sourcePhase = phaseMap.get(sourcePhaseId);
      if (!sourcePhase) return;

      // Find all phases that depend on this source phase
      const dependentPhases = dependencies.filter(dep => 
        dep.source_phase_id === sourcePhaseId && dep.dependency_type === 'finish_to_start'
      );

      dependentPhases.forEach(dep => {
        const targetPhase = phaseMap.get(dep.target_phase_id);
        if (!targetPhase) return;

        const originalStart = new Date(targetPhase.startDate);
        const originalEnd = new Date(targetPhase.endDate);
        
        // Calculate new start date based on dependency
        let newDependentStart: Date;
        const lagDays = dep.lag_days || 0;

        switch (dep.dependency_type) {
          case 'finish_to_start':
            newDependentStart = addDays(sourcePhase.endDate, lagDays + 1);
            break;
          case 'start_to_start':
            newDependentStart = addDays(sourcePhase.startDate, lagDays);
            break;
          case 'finish_to_finish':
            // Keep original start, adjust end to match finish dependency
            const duration = differenceInDays(originalEnd, originalStart);
            const newDependentEnd = addDays(sourcePhase.endDate, lagDays);
            newDependentStart = addDays(newDependentEnd, -duration);
            break;
          case 'start_to_finish':
            // Rarely used, but handle it
            const dependentDuration = differenceInDays(originalEnd, originalStart);
            newDependentStart = addDays(sourcePhase.startDate, lagDays - dependentDuration);
            break;
          default:
            return;
        }

        // Only adjust if the new start is later than current (avoid moving backwards)
        if (newDependentStart > originalStart) {
          const phaseDuration = differenceInDays(originalEnd, originalStart);
          const newDependentEnd = addDays(newDependentStart, phaseDuration);

          adjustments.push({
            phaseId: dep.target_phase_id,
            originalStart,
            originalEnd,
            adjustedStart: newDependentStart,
            adjustedEnd: newDependentEnd,
            reason: `Dependency: must start after ${sourcePhaseId} ends`
          });

          // Update the phase in our map for further dependency calculations
          targetPhase.startDate = newDependentStart;
          targetPhase.endDate = newDependentEnd;

          // Recursively adjust phases that depend on this one
          adjustDependentPhases(dep.target_phase_id);
        }
      });
    };

    // Start the adjustment cascade from the moved phase
    adjustDependentPhases(movedPhaseId);

    return adjustments;
  }, [dependencies]);

  // Apply dependency-aware positioning
  const applyDependencyAdjustments = useCallback(async (
    adjustments: DependencyAdjustment[],
    onBatchUpdate: (updates: Array<{ phaseId: string; startDate: Date; endDate: Date }>) => Promise<boolean>
  ): Promise<boolean> => {
    if (adjustments.length === 0) return true;

    setIsAdjusting(true);
    try {
      const updates = adjustments.map(adj => ({
        phaseId: adj.phaseId,
        startDate: adj.adjustedStart,
        endDate: adj.adjustedEnd
      }));

      console.log('[useDependencyAwarePositioning] Applying dependency adjustments:', updates.length);
      const success = await onBatchUpdate(updates);

      if (success) {
        const adjustedCount = adjustments.length;
        toast.success(
          `Automatically adjusted ${adjustedCount} dependent phase${adjustedCount > 1 ? 's' : ''} based on dependencies`,
          {
            description: adjustments.map(adj => adj.reason).join(', ')
          }
        );
      } else {
        toast.error('Failed to apply dependency adjustments');
      }

      return success;
    } catch (error) {
      console.error('[useDependencyAwarePositioning] Error applying adjustments:', error);
      toast.error('Error applying dependency adjustments');
      return false;
    } finally {
      setIsAdjusting(false);
    }
  }, []);

  // Main function to handle phase moves with dependency awareness
  const handlePhaseMoveWithDependencies = useCallback(async (
    movedPhaseId: string,
    newStartDate: Date,
    newEndDate: Date,
    allPhases: PhasePosition[],
    onBatchUpdate: (updates: Array<{ phaseId: string; startDate: Date; endDate: Date }>) => Promise<boolean>
  ): Promise<boolean> => {
    // First, calculate what adjustments are needed
    const adjustments = calculateDependencyAdjustments(
      movedPhaseId,
      newStartDate, 
      newEndDate,
      allPhases
    );

    console.log('[useDependencyAwarePositioning] Calculated adjustments:', adjustments);

    // Apply the original move plus any dependency adjustments
    const allUpdates = [
      {
        phaseId: movedPhaseId,
        startDate: newStartDate,
        endDate: newEndDate
      },
      ...adjustments.map(adj => ({
        phaseId: adj.phaseId,
        startDate: adj.adjustedStart,
        endDate: adj.adjustedEnd
      }))
    ];

    return await onBatchUpdate(allUpdates);
  }, [calculateDependencyAdjustments]);

  // Validate if a move would violate dependencies
  const validatePhaseMove = useCallback((
    phaseId: string,
    newStartDate: Date,
    newEndDate: Date,
    allPhases: PhasePosition[]
  ): { isValid: boolean; violations: string[] } => {
    const violations: string[] = [];

    // Check if this move would violate any incoming dependencies
    const incomingDeps = dependencies.filter(dep => dep.target_phase_id === phaseId);
    
    incomingDeps.forEach(dep => {
      const sourcePhase = allPhases.find(p => p.id === dep.source_phase_id);
      if (!sourcePhase) return;

      const lagDays = dep.lag_days || 0;

      switch (dep.dependency_type) {
        case 'finish_to_start':
          const requiredStart = addDays(sourcePhase.endDate, lagDays + 1);
          if (newStartDate < requiredStart) {
            violations.push(`Cannot start before ${dep.source_phase_id} finishes`);
          }
          break;
        case 'start_to_start':
          const requiredStartFromStart = addDays(sourcePhase.startDate, lagDays);
          if (newStartDate < requiredStartFromStart) {
            violations.push(`Cannot start before ${dep.source_phase_id} starts`);
          }
          break;
        // Add other dependency type validations as needed
      }
    });

    return {
      isValid: violations.length === 0,
      violations
    };
  }, [dependencies]);

  return {
    isAdjusting,
    dependencies,
    calculateDependencyAdjustments,
    applyDependencyAdjustments,
    handlePhaseMoveWithDependencies,
    validatePhaseMove,
    loadDependencies
  };
}
