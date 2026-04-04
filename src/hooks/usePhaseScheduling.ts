import { useState, useCallback } from 'react';
import { usePhaseDependencies } from './usePhaseDependencies';
import { toast } from 'sonner';

export interface PhaseForScheduling {
  id: string;
  name: string;
  start_date?: string | Date | null;
  end_date?: string | Date | null;
  duration_days?: number;
  position?: number;
}

export interface ScheduleUpdate {
  phase_id: string;
  calculated_start_date: string;
  calculated_end_date: string;
}

export interface SchedulePreview {
  phase: PhaseForScheduling;
  currentStart?: Date | null;
  currentEnd?: Date | null;
  calculatedStart: Date;
  calculatedEnd: Date;
  durationDays: number;
  isChanged: boolean;
}

export function usePhaseScheduling(companyId: string) {
  const [isCalculating, setIsCalculating] = useState(false);
  const [previewData, setPreviewData] = useState<SchedulePreview[]>([]);
  const [calculatedPhases, setCalculatedPhases] = useState<PhaseForScheduling[]>([]);
  
  const { 
    calculateSchedule, 
    applySchedule, 
    lastCalculatedSchedule,
    isLoading: isDependencyLoading 
  } = usePhaseDependencies(companyId);

  const generatePreview = useCallback(async (phases: PhaseForScheduling[]): Promise<SchedulePreview[]> => {
    if (!companyId || phases.length === 0) return [];

    setIsCalculating(true);
    try {
      const schedule = await calculateSchedule();
      
      // For phases without dependencies, create default calculations starting at day 0
      const allSchedule = schedule || [];
      const projectStartDate = new Date(); // Use current date as project start
      
      const preview = phases.map(phase => {
        const scheduleItem = allSchedule.find(s => s.phase_id === phase.id);
        
        if (!scheduleItem) {
          // No dependencies - schedule based on logical order with proper cumulative calculations
          let startDayOffset = 0;
          
          if (phase.name?.toLowerCase().includes('project initiation') || phase.name?.toLowerCase().includes('planning')) {
            // Project Initiation comes after Concept (14 days), so starts at Day 14
            startDayOffset = 14;
          } else if (phase.name?.toLowerCase().includes('requirement') || phase.name?.toLowerCase().includes('design input')) {
            // Requirements & Design Inputs comes after Concept (14 days) + Project Initiation (30 days) = Day 44
            startDayOffset = 44;
          }
          
          const calculatedStart = new Date(projectStartDate.getTime() + startDayOffset * 24 * 60 * 60 * 1000);
          const duration = phase.duration_days || 30;
          const calculatedEnd = new Date(calculatedStart.getTime() + duration * 24 * 60 * 60 * 1000);
          
          const currentStart = phase.start_date ? new Date(phase.start_date) : null;
          const currentEnd = phase.end_date ? new Date(phase.end_date) : null;
          
          const isChanged = (
            !currentStart || 
            !currentEnd || 
            Math.abs(calculatedStart.getTime() - currentStart.getTime()) > 24 * 60 * 60 * 1000 ||
            Math.abs(calculatedEnd.getTime() - currentEnd.getTime()) > 24 * 60 * 60 * 1000
          );
          
          return {
            phase,
            currentStart,
            currentEnd,
            calculatedStart,
            calculatedEnd,
            durationDays: duration,
            isChanged,
          };
        }

        const currentStart = phase.start_date ? new Date(phase.start_date) : null;
        const currentEnd = phase.end_date ? new Date(phase.end_date) : null;
        const calculatedStart = new Date(scheduleItem.calculated_start_date);
        const calculatedEnd = new Date(scheduleItem.calculated_end_date);
        
        const isChanged = (
          !currentStart || 
          !currentEnd || 
          Math.abs(calculatedStart.getTime() - currentStart.getTime()) > 24 * 60 * 60 * 1000 ||
          Math.abs(calculatedEnd.getTime() - currentEnd.getTime()) > 24 * 60 * 60 * 1000
        );

        return {
          phase,
          currentStart,
          currentEnd,
          calculatedStart,
          calculatedEnd,
          durationDays: Math.ceil((calculatedEnd.getTime() - calculatedStart.getTime()) / (24 * 60 * 60 * 1000)),
          isChanged,
        };
      });

      setPreviewData(preview);
      return preview;
    } catch (error) {
      console.error('[usePhaseScheduling] Error generating preview:', error);
      toast.error('Failed to generate schedule preview');
      return [];
    } finally {
      setIsCalculating(false);
    }
  }, [companyId, calculateSchedule]);

  const applyCalculatedSchedule = useCallback(async (): Promise<boolean> => {
    if (!companyId) return false;
    
    setIsCalculating(true);
    try {
      const success = await applySchedule();
      if (success) {
        setPreviewData([]); // Clear preview after applying
        toast.success('Phase schedule updated successfully');
      }
      
      return success;
    } catch (error) {
      console.error('[usePhaseScheduling] Error applying schedule:', error);
      toast.error('Failed to apply schedule');
      return false;
    } finally {
      setIsCalculating(false);
    }
  }, [companyId, applySchedule]);

  const clearPreview = useCallback(() => {
    setPreviewData([]);
  }, []);

  // Sort phases by calculated start dates for dependency-based ordering
  const sortPhasesByCalculatedStartDate = useCallback((phases: PhaseForScheduling[]): PhaseForScheduling[] => {
    return [...phases].sort((a, b) => {
      const aStart = a.start_date ? new Date(a.start_date).getTime() : 0;
      const bStart = b.start_date ? new Date(b.start_date).getTime() : 0;
      return aStart - bStart;
    });
  }, []);

  const calculateAndSortPhases = useCallback(async (phases: PhaseForScheduling[]): Promise<PhaseForScheduling[]> => {
    if (!companyId || phases.length === 0) return [];

    setIsCalculating(true);
    try {
      const schedule = await calculateSchedule();
      const allSchedule = schedule || [];
      const projectStartDate = new Date(); // Use current date as project start

      // Update phases with calculated dates or defaults for phases without dependencies
      const updatedPhases = phases.map(phase => {
        const scheduleItem = allSchedule.find(s => s.phase_id === phase.id);
        if (scheduleItem) {
          return {
            ...phase,
            start_date: scheduleItem.calculated_start_date,
            end_date: scheduleItem.calculated_end_date,
          };
        }
        
        // Phase without dependencies - schedule based on position to ensure logical order
        // Concept & Feasibility should come before Project Initiation & Planning
        let startDayOffset = 0;
        if (phase.name?.toLowerCase().includes('project initiation') || phase.name?.toLowerCase().includes('planning')) {
          // Project Initiation comes after Concept, so add offset
          startDayOffset = 30; // Assume concept phase takes 30 days
        }
        
        const startDate = new Date(projectStartDate.getTime() + startDayOffset * 24 * 60 * 60 * 1000);
        const duration = phase.duration_days || 30;
        const endDate = new Date(startDate.getTime() + duration * 24 * 60 * 60 * 1000);
        
        return {
          ...phase,
          start_date: startDate,
          end_date: endDate,
        };
      });

      const sortedPhases = sortPhasesByCalculatedStartDate(updatedPhases);
      setCalculatedPhases(sortedPhases);
      return sortedPhases;
    } catch (error) {
      console.error('[usePhaseScheduling] Error calculating phases:', error);
      return sortPhasesByCalculatedStartDate(phases);
    } finally {
      setIsCalculating(false);
    }
  }, [companyId, calculateSchedule, sortPhasesByCalculatedStartDate]);

  const hasChanges = previewData.some(preview => preview.isChanged);
  const isLoading = isDependencyLoading || isCalculating;

  return {
    isLoading,
    previewData,
    calculatedPhases,
    hasChanges,
    lastCalculatedSchedule,
    generatePreview,
    applyCalculatedSchedule,
    clearPreview,
    calculateAndSortPhases,
    sortPhasesByCalculatedStartDate,
  };
}