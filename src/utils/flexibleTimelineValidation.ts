
import { toast } from 'sonner';

export interface PhaseForValidation {
  id: string;
  name: string;
  startDate?: Date;
  endDate?: Date;
}

export interface ValidationResult {
  isValid: boolean;
  message?: string;
  severity: 'error' | 'warning' | 'info';
  conflictingPhase?: string;
}

export interface TimelineAdvisory {
  phaseId: string;
  phaseName: string;
  advisoryType: 'overlap' | 'sequence_concern' | 'milestone_dependency' | 'efficiency_tip';
  severity: 'warning' | 'info';
  message: string;
  suggestion?: string;
}

export type TimelineMode = 'concurrent' | 'waterfall' | 'custom';

/**
 * Configuration for timeline validation behavior
 */
export interface TimelineConfig {
  mode: TimelineMode;
  allowOverlaps: boolean;
  showEfficiencyTips: boolean;
  enableMilestoneTracking: boolean;
}

const DEFAULT_CONFIG: TimelineConfig = {
  mode: 'concurrent',
  allowOverlaps: true,
  showEfficiencyTips: true,
  enableMilestoneTracking: false
};

/**
 * Analyzes timeline for advisories and potential issues (non-blocking)
 */
export function analyzeTimeline(
  phases: PhaseForValidation[], 
  config: TimelineConfig = DEFAULT_CONFIG
): TimelineAdvisory[] {
  const advisories: TimelineAdvisory[] = [];
  
  for (let i = 0; i < phases.length; i++) {
    const currentPhase = phases[i];
    
    // Check phase's own dates
    if (currentPhase.startDate && currentPhase.endDate && currentPhase.startDate > currentPhase.endDate) {
      advisories.push({
        phaseId: currentPhase.id,
        phaseName: currentPhase.name,
        advisoryType: 'sequence_concern',
        severity: 'warning',
        message: `${currentPhase.name} start date is after its end date`,
        suggestion: 'Adjust dates so start comes before end'
      });
    }
    
    // Analyze relationships with other phases
    for (let j = i + 1; j < phases.length; j++) {
      const laterPhase = phases[j];
      
      if (config.mode === 'waterfall') {
        // In waterfall mode, provide warnings for overlaps but don't block
        if (currentPhase.endDate && laterPhase.startDate && currentPhase.endDate > laterPhase.startDate) {
          advisories.push({
            phaseId: currentPhase.id,
            phaseName: currentPhase.name,
            advisoryType: 'overlap',
            severity: 'warning',
            message: `${currentPhase.name} overlaps with ${laterPhase.name} (waterfall mode)`,
            suggestion: 'Consider sequential timing for waterfall approach'
          });
        }
      } else if (config.mode === 'concurrent') {
        // In concurrent mode, show info about overlaps and efficiency tips
        if (currentPhase.endDate && laterPhase.startDate && currentPhase.endDate > laterPhase.startDate) {
          advisories.push({
            phaseId: currentPhase.id,
            phaseName: currentPhase.name,
            advisoryType: 'overlap',
            severity: 'info',
            message: `${currentPhase.name} runs concurrently with ${laterPhase.name}`,
            suggestion: 'Ensure proper coordination between overlapping teams'
          });
        }
        
        // Efficiency tips for concurrent engineering
        if (config.showEfficiencyTips && currentPhase.endDate && laterPhase.startDate) {
          const gap = laterPhase.startDate.getTime() - currentPhase.endDate.getTime();
          const daysDiff = gap / (1000 * 60 * 60 * 24);
          
          if (daysDiff > 30) {
            advisories.push({
              phaseId: currentPhase.id,
              phaseName: currentPhase.name,
              advisoryType: 'efficiency_tip',
              severity: 'info',
              message: `Large gap between ${currentPhase.name} and ${laterPhase.name} (${Math.round(daysDiff)} days)`,
              suggestion: 'Consider overlapping phases for faster time-to-market'
            });
          }
        }
      }
    }
  }
  
  return advisories;
}

/**
 * Validates phase date changes with flexible approach
 */
