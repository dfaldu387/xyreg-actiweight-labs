
/**
 * Utility functions for phase management and display
 * CRITICAL: Phase names must be preserved EXACTLY as stored in database
 * NO MODIFICATIONS OR TRANSFORMATIONS ALLOWED
 */

/**
 * REMOVED: All phase name cleaning/normalization functions
 * Phase names must be preserved exactly as they are in the database
 */

/**
 * Check if two phase names are exactly the same (case-sensitive)
 */
export function arePhaseNamesSame(name1: string, name2: string): boolean {
  return name1.trim() === name2.trim();
}

/**
 * Check if a phase name is a standard system phase (by exact name matching)
 */
export function isSystemPhase(phaseName: string): boolean {
  const systemPhases = [
    'Concept & Feasibility',
    'Design Planning',
    'Design Input',
    'Design Output',
    'Verification',
    'Validation (Design, Clinical, Usability)',
    'Design Transfer',
    'Design Change Control',
    'Risk Management',
    'Configuration Management',
    'Technical Documentation',
    'Clinical Evaluation',
    'Post-Market Surveillance',
    'Design Review',
    'Design History File'
  ];
  
  return systemPhases.includes(phaseName);
}

/**
 * CRITICAL WARNING: Do not add any functions that modify phase names
 * All phase names must be preserved exactly as they appear in CSV imports
 */
