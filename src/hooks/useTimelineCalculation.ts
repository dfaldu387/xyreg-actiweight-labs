import { useState, useCallback } from 'react';
import { addDays, subDays } from 'date-fns';
import { calculateTotalProjectDuration, calculateDaysFromPercentage } from '@/utils/phaseCalculations';
import { EnhancedDependencyService } from '@/services/enhancedDependencyService';
import { PhaseDependency } from '@/services/phaseDependencyService';

export type TimelineCalculationMode = 'forward' | 'backward';

/**
 * Calculate concurrent phase positions based on percentages relative to project timeline
 */
function calculateConcurrentPhases(
  concurrentPhases: Phase[],
  projectStartDate: Date,
  calculatedLaunchDate: Date
): Phase[] {
  const totalProjectDays = Math.ceil((calculatedLaunchDate.getTime() - projectStartDate.getTime()) / (1000 * 60 * 60 * 24));
  
  return concurrentPhases.map(phase => {
    if (phase.start_percentage !== undefined && phase.end_percentage !== undefined) {
      const startDays = Math.floor((phase.start_percentage / 100) * totalProjectDays);
      const endDays = Math.floor((phase.end_percentage / 100) * totalProjectDays);
      
      return {
        ...phase,
        startDate: addDays(projectStartDate, startDays),
        endDate: addDays(projectStartDate, endDays)
      };
    }
    
    // Fallback for continuous phases without percentages - span the entire project
    return {
      ...phase,
      startDate: projectStartDate,
      endDate: calculatedLaunchDate
    };
  });
}

interface Phase {
  id: string;
  name?: string;
  startDate?: Date;
  endDate?: Date;
  duration_days?: number;
  position?: number;
  is_continuous_process?: boolean;
  start_percentage?: number;
  end_percentage?: number;
}

