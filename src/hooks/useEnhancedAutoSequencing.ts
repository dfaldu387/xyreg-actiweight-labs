import { useState, useCallback } from 'react';
import { addDays, differenceInDays } from 'date-fns';
import { toast } from 'sonner';
import { sortPhasesByDependencies } from '@/utils/dependencySorting';

export type SequenceMode = 'none' | 'simple' | 'dependency' | 'parallel';

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

export interface DependencyCreationSuggestion {
  fromPhaseId: string;
  toPhaseId: string;
  type: 'FS' | 'FF' | 'SS' | 'SF';
  lagDays: number;
  reason: string;
}

export interface EnhancedSequencePreview extends AutoSequencePreview {
  suggestedDependencies?: DependencyCreationSuggestion[];
}

export function useEnhancedAutoSequencing() {
  const [isApplying, setIsApplying] = useState(false);
  const [previewData, setPreviewData] = useState<EnhancedSequencePreview[] | null>(null);
  const [sequenceMode, setSequenceMode] = useState<SequenceMode>('dependency');
  const [dependencySuggestions, setDependencySuggestions] = useState<DependencyCreationSuggestion[]>([]);

  const calculateSimpleSequence = useCallback((phases: PhaseForAutoSequencing[]): AutoSequenceUpdate[] => {
    const sortedPhases = [...phases].sort((a, b) => a.position - b.position);
    const updates: AutoSequenceUpdate[] = [];
    const linearPhases = sortedPhases.filter(p => !p.is_continuous_process);
    
    let currentStartDate = new Date();
    const linearPhasesWithDates = linearPhases.filter(p => p.startDate);
    if (linearPhasesWithDates.length > 0) {
      currentStartDate = new Date(Math.min(...linearPhasesWithDates.map(p => p.startDate!.getTime())));
    }
    
    linearPhases.forEach((phase) => {
      let duration = 14;
      if (phase.startDate && phase.endDate) {
        duration = Math.max(1, differenceInDays(phase.endDate, phase.startDate));
      } else if (phase.typical_duration_days) {
        duration = phase.typical_duration_days;
      }
      
      const endDate = addDays(currentStartDate, duration);
      
      updates.push({
        id: phase.id,
        startDate: new Date(currentStartDate),
        endDate: endDate
      });
      
      currentStartDate = addDays(endDate, 1);
    });
    
    return updates;
  }, []);

  const calculateDependencySequence = useCallback((
    phases: PhaseForAutoSequencing[],
    dependencies: any[] = []
  ): AutoSequenceUpdate[] => {
    console.log('[Enhanced Auto-Sequencing] Calculating dependency-based sequence');
    console.log('Dependencies:', dependencies.length);
    
    // If no dependencies, fall back to simple sequence
    if (dependencies.length === 0) {
      console.log('[Enhanced Auto-Sequencing] No dependencies found, using simple sequence');
      return calculateSimpleSequence(phases);
    }
    
    // Use dependency sorting to get the correct order
    const phasesWithDependencies = phases.map(p => ({
      ...p,
      name: p.id, // Use ID as name for sorting
      calculated_start_day: p.typical_start_day || 0
    }));
    
    const sortedPhases = sortPhasesByDependencies(phasesWithDependencies, dependencies);
    console.log('[Enhanced Auto-Sequencing] Dependency-sorted phases:', sortedPhases.map(p => p.id));
    
    const updates: AutoSequenceUpdate[] = [];
    const linearPhases = sortedPhases.filter(p => !p.is_continuous_process);
    
    // Find earliest start date or use today
    let currentStartDate = new Date();
    const linearPhasesWithDates = linearPhases.filter(p => p.startDate);
    if (linearPhasesWithDates.length > 0) {
      currentStartDate = new Date(Math.min(...linearPhasesWithDates.map(p => p.startDate!.getTime())));
    }
    
    console.log('[Enhanced Auto-Sequencing] Starting dependency sequence from:', currentStartDate.toISOString().split('T')[0]);
    
    // Schedule phases in dependency order
    linearPhases.forEach((phase, index) => {
      // Calculate duration - use existing duration if available, otherwise default to 14 days
      let duration = 14; // Default 2 weeks
      if (phase.startDate && phase.endDate) {
        duration = Math.max(1, differenceInDays(phase.endDate, phase.startDate));
      } else if (phase.typical_duration_days) {
        duration = phase.typical_duration_days;
      }
      
      const endDate = addDays(currentStartDate, duration);
      
      console.log(`[Enhanced Auto-Sequencing] Dependency Phase ${index + 1}:`, {
        phaseId: phase.id,
        startDate: currentStartDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        duration
      });
      
      updates.push({
        id: phase.id,
        startDate: new Date(currentStartDate),
        endDate: endDate
      });
      
      // Next phase starts the day after this one ends (for linear sequencing)
      currentStartDate = addDays(endDate, 1);
    });
    
    console.log('[Enhanced Auto-Sequencing] Generated dependency-based updates:', updates.length);
    return updates;
  }, [calculateSimpleSequence]);

  const generateDependencySuggestions = useCallback((phases: PhaseForAutoSequencing[]): DependencyCreationSuggestion[] => {
    const suggestions: DependencyCreationSuggestion[] = [];
    const sortedPhases = [...phases].sort((a, b) => a.position - b.position);
    
    // Suggest sequential dependencies for consecutive phases
    for (let i = 0; i < sortedPhases.length - 1; i++) {
      const currentPhase = sortedPhases[i];
      const nextPhase = sortedPhases[i + 1];
      
      if (!currentPhase.is_continuous_process && !nextPhase.is_continuous_process) {
        suggestions.push({
          fromPhaseId: currentPhase.id,
          toPhaseId: nextPhase.id,
          type: 'FS',
          lagDays: 0,
          reason: 'Sequential phases should have Finish-to-Start dependencies'
        });
      }
    }
    
    return suggestions;
  }, []);

  const calculateAutoSequence = useCallback((
    phases: PhaseForAutoSequencing[],
    dependencies: any[] = [],
    mode: SequenceMode = sequenceMode
  ): { updates: AutoSequenceUpdate[], suggestions: DependencyCreationSuggestion[] } => {
    let updates: AutoSequenceUpdate[] = [];
    let suggestions: DependencyCreationSuggestion[] = [];
    
    switch (mode) {
      case 'simple':
        updates = calculateSimpleSequence(phases);
        suggestions = generateDependencySuggestions(phases);
        break;
      case 'dependency':
        updates = calculateDependencySequence(phases, dependencies);
        break;
      case 'parallel':
        // TODO: Implement parallel phase calculation
        updates = calculateSimpleSequence(phases);
        break;
      default:
        updates = [];
    }
    
    return { updates, suggestions };
  }, [sequenceMode, calculateSimpleSequence, calculateDependencySequence, generateDependencySuggestions]);

  const generatePreview = useCallback((
    phases: PhaseForAutoSequencing[],
    dependencies: any[] = [],
    mode: SequenceMode = sequenceMode
  ): EnhancedSequencePreview[] => {
    const { updates, suggestions } = calculateAutoSequence(phases, dependencies, mode);
    
    setDependencySuggestions(suggestions);
    
    return updates.map(update => {
      const originalPhase = phases.find(p => p.id === update.id)!;
      const durationDays = differenceInDays(update.endDate, update.startDate);
      
      return {
        original: originalPhase,
        updated: update,
        durationDays,
        suggestedDependencies: suggestions.filter(s => s.fromPhaseId === update.id || s.toPhaseId === update.id)
      };
    });
  }, [calculateAutoSequence, sequenceMode]);

  const applyAutoSequence = useCallback(async (
    phases: PhaseForAutoSequencing[],
    onBatchUpdate: (updates: AutoSequenceUpdate[]) => Promise<boolean>,
    dependencies: any[] = [],
    mode: SequenceMode = sequenceMode
  ): Promise<boolean> => {
    if (isApplying) return false;
    
    setIsApplying(true);
    try {
      const { updates } = calculateAutoSequence(phases, dependencies, mode);
      const success = await onBatchUpdate(updates);
      
      if (success) {
        toast.success(`Auto-sequenced ${updates.length} phases successfully`);
        setPreviewData(null);
      } else {
        toast.error('Failed to apply auto-sequencing');
      }
      
      return success;
    } catch (error) {
      console.error('[Enhanced Auto-Sequencing] Error applying:', error);
      toast.error('Error applying auto-sequencing');
      return false;
    } finally {
      setIsApplying(false);
    }
  }, [isApplying, calculateAutoSequence, sequenceMode]);

  const showPreview = useCallback((
    phases: PhaseForAutoSequencing[],
    dependencies: any[] = [],
    mode: SequenceMode = sequenceMode
  ) => {
    const preview = generatePreview(phases, dependencies, mode);
    setPreviewData(preview);
    return preview;
  }, [generatePreview, sequenceMode]);

  const clearPreview = useCallback(() => {
    setPreviewData(null);
    setDependencySuggestions([]);
  }, []);

  const createSequentialDependencies = useCallback(async (
    phases: PhaseForAutoSequencing[],
    onCreateDependency: (dep: any) => Promise<boolean>
  ): Promise<boolean> => {
    const suggestions = generateDependencySuggestions(phases);
    
    try {
      for (const suggestion of suggestions) {
        await onCreateDependency({
          predecessor_phase_id: suggestion.fromPhaseId,
          successor_phase_id: suggestion.toPhaseId,
          dependency_type: suggestion.type,
          lag_days: suggestion.lagDays
        });
      }
      
      toast.success(`Created ${suggestions.length} sequential dependencies`);
      return true;
    } catch (error) {
      toast.error('Failed to create dependencies');
      return false;
    }
  }, [generateDependencySuggestions]);

  return {
    isApplying,
    previewData,
    sequenceMode,
    dependencySuggestions,
    setSequenceMode,
    applyAutoSequence,
    showPreview,
    clearPreview,
    calculateAutoSequence,
    createSequentialDependencies
  };
}