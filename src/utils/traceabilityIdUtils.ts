/**
 * Utility functions for hierarchical dot-notation requirement IDs.
 * Implements the "Core-First" category priority rule.
 */

/** Category priority: highest index = highest priority */
export const CATEGORY_PRIORITY: string[] = [
  'C',    // Core — highest priority
  'DR',   // Safety / Design Risk
  'QMS',  // Regulatory
  'PD',   // Performance
  'GN',   // Genesis
  'DM',   // Document Management
  'SM',   // Supplier
  'TR',   // Training
];

/** Known base prefixes (without category suffix) */
const BASE_PREFIXES = ['UN-', 'SYSR-', 'SWR-', 'HWR-', 'SR-', 'RS-'];

/**
 * Extract the category suffix from any traceability ID.
 * e.g. "UN-DR-01" → "DR", "SYSR-C-01.1" → "C", "UN-QMS-03" → "QMS"
 */
export function extractCategorySuffix(id: string): string | null {
  // Try each known base prefix
  for (const base of BASE_PREFIXES) {
    if (id.startsWith(base)) {
      const rest = id.slice(base.length); // e.g. "DR-01" or "C-01.1"
      // The category is everything before the first digit-sequence at the end
      const match = rest.match(/^([A-Z]+)-/);
      if (match) {
        return match[1];
      }
      return null;
    }
  }
  return null;
}

/**
 * Extract the numeric lineage from any traceability ID.
 * e.g. "UN-C-01" → "01", "SYSR-C-01.1" → "01.1", "SWR-DR-03.2.1" → "03.2.1"
 */
export function extractLineageNumber(id: string): string | null {
  // Match everything after the last hyphen that starts with a digit
  // Pattern: after category suffix + hyphen, grab the rest (digits and dots)
  const match = id.match(/-(\d[\d.]*?)$/);
  if (match) {
    return match[1];
  }
  return null;
}

/**
 * Given multiple parent IDs, resolve the highest-priority category suffix.
 * Uses the Core-First rule: C > DR > QMS > PD > others alphabetical.
 */
export function resolveCategory(parentIds: string[]): string {
  if (parentIds.length === 0) return 'C'; // fallback

  const suffixes = parentIds
    .map(extractCategorySuffix)
    .filter((s): s is string => s !== null);

  if (suffixes.length === 0) return 'C'; // fallback

  // Find the one with the lowest index in CATEGORY_PRIORITY (= highest priority)
  let bestIndex = Infinity;
  let bestSuffix = suffixes[0];

  for (const suffix of suffixes) {
    const idx = CATEGORY_PRIORITY.indexOf(suffix);
    if (idx !== -1 && idx < bestIndex) {
      bestIndex = idx;
      bestSuffix = suffix;
    }
  }

  // If none matched the priority list, pick alphabetically first
  if (bestIndex === Infinity) {
    return suffixes.sort()[0];
  }

  return bestSuffix;
}

/**
 * Given multiple parent IDs and the resolved category, return the lineage
 * number from the parent whose category matched.
 * e.g. parents = ["UN-C-01", "UN-DR-02"], resolved = "C" → "01"
 */
export function resolveLineageBase(parentIds: string[], resolvedCategory: string): string {
  if (parentIds.length === 0) return '00'; // fallback for unlinked

  // Find the first parent whose category matches
  for (const id of parentIds) {
    const suffix = extractCategorySuffix(id);
    if (suffix === resolvedCategory) {
      const lineage = extractLineageNumber(id);
      if (lineage) return lineage;
    }
  }

  // Fallback: use first parent's lineage
  const firstLineage = extractLineageNumber(parentIds[0]);
  return firstLineage || '00';
}