export function useTimelineCalculation() {
  const [mode, setMode] = useState<TimelineCalculationMode>('forward');

  const recalculateTimeline = useCallback(async (
    mode: TimelineCalculationMode,
    phases: Phase[], 
    projectStartDate?: Date, 
    projectedLaunchDate?: Date,
    companyId?: string,
    dependencies?: PhaseDependency[]
  ) => {
    // console.log('[useTimelineCalculation] Recalculating timeline with mode:', mode);
    // console.log('[useTimelineCalculation] projectStartDate:', projectStartDate);
    // console.log('[useTimelineCalculation] projectedLaunchDate:', projectedLaunchDate);
    // console.log('[useTimelineCalculation] Total phases received:', phases.length);
    
    if (phases.length === 0) {
      return { 
        updatedPhases: [], 
        calculatedProjectStart: projectStartDate,
        calculatedLaunchDate: projectedLaunchDate
      };
    }

    // If dependencies are provided, use the enhanced dependency service
    if (dependencies && dependencies.length > 0) {
      // console.log('[useTimelineCalculation] Using enhanced dependency calculation');
      
      const targetDate = mode === 'forward' 
        ? (projectStartDate || new Date())
        : (projectedLaunchDate || new Date());
      
      const enhancedPhases = phases.map(phase => ({
        id: phase.id,
        name: (phase as any).name,
        startDate: phase.startDate,
        endDate: phase.endDate,
        duration_days: phase.duration_days,
        position: phase.position,
        is_continuous_process: phase.is_continuous_process,
        start_percentage: phase.start_percentage,
        end_percentage: phase.end_percentage
      }));

      const calculatedPhases = EnhancedDependencyService.calculateTimelineWithDependencies(
        enhancedPhases,
        dependencies,
        targetDate,
        mode
      );

      return {
        updatedPhases: calculatedPhases,
        calculatedProjectStart: projectStartDate,
        calculatedLaunchDate: projectedLaunchDate
      };
    }

    // Filter to only include LINEAR phases (exclude concurrent/continuous processes)
    const linearPhases = phases.filter(phase => !phase.is_continuous_process);
    // console.log('[useTimelineCalculation] Linear phases only:', linearPhases.length, 'out of', phases.length);

    if (linearPhases.length === 0) {
      console.warn('[useTimelineCalculation] No linear phases found, cannot calculate timeline');
      return { 
        updatedPhases: phases, // Return all phases unchanged
        calculatedProjectStart: projectStartDate,
        calculatedLaunchDate: projectedLaunchDate
      };
    }

    // Sort linear phases by position
    const sortedPhases = [...linearPhases].sort((a, b) => a.position - b.position);
    // console.log('[useTimelineCalculation] Sorted linear phases:', sortedPhases.map(p => ({ id: p.id, position: p.position })));
    const updatedPhases: Phase[] = [];

    if (mode === 'forward') {
      // console.log('[useTimelineCalculation] Using simple forward planning');
      let calculatedLaunchDate = projectedLaunchDate;
      
      // For forward planning, phases with no dependencies start at project start
      // and flow sequentially through the logical dependency chain
      const projectStart = projectStartDate || new Date();
      
      // Define logical dependency chain order for medtech phases
      const getLogicalOrder = (phaseName: string): number => {
        const name = phaseName.toLowerCase();
        if (name.includes('concept')) return 1;
        if (name.includes('project initiation') || name.includes('project planning')) return 2;
        if (name.includes('design input')) return 3;
        if (name.includes('design output')) return 4;
        if (name.includes('verification')) return 5;
        if (name.includes('validation')) return 6;
        if (name.includes('design transfer')) return 7;
        if (name.includes('design change control') || name.includes('design control')) return 8;
        // Independent phases that can start at project start
        if (name.includes('technical') || name.includes('supplier') || name.includes('post market') || name.includes('risk management')) return 999;
        return 500; // Default for other phases
      };
      
      // Sort phases by logical dependency order
      const logicallyOrderedPhases = [...linearPhases].sort((a, b) => 
        getLogicalOrder((a as any).name) - getLogicalOrder((b as any).name)
      );
      
      // Separate dependent chain phases from independent phases
      const dependentPhases = logicallyOrderedPhases.filter(p => getLogicalOrder((p as any).name) < 999);
      const independentPhases = logicallyOrderedPhases.filter(p => getLogicalOrder((p as any).name) === 999);
      
      // console.log('[useTimelineCalculation] Dependent phases (sequential):', dependentPhases.map(p => (p as any).name));
      // console.log('[useTimelineCalculation] Independent phases (start at project start):', independentPhases.map(p => (p as any).name));
      
      // Process dependent phases sequentially starting from project start
      let currentDate = projectStart;
      
      for (const phase of dependentPhases) {
        const phaseDuration = phase.duration_days || 30;
        const startDate = new Date(currentDate);
        const endDate = addDays(startDate, phaseDuration);

        updatedPhases.push({
          ...phase,
          startDate,
          endDate
        });

        // console.log(`[useTimelineCalculation] Forward dependent phase "${(phase as any).name}": ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);
        
        // Move to next phase start (day after current phase ends)
        currentDate = addDays(endDate, 1);
      }
      
      // Process independent phases - they start at project start and can run in parallel
      for (const phase of independentPhases) {
        const phaseDuration = phase.duration_days || 30;
        const startDate = new Date(projectStart);
        const endDate = addDays(startDate, phaseDuration);

        updatedPhases.push({
          ...phase,
          startDate,
          endDate
        });

        // console.log(`[useTimelineCalculation] Independent phase "${(phase as any).name}": ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);
      }
      
      // Calculate launch date as the end of the latest phase
      if (updatedPhases.length > 0) {
        const latestEndDate = Math.max(...updatedPhases.map(p => p.endDate!.getTime()));
        calculatedLaunchDate = new Date(latestEndDate);
      }

      // Calculate concurrent phases based on percentages
      const concurrentPhases = phases.filter(phase => phase.is_continuous_process);
      const calculatedConcurrentPhases = calculateConcurrentPhases(
        concurrentPhases,
        projectStart,
        calculatedLaunchDate || new Date()
      );

      const allUpdatedPhases = [...updatedPhases, ...calculatedConcurrentPhases];

      return {
        updatedPhases: allUpdatedPhases,
        calculatedProjectStart: projectStartDate,
        calculatedLaunchDate
      };

    } else {
      // console.log('[useTimelineCalculation] Using simple logical backward planning');
      
      if (!projectedLaunchDate) {
        console.warn('[useTimelineCalculation] No projected launch date provided for backward planning, cannot proceed');
        return {
          updatedPhases: phases,
          calculatedProjectStart: projectStartDate,
          calculatedLaunchDate: projectedLaunchDate
        };
      }

      // Define logical dependency chain order for medtech phases
      const getLogicalOrder = (phaseName: string): number => {
        const name = phaseName.toLowerCase();
        if (name.includes('concept')) return 1;
        if (name.includes('project initiation') || name.includes('project planning')) return 2;
        if (name.includes('design input')) return 3;
        if (name.includes('design output')) return 4;
        if (name.includes('verification')) return 5;
        if (name.includes('validation')) return 6;
        if (name.includes('design transfer')) return 7;
        if (name.includes('design change control') || name.includes('design control')) return 8;
        // Independent phases that should end at launch - expanded patterns
        if (name.includes('technical') || name.includes('supplier') || name.includes('post-market') || 
            name.includes('post market') || name.includes('risk') || name.includes('regulatory') ||
            name.includes('documentation') || name.includes('surveillance') || name.includes('management')) return 999;
        return 500; // Default for other phases
      };
      
      // Sort phases by logical dependency order
      const logicallyOrderedPhases = [...linearPhases].sort((a, b) => 
        getLogicalOrder((a as any).name) - getLogicalOrder((b as any).name)
      );
      
      // Separate dependent chain phases from independent phases
      const dependentPhases = logicallyOrderedPhases.filter(p => getLogicalOrder((p as any).name) < 999);
      const independentPhases = logicallyOrderedPhases.filter(p => getLogicalOrder((p as any).name) === 999);
      
      // console.log('[useTimelineCalculation] BACKWARD - Dependent phases (sequential):', dependentPhases.map(p => `${(p as any).name} (order: ${getLogicalOrder((p as any).name)})`));
      // console.log('[useTimelineCalculation] BACKWARD - Independent phases (end at launch):', independentPhases.map(p => `${(p as any).name} (order: ${getLogicalOrder((p as any).name)})`));
      
      // Process dependent phases in reverse logical order (backward planning from launch date)
      // Last phase ends at launch date, each earlier phase ends where the next one starts
      let currentDate = new Date(projectedLaunchDate);
      const reversedDependentPhases = [...dependentPhases].reverse();

      const backwardCalculated: typeof updatedPhases = [];
      for (const phase of reversedDependentPhases) {
        const phaseDuration = phase.duration_days || 30;
        const endDate = new Date(currentDate);
        const startDate = subDays(endDate, phaseDuration);

        backwardCalculated.push({
          ...phase,
          startDate,
          endDate
        });

        // console.log(`[useTimelineCalculation] Backward dependent phase "${(phase as any).name}": ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);

        // Move to previous phase end date (start date minus 1 day for gap)
        currentDate = subDays(startDate, 1);
      }

      // Re-sort to ascending logical order so phases display chronologically
      backwardCalculated.sort((a, b) => {
        const aOrder = getLogicalOrder((a as any).name);
        const bOrder = getLogicalOrder((b as any).name);
        return aOrder - bOrder;
      });
      updatedPhases.push(...backwardCalculated);
      
      // Process independent phases - they all end at launch
      for (const phase of independentPhases) {
        const phaseDuration = phase.duration_days || 30;
        const endDate = new Date(projectedLaunchDate);
        const startDate = subDays(endDate, phaseDuration);

        updatedPhases.push({
          ...phase,
          startDate,
          endDate
        });

        // console.log(`[useTimelineCalculation] Independent phase "${(phase as any).name}": ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);
      }

      // Calculate concurrent phases based on percentages
      const concurrentPhases = phases.filter(phase => phase.is_continuous_process);
      const calculatedProjectStart = updatedPhases.length > 0 
        ? updatedPhases[0].startDate 
        : projectStartDate;
        
      const calculatedConcurrentPhases = calculateConcurrentPhases(
        concurrentPhases,
        calculatedProjectStart || new Date(),
        projectedLaunchDate
      );

      const allUpdatedPhases = [...updatedPhases, ...calculatedConcurrentPhases];

      return {
        updatedPhases: allUpdatedPhases,
        calculatedProjectStart,
        calculatedLaunchDate: projectedLaunchDate
      };
    }
  }, []);

  return {
    mode,
    setMode,
    recalculateTimeline
  };
}