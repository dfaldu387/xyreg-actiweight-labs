/**
 * useGanttPhaseUpdate Hook
 * 
 * Custom hook to manage phase updates from Gantt chart interactions.
 * Handles debouncing, toast notifications, and operation detection.
 */

import { useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { GanttPhaseUpdateService, PhaseUpdateData } from '@/services/ganttPhaseUpdateService';
import { 
  calculateDuration, 
  detectOperationType, 
  generateSuccessMessage,
  calculateCascadingUpdates
} from '@/utils/ganttUtils';
import { GanttLink, ProductPhase } from '@/types/ganttChart';

export interface UpdateTaskEvent {
  id: string | number;
  task: Partial<{
    start: Date;
    end: Date;
    text: string;
  }>;
}

export function useGanttPhaseUpdate() {
  // Track active toast IDs to dismiss old ones
  const activeToastsRef = useRef<Record<string, string | number>>({});
  
  // Track original phase durations to detect resize vs move
  const phaseDurationsRef = useRef<Record<string, number>>({});
  
  // Track update timeouts for debouncing
  const updateTimeoutsRef = useRef<Record<string, NodeJS.Timeout>>({});

  /**
   * Initialize phase duration tracking
   */
  const initializePhaseDuration = useCallback((phaseId: string, duration: number) => {
    if (!phaseDurationsRef.current[phaseId]) {
      phaseDurationsRef.current[phaseId] = duration;
    }
  }, []);

  /**
   * Get stored phase duration
   */
  const getPhaseDuration = useCallback((phaseId: string): number | undefined => {
    return phaseDurationsRef.current[phaseId];
  }, []);

  /**
   * Update stored phase duration after successful resize
   */
  const updatePhaseDuration = useCallback((phaseId: string, newDuration: number) => {
    phaseDurationsRef.current[phaseId] = newDuration;
  }, []);

  /**
   * Dismiss any existing toast for a phase
   */
  const dismissPhaseToast = useCallback((phaseId: string) => {
    if (activeToastsRef.current[phaseId]) {
      toast.dismiss(activeToastsRef.current[phaseId]);
      delete activeToastsRef.current[phaseId];
    }
  }, []);

  /**
   * Show success toast for phase update
   */
  const showSuccessToast = useCallback((
    phaseId: string,
    phaseName: string,
    operationType: 'resize' | 'move',
    duration?: number
  ) => {
    dismissPhaseToast(phaseId);
    
    const message = generateSuccessMessage(phaseName, operationType, duration);
    const toastId = toast.success(message);
    activeToastsRef.current[phaseId] = toastId;
    
    // Auto-cleanup toast reference
    setTimeout(() => {
      delete activeToastsRef.current[phaseId];
    }, 3000);
  }, [dismissPhaseToast]);

  /**
   * Show error toast for phase update
   */
  const showErrorToast = useCallback((phaseId: string, errorMessage: string) => {
    dismissPhaseToast(phaseId);
    
    const toastId = toast.error(errorMessage);
    activeToastsRef.current[phaseId] = toastId;
    
    // Auto-cleanup toast reference
    setTimeout(() => {
      delete activeToastsRef.current[phaseId];
    }, 3000);
  }, [dismissPhaseToast]);

  /**
   * Execute debounced phase update WITHOUT cascading
   * (Kept for backward compatibility)
   */
  const schedulePhaseUpdate = useCallback((
    phaseId: string,
    phaseName: string,
    startDate: Date,
    endDate: Date,
    debounceMs: number = 500
  ) => {
    // Clear any existing timeout
    if (updateTimeoutsRef.current[phaseId]) {
      clearTimeout(updateTimeoutsRef.current[phaseId]);
    }

    // Dismiss any existing toast to prevent duplicates
    dismissPhaseToast(phaseId);

    // Schedule the update
    const timeoutId = setTimeout(async () => {
      // Calculate duration
      const newDuration = calculateDuration(startDate, endDate);
      
      // Detect operation type
      const originalDuration = phaseDurationsRef.current[phaseId];
      const operationType = originalDuration 
        ? detectOperationType(originalDuration, newDuration)
        : 'resize';

      console.log('[useGanttPhaseUpdate] Executing update:', {
        phaseId,
        phaseName,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        duration: newDuration,
        operationType,
      });

      // Execute database update
      const result = await GanttPhaseUpdateService.updatePhaseDates(
        phaseId,
        startDate,
        endDate
      );

      if (result.success) {
        // Show success toast
        showSuccessToast(phaseId, phaseName, operationType, newDuration);
        
        // Update stored duration if it was a resize
        if (operationType === 'resize') {
          updatePhaseDuration(phaseId, newDuration);
        }
      } else {
        // Show error toast
        showErrorToast(
          phaseId,
          result.error || 'Failed to update phase dates'
        );
      }

      // Cleanup timeout reference
      delete updateTimeoutsRef.current[phaseId];
    }, debounceMs);

    // Store timeout reference
    updateTimeoutsRef.current[phaseId] = timeoutId;
  }, [dismissPhaseToast, showSuccessToast, showErrorToast, updatePhaseDuration]);

  /**
   * Execute debounced phase update WITH CASCADING to dependent phases
   * This is the main function that handles automatic cascade updates
   */
  const schedulePhaseUpdateWithCascading = useCallback((
    phaseId: string,
    phaseName: string,
    startDate: Date,
    endDate: Date,
    links: GanttLink[],
    allPhases: ProductPhase[],
    onSuccess?: () => void,
    debounceMs: number = 500
  ) => {
    // Clear any existing timeout for this phase
    if (updateTimeoutsRef.current[phaseId]) {
      clearTimeout(updateTimeoutsRef.current[phaseId]);
    }

    // Dismiss any existing toast to prevent duplicates
    dismissPhaseToast(phaseId);

    // Schedule the update with debouncing
    const timeoutId = setTimeout(async () => {
      try {
        // Calculate duration of the changed phase
        const newDuration = calculateDuration(startDate, endDate);
        
        // Detect operation type (move vs resize)
        const originalDuration = phaseDurationsRef.current[phaseId];
        const operationType = originalDuration 
          ? detectOperationType(originalDuration, newDuration)
          : 'resize';

        console.log('[useGanttPhaseUpdate] 🚀 Executing cascading update:', {
          phaseId,
          phaseName,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          duration: newDuration,
          operationType,
          totalPhases: allPhases.length,
          totalLinks: links.length
        });

        // Find the changed phase in the phases array
        const changedPhase = allPhases.find(p => p.id === phaseId);
        if (!changedPhase) {
          console.error('[useGanttPhaseUpdate] ❌ Changed phase not found:', phaseId);
          showErrorToast(phaseId, 'Phase not found');
          return;
        }

        // Calculate cascading updates for dependent phases
        const cascadingUpdates = calculateCascadingUpdates(
          changedPhase,
          startDate,
          endDate,
          links,
          allPhases
        );

        console.log(`[useGanttPhaseUpdate] 📊 Found ${cascadingUpdates.length} dependent phases to update`);

        // Prepare batch updates (primary phase + all cascading phases)
        const batchUpdates: PhaseUpdateData[] = [
          { 
            phaseId, 
            startDate, 
            endDate 
          }
        ];

        // Add all cascading updates to the batch
        cascadingUpdates.forEach(update => {
          batchUpdates.push({
            phaseId: update.phaseId,
            startDate: update.newStartDate,
            endDate: update.newEndDate,
          });
          
          console.log(`[useGanttPhaseUpdate] 📅 Cascading: ${update.phaseName} (${update.linkType})`);
        });

        // Execute batch update
        console.log(`[useGanttPhaseUpdate] 💾 Executing batch update for ${batchUpdates.length} phases...`);
        const result = await GanttPhaseUpdateService.batchUpdatePhasesWithCascading(batchUpdates);

        if (result.successful > 0) {
          console.log(`[useGanttPhaseUpdate] ✅ Successfully updated ${result.successful} phases`);
          
          // Show appropriate success toast
          let toastMessage: string;
          if (cascadingUpdates.length > 0) {
            toastMessage = `Updated ${phaseName} and ${cascadingUpdates.length} dependent phase(s)`;
          } else {
            toastMessage = generateSuccessMessage(phaseName, operationType, newDuration);
          }
          
          dismissPhaseToast(phaseId);
          const toastId = toast.success(toastMessage, {
            duration: 4000, // Show longer for cascading updates
          });
          activeToastsRef.current[phaseId] = toastId;
          
          // Auto-cleanup toast reference
          setTimeout(() => {
            delete activeToastsRef.current[phaseId];
          }, 4000);
          
          // Update stored duration if it was a resize
          if (operationType === 'resize') {
            updatePhaseDuration(phaseId, newDuration);
          }
          
          // Update durations for cascaded phases too
          cascadingUpdates.forEach(update => {
            const updatedDuration = calculateDuration(update.newStartDate, update.newEndDate);
            updatePhaseDuration(update.phaseId, updatedDuration);
          });

          // Trigger UI refresh callback with a small delay to ensure database has committed
          if (onSuccess) {
            console.log('[useGanttPhaseUpdate] 🔄 Triggering UI refresh callback');
            setTimeout(() => {
              onSuccess();
            }, 300); // Small delay for database commit + smooth transition
          }
        } else {
          console.error('[useGanttPhaseUpdate] ❌ All updates failed');
          showErrorToast(phaseId, 'Failed to update phase dates');
        }

        // Show warning if some updates failed
        if (result.failed > 0) {
          console.warn(`[useGanttPhaseUpdate] ⚠️ ${result.failed} phases failed to update:`, result.errors);
          toast.warning(`${result.successful} phases updated, ${result.failed} failed`, {
            duration: 5000,
          });
        }

      } catch (error) {
        console.error('[useGanttPhaseUpdate] ❌ Unexpected error during cascading update:', error);
        showErrorToast(phaseId, 'An unexpected error occurred');
      } finally {
        // Cleanup timeout reference
        delete updateTimeoutsRef.current[phaseId];
      }
    }, debounceMs);

    // Store timeout reference
    updateTimeoutsRef.current[phaseId] = timeoutId;
  }, [dismissPhaseToast, showSuccessToast, showErrorToast, updatePhaseDuration]);

  /**
   * Cancel all pending updates
   */
  const cancelAllUpdates = useCallback(() => {
    Object.values(updateTimeoutsRef.current).forEach((timeoutId) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    });
    updateTimeoutsRef.current = {};
  }, []);

  /**
   * Cancel specific phase update
   */
  const cancelPhaseUpdate = useCallback((phaseId: string) => {
    if (updateTimeoutsRef.current[phaseId]) {
      clearTimeout(updateTimeoutsRef.current[phaseId]);
      delete updateTimeoutsRef.current[phaseId];
    }
  }, []);

  return {
    // Phase duration tracking
    initializePhaseDuration,
    getPhaseDuration,
    updatePhaseDuration,
    
    // Toast management
    dismissPhaseToast,
    showSuccessToast,
    showErrorToast,
    
    // Update scheduling
    schedulePhaseUpdate,
    schedulePhaseUpdateWithCascading,
    cancelPhaseUpdate,
    cancelAllUpdates,
  };
}

