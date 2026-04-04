
/**
 * Utility to help repair and normalize inconsistent phase IDs
 * This helps with situations where phase_id might be a string identifier instead of a proper UUID reference
 */

// Mapping of known phase names to their proper UUIDs
// This will be populated dynamically as we encounter phases
const phaseNameToIdMap = new Map<string, string>();

/**
 * Try to repair an inconsistent phase ID by looking it up in our mapping
 * or by inferring from other matching phases
 */
export function repairPhaseID(phaseId: string | undefined, phaseName: string | undefined): string | undefined {
  if (!phaseId && !phaseName) return undefined;
  
  // If we have a valid UUID, use it
  if (phaseId && isValidUUID(phaseId)) {
    // Store the mapping for future reference if we also have a name
    if (phaseName) {
      phaseNameToIdMap.set(phaseName.toLowerCase(), phaseId);
    }
    return phaseId;
  }
  
  // Try to look up by name
  if (phaseName) {
    const normalizedName = phaseName.toLowerCase();
    if (phaseNameToIdMap.has(normalizedName)) {
      return phaseNameToIdMap.get(normalizedName);
    }
  }
  
  // Return the original phaseId as a fallback
  return phaseId;
}

/**
 * Register a mapping between phase name and ID
 */
export function registerPhaseMapping(phaseName: string, phaseId: string): void {
  if (phaseName && phaseId && isValidUUID(phaseId)) {
    phaseNameToIdMap.set(phaseName.toLowerCase(), phaseId);
  }
}

/**
 * Return all known phase mappings
 */
export function getPhaseNameMappings(): Record<string, string> {
  const result: Record<string, string> = {};
  phaseNameToIdMap.forEach((id, name) => {
    result[name] = id;
  });
  return result;
}

/**
 * Check if a string is a valid UUID
 */
export function isValidUUID(str: string): boolean {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidPattern.test(str);
}
