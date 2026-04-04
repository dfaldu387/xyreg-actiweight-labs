
import { supabase } from "@/integrations/supabase/client";
import { extractCorePhaseeName } from "@/utils/phaseNameUtils";

/**
 * Normalize phase name to handle common variations for matching.
 */
function normalizePhaseName(phaseName: string): string {
  if (!phaseName) return '';
  
  return phaseName
    .toLowerCase()
    .trim()
    .replace(/[\-–—]/g, '-') // Normalize dashes
    .replace(/\s*&\s*/g, ' and ') // Normalize ampersands
    .replace(/[^\w\s-]/g, '') // Remove special characters except word, space, dash
    .replace(/\s+/g, ' '); // Collapse whitespace
}

/**
 * Advanced fuzzy matching for phase names.
 */
function fuzzyMatchPhaseNames(name1: string, name2: string): boolean {
  if (!name1 || !name2) return false;
  
  const norm1 = normalizePhaseName(name1);
  const norm2 = normalizePhaseName(name2);
  
  if (norm1 === norm2) return true;
  
  // Check if one contains the other.
  if (norm1.includes(norm2) || norm2.includes(norm1)) {
    // Be strict to avoid false positives like "Plan" matching "Planning".
    const lengthDiff = Math.abs(norm1.length - norm2.length);
    const maxLength = Math.max(norm1.length, norm2.length);
    if (maxLength > 0 && lengthDiff / maxLength < 0.25) { // Allow up to 25% difference
      return true;
    }
  }
  
  return false;
}

/**
 * Comprehensive phase matching using multiple strategies
 */
export async function findExistingPhaseComprehensive(phaseName: string, companyId: string): Promise<{ id: string; name: string } | null> {
  console.log(`[PhaseMatching] Starting comprehensive search for phase: "${phaseName}"`);
  
  const { data: allPhases, error } = await supabase
    .from('phases')
    .select('id, name')
    .eq('company_id', companyId);

  if (error || !allPhases || allPhases.length === 0) {
    console.error(`[PhaseMatching] Could not fetch phases for company ${companyId}`, error);
    return null;
  }
  
  console.log(`[PhaseMatching] Available company phases:`, allPhases.map(p => p.name));

  const trimmedInput = phaseName.trim();

  // Strategy 1: Exact match (case-sensitive)
  let match = allPhases.find(p => p.name.trim() === trimmedInput);
  if (match) {
    console.log(`[PhaseMatching] ✅ Found exact match: "${match.name}"`);
    return match;
  }

  // Strategy 2: Case-insensitive match
  match = allPhases.find(p => p.name.trim().toLowerCase() === trimmedInput.toLowerCase());
  if (match) {
    console.log(`[PhaseMatching] ✅ Found case-insensitive match: "${match.name}"`);
    return match;
  }

  // Strategy 3: Core name matching (removes number prefixes)
  const coreInputName = extractCorePhaseeName(trimmedInput);
  if (coreInputName) {
    for (const phase of allPhases) {
      const coreExistingName = extractCorePhaseeName(phase.name);
      if (coreInputName.toLowerCase() === coreExistingName.toLowerCase()) {
        console.log(`[PhaseMatching] ✅ Found core name match on "${phase.name}"`);
        return phase;
      }
    }
  }

  // Strategy 4: Fuzzy matching on full names
  for (const phase of allPhases) {
    if (fuzzyMatchPhaseNames(trimmedInput, phase.name)) {
      console.log(`[PhaseMatching] ✅ Found fuzzy match on "${phase.name}"`);
      return phase;
    }
  }

  console.log(`[PhaseMatching] ❌ No match found for: "${trimmedInput}"`);
  return null;
}
