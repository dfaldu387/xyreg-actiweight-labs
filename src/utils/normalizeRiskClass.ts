/**
 * Normalizes risk class values to canonical format.
 * Converts legacy "class_i" format to "I" format for consistency.
 */
export function normalizeRiskClass(value: string | undefined | null): string {
  if (!value || value.trim() === '') return '';
  
  const normalized = value.trim().toLowerCase();
  
  // Convert legacy class_* and "Class X" format to canonical format
  const legacyMapping: Record<string, string> = {
    'class_i': 'I',
    'class_ia': 'Ia',
    'class_ib': 'Ib',
    'class_iia': 'IIa',
    'class_iib': 'IIb',
    'class_ii': 'II',
    'class_iii': 'III',
    'class i': 'I',
    'class ia': 'Ia',
    'class ib': 'Ib',
    'class is': 'Is',
    'class im': 'Im',
    'class ir': 'Ir',
    'class ii': 'II',
    'class iia': 'IIa',
    'class iib': 'IIb',
    'class iii': 'III',
    'class-i': 'I',
    'class-ia': 'Ia',
    'class-ib': 'Ib',
    'class-is': 'Is',
    'class-im': 'Im',
    'class-ir': 'Ir',
    'class-ii': 'II',
    'class-iia': 'IIa',
    'class-iib': 'IIb',
    'class-iii': 'III',
    'class-2a': 'IIa',
    'class-2b': 'IIb',
  };
  
  if (legacyMapping[normalized]) {
    return legacyMapping[normalized];
  }
  
  // Already canonical format - normalize case
  const canonicalMapping: Record<string, string> = {
    'i': 'I',
    'ia': 'Ia',
    'ib': 'Ib',
    'ii': 'II',
    'iia': 'IIa',
    'iib': 'IIb',
    'iii': 'III',
    'tbd': 'TBD',
  };
  
  if (canonicalMapping[normalized]) {
    return canonicalMapping[normalized];
  }
  
  // Return as-is if unrecognized (e.g., FDA classes, country-specific)
  return value.trim();
}

/**
 * Checks if a risk class represents a real classification (not empty, not TBD, not placeholder).
 */
export function isRealRiskClass(value: string | undefined | null): boolean {
  if (!value) return false;
  
  const normalized = normalizeRiskClass(value);
  if (normalized === '' || normalized === 'TBD') return false;
  
  // Check for placeholder values
  const placeholders = ['select class', 'select', 'not set', 'none', ''];
  if (placeholders.includes(normalized.toLowerCase())) return false;
  
  return true;
}