export function validatePhaseDate(
  phases: PhaseForValidation[],
  phaseId: string,
  newDate: Date | undefined,
  dateType: 'start' | 'end',
  config: TimelineConfig = DEFAULT_CONFIG
): ValidationResult {
  if (!newDate) {
    return { isValid: true, severity: 'info' };
  }

  const phaseIndex = phases.findIndex(p => p.id === phaseId);
  if (phaseIndex === -1) {
    return { 
      isValid: false, 
      message: 'Phase not found', 
      severity: 'error' 
    };
  }

  const currentPhase = phases[phaseIndex];
  
  // Always validate against own dates (this is always an error)
  if (dateType === 'start' && currentPhase.endDate && newDate > currentPhase.endDate) {
    return {
      isValid: false,
      message: `Start date cannot be after the end date (${currentPhase.endDate.toLocaleDateString()})`,
      severity: 'error'
    };
  }
  
  if (dateType === 'end' && currentPhase.startDate && newDate < currentPhase.startDate) {
    return {
      isValid: false,
      message: `End date cannot be earlier than the start date (${currentPhase.startDate.toLocaleDateString()})`,
      severity: 'error'
    };
  }

  // For concurrent mode, everything else is allowed with optional warnings
  if (config.mode === 'concurrent') {
    return { isValid: true, severity: 'info' };
  }
  
  // For waterfall mode, provide warnings but still allow changes
  if (config.mode === 'waterfall') {
    // Check for potential waterfall violations but don't block
    for (let i = phaseIndex + 1; i < phases.length; i++) {
      const followingPhase = phases[i];
      
      if (dateType === 'end' && followingPhase.startDate && newDate > followingPhase.startDate) {
        return {
          isValid: true, // Allow but warn
          message: `This may cause overlap with ${followingPhase.name} (waterfall mode)`,
          severity: 'warning',
          conflictingPhase: followingPhase.name
        };
      }
    }
  }

  return { isValid: true, severity: 'info' };
}

/**
 * Gets timeline efficiency score based on overlaps and gaps
 */
export function calculateTimelineEfficiency(phases: PhaseForValidation[]): {
  score: number;
  insights: string[];
} {
  const insights: string[] = [];
  let efficiencyScore = 100;
  
  if (phases.length < 2) {
    return { score: 100, insights: ['Timeline too short to analyze'] };
  }
  
  // Analyze for gaps and overlaps
  let totalDuration = 0;
  let overlappingDuration = 0;
  let gapDuration = 0;
  
  for (let i = 0; i < phases.length - 1; i++) {
    const current = phases[i];
    const next = phases[i + 1];
    
    if (current.startDate && current.endDate) {
      totalDuration += current.endDate.getTime() - current.startDate.getTime();
    }
    
    if (current.endDate && next.startDate) {
      const gap = next.startDate.getTime() - current.endDate.getTime();
      if (gap > 0) {
        gapDuration += gap;
        const daysDiff = gap / (1000 * 60 * 60 * 24);
        if (daysDiff > 14) {
          insights.push(`${Math.round(daysDiff)}-day gap between ${current.name} and ${next.name}`);
          efficiencyScore -= 5;
        }
      } else if (gap < 0) {
        overlappingDuration += Math.abs(gap);
        insights.push(`${current.name} and ${next.name} overlap (concurrent engineering)`);
        efficiencyScore += 3; // Overlaps can be good for efficiency
      }
    }
  }
  
  return {
    score: Math.max(0, Math.min(100, efficiencyScore)),
    insights
  };
}

/**
 * Suggests timeline optimizations
 */
export function suggestTimelineOptimizations(phases: PhaseForValidation[]): string[] {
  const suggestions: string[] = [];
  
  if (phases.length < 2) return suggestions;
  
  const efficiency = calculateTimelineEfficiency(phases);
  
  if (efficiency.score < 70) {
    suggestions.push("Consider implementing concurrent engineering practices");
    suggestions.push("Look for opportunities to overlap non-dependent activities");
  }
  
  // Look for phases that could benefit from overlap
  for (let i = 0; i < phases.length - 1; i++) {
    const current = phases[i];
    const next = phases[i + 1];
    
    if (current.endDate && next.startDate) {
      const gap = next.startDate.getTime() - current.endDate.getTime();
      const daysDiff = gap / (1000 * 60 * 60 * 24);
      
      if (daysDiff > 30) {
        suggestions.push(`Consider starting ${next.name} earlier to overlap with ${current.name}`);
      }
    }
  }
  
  return suggestions;
}
