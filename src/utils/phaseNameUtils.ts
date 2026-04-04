
/**
 * Utility functions for phase name processing and matching
 */

/**
 * Extract core phase name by removing number prefixes
 * Examples:
 * "(07) Validation (Design, Clinical, Usability)" → "Validation (Design, Clinical, Usability)"
 * "(1) Concept & Feasibility" → "Concept & Feasibility"
 * "Design Transfer" → "Design Transfer"
 */
export function extractCorePhaseeName(phaseName: string): string {
  if (!phaseName) return '';
  
  return phaseName
    .trim()
    // Remove various number prefix patterns: (01), (1), (04), 01), 1), etc.
    .replace(/^\(?0*(\d+)\)?\s*[-\.\:\)\s]*/, '')
    // Remove any remaining leading/trailing whitespace and punctuation
    .replace(/^[\s\-\.\:\)]+|[\s\-\.\:\)]+$/g, '')
    .trim();
}

/**
 * Check if a phase name has a number prefix
 */
export function hasNumberPrefix(phaseName: string): boolean {
  if (!phaseName) return false;
  return /^\(?0*\d+\)?\s*[-\.\:\)\s]/.test(phaseName.trim());
}

/**
 * Extract the number from a numbered phase name
 */
export function extractPhaseNumber(phaseName: string): number | null {
  if (!phaseName) return null;
  
  const match = phaseName.trim().match(/^\(?0*(\d+)\)/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Validate that a phase name matches exactly one of the provided phase names
 */
export function validateExactPhaseMatch(phaseName: string, availablePhases: string[]): boolean {
  return availablePhases.includes(phaseName);
}

/**
 * Find matching phase using multiple strategies
 */
export function findMatchingPhase(inputPhaseName: string, availablePhases: string[]): string | null {
  if (!inputPhaseName || !availablePhases.length) return null;
  
  // Strategy 1: Exact match
  if (availablePhases.includes(inputPhaseName)) {
    return inputPhaseName;
  }
  
  // Strategy 2: Core name matching (remove numbers from input, compare with available)
  const coreInputName = extractCorePhaseeName(inputPhaseName);
  if (coreInputName) {
    for (const availablePhase of availablePhases) {
      if (availablePhase === coreInputName || extractCorePhaseeName(availablePhase) === coreInputName) {
        return availablePhase;
      }
    }
  }
  
  return null;
}

/**
 * Validate phase name consistency between current phase and lifecycle phase
 */
export function validatePhaseNameConsistency(
  currentPhase: string | null,
  lifecyclePhase: string | null,
  availablePhases: string[]
): {
  isConsistent: boolean;
  issues: string[];
  suggestedFix: string | null;
} {
  const issues: string[] = [];
  let suggestedFix: string | null = null;

  // Check if current phase exists in available phases
  if (currentPhase && !validateExactPhaseMatch(currentPhase, availablePhases)) {
    issues.push(`Current phase "${currentPhase}" not found in available phases`);
    
    // Try to find a matching phase
    const matchedPhase = findMatchingPhase(currentPhase, availablePhases);
    if (matchedPhase) {
      suggestedFix = `Update current phase to "${matchedPhase}"`;
    }
  }

  // Check if lifecycle phase exists in available phases
  if (lifecyclePhase && !validateExactPhaseMatch(lifecyclePhase, availablePhases)) {
    issues.push(`Lifecycle phase "${lifecyclePhase}" not found in available phases`);
    
    // Try to find a matching phase
    const matchedPhase = findMatchingPhase(lifecyclePhase, availablePhases);
    if (matchedPhase && !suggestedFix) {
      suggestedFix = `Update lifecycle phase to "${matchedPhase}"`;
    }
  }

  // Check if current phase and lifecycle phase match
  if (currentPhase && lifecyclePhase && currentPhase !== lifecyclePhase) {
    issues.push(`Current phase "${currentPhase}" does not match lifecycle phase "${lifecyclePhase}"`);
    
    if (!suggestedFix) {
      // Prefer lifecycle phase if both exist
      if (validateExactPhaseMatch(lifecyclePhase, availablePhases)) {
        suggestedFix = `Update current phase to match lifecycle phase "${lifecyclePhase}"`;
      } else if (validateExactPhaseMatch(currentPhase, availablePhases)) {
        suggestedFix = `Update lifecycle phase to match current phase "${currentPhase}"`;
      }
    }
  }

  return {
    isConsistent: issues.length === 0,
    issues,
    suggestedFix
  };
}
