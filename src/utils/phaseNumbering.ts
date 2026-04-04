/**
 * Utility functions for phase management without numbered formats
 * Focuses on position-based ordering and clean phase names
 */

export interface CleanPhase {
  id: string;
  name: string;
  position: number;
}

/**
 * Clean phase name by removing any existing numbering prefixes
 */
export function cleanPhaseName(phaseName: string): string {
  if (!phaseName) return '';
  
  const cleaned = phaseName
    .replace(/^\(0*\d+\)\s*/, '')      // Remove "(01) " or "(1) "
    .replace(/^0*\d+\.\s*/, '')        // Remove "01. " or "1. "
    .replace(/^Phase\s+\d+\s*[-:]?\s*/i, '') // Remove "Phase 1: "
    .replace(/\s*\(continuous\)\s*/gi, '') // Remove "(Continuous)" or "(continuous)"
    .trim();
  
  return cleaned;
}

/**
 * Convert phases array to clean phases using position-based ordering
 */
export function convertToCleanPhases(phases: Array<{
  id: string;
  name: string;
  position?: number;
}>): CleanPhase[] {
  // Sort by position first
  const sortedPhases = [...phases].sort((a, b) => (a.position || 0) - (b.position || 0));
  
  return sortedPhases.map((phase, index) => ({
    id: phase.id,
    name: cleanPhaseName(phase.name),
    position: phase.position || index
  }));
}

/**
 * Get display name without numbering - just clean phase name
 */
export function getPhaseDisplayName(phaseName: string): string {
  return cleanPhaseName(phaseName);
}
