
import { useState, useCallback } from 'react';
import { addDays, differenceInDays } from 'date-fns';
import { toast } from 'sonner';

export interface PhaseForAutoSequencing {
  id: string;
  startDate?: Date;
  endDate?: Date;
  position: number;
  typical_start_day?: number;
  typical_duration_days?: number;
  is_continuous_process?: boolean;
}

export interface AutoSequenceUpdate {
  id: string;
  startDate: Date;
  endDate: Date;
}

export interface AutoSequencePreview {
  original: PhaseForAutoSequencing;
  updated: AutoSequenceUpdate;
  durationDays: number;
}

export function useAutoSequencing() {
  const [isApplying, setIsApplying] = useState(false);
  const [previewData, setPreviewData] = useState<AutoSequencePreview[] | null>(null);

  const calculateAutoSequence = useCallback((phases: PhaseForAutoSequencing[]): AutoSequenceUpdate[] => {
    console.log('[useAutoSequencing] Calculating enhanced auto-sequence for phases:', phases.length);
    
    const sortedPhases = [...phases].sort((a, b) => a.position - b.position);
    const updates: AutoSequenceUpdate[] = [];
    
    // Separate linear and continuous phases
    const linearPhases = sortedPhases.filter(p => !p.is_continuous_process);
    const continuousPhases = sortedPhases.filter(p => p.is_continuous_process);
    
    console.log('[useAutoSequencing] Linear phases:', linearPhases.length, 'Continuous phases:', continuousPhases.length);
    
    // Find the earliest start date among linear phases with dates, or use today as fallback
    let currentStartDate = new Date();
    const linearPhasesWithDates = linearPhases.filter(p => p.startDate);
    if (linearPhasesWithDates.length > 0) {
      currentStartDate = new Date(Math.min(...linearPhasesWithDates.map(p => p.startDate!.getTime())));
    }
    
    // Store the linear project start date for continuous phase calculations
    const linearProjectStartDate = new Date(currentStartDate);
    
    console.log('[useAutoSequencing] Starting linear sequence from:', currentStartDate.toISOString().split('T')[0]);
    
    // Process linear phases sequentially (existing logic)
    let projectEndDate = currentStartDate;
    
    linearPhases.forEach((phase, index) => {
      // Calculate duration - use existing duration if available, otherwise default to 14 days
      let duration = 14; // Default 2 weeks
      if (phase.startDate && phase.endDate) {
        duration = Math.max(1, differenceInDays(phase.endDate, phase.startDate));
      } else if (phase.typical_duration_days) {
        duration = phase.typical_duration_days;
      }
      
      const endDate = addDays(currentStartDate, duration);
      projectEndDate = endDate; // Track the overall project end
      
      console.log(`[useAutoSequencing] Linear Phase ${index + 1}:`, {
        name: phase.id,
        originalDuration: phase.startDate && phase.endDate ? differenceInDays(phase.endDate, phase.startDate) : 'none',
        calculatedDuration: duration,
        startDate: currentStartDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      });
      
      updates.push({
        id: phase.id,
        startDate: new Date(currentStartDate),
        endDate: endDate
      });
      
      // Next phase starts the day after this one ends
      currentStartDate = addDays(endDate, 1);
    });
    
    // Calculate scaling factor based on linear phases only
    const originalProjectDuration = 795; // Typical total project duration from notes
    const newLinearProjectDuration = differenceInDays(projectEndDate, linearProjectStartDate);
    const scalingFactor = newLinearProjectDuration > 0 ? newLinearProjectDuration / originalProjectDuration : 1;
    
    console.log('[useAutoSequencing] Project scaling:', {
      originalDuration: originalProjectDuration,
      newLinearDuration: newLinearProjectDuration,
      scalingFactor: scalingFactor
    });
    
    // Skip continuous phases entirely - they should not be affected by auto-sequencing
    console.log(`[useAutoSequencing] Skipping ${continuousPhases.length} continuous phases - only linear phases are auto-sequenced`);
    
    console.log('[useAutoSequencing] Generated enhanced updates:', updates.length);
    return updates;
  }, []);

  const generatePreview = useCallback((phases: PhaseForAutoSequencing[]): AutoSequencePreview[] => {
    const updates = calculateAutoSequence(phases);
    
    return updates.map(update => {
      const originalPhase = phases.find(p => p.id === update.id)!;
      const durationDays = differenceInDays(update.endDate, update.startDate);
      
      return {
        original: originalPhase,
        updated: update,
        durationDays
      };
    });
  }, [calculateAutoSequence]);

  const applyAutoSequence = useCallback(async (
    phases: PhaseForAutoSequencing[],
    onBatchUpdate: (updates: AutoSequenceUpdate[]) => Promise<boolean>
  ): Promise<boolean> => {
    if (isApplying) return false;
    
    setIsApplying(true);
    try {
      console.log('[useAutoSequencing] Applying auto-sequence to phases:', phases.length);
      
      const updates = calculateAutoSequence(phases);
      const success = await onBatchUpdate(updates);
      
      if (success) {
        toast.success(`Auto-sequenced ${updates.length} phases successfully`);
        setPreviewData(null);
      } else {
        toast.error('Failed to apply auto-sequencing');
      }
      
      return success;
    } catch (error) {
      console.error('[useAutoSequencing] Error applying auto-sequence:', error);
      toast.error('Error applying auto-sequencing');
      return false;
    } finally {
      setIsApplying(false);
    }
  }, [isApplying, calculateAutoSequence]);

  const showPreview = useCallback((phases: PhaseForAutoSequencing[]) => {
    const preview = generatePreview(phases);
    setPreviewData(preview);
    return preview;
  }, [generatePreview]);

  const clearPreview = useCallback(() => {
    setPreviewData(null);
  }, []);

  return {
    isApplying,
    previewData,
    applyAutoSequence,
    showPreview,
    clearPreview,
    calculateAutoSequence
  };
}
