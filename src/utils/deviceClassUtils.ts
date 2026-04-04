// Utility helpers to format device class values consistently for display
// Converts small-caps or irregular inputs (e.g., "class iia", "iia", "ii a", "class c")
// into standardized labels like "Class IIa" or "Class C" without changing DB values.

export function formatDeviceClassCode(input?: string | null): string {
  const raw = (input ?? '').toString().trim();
  if (!raw) return '';

  // Normalize
  let normalized = raw.toLowerCase();
  // Remove the word 'class' and any non-letters (spaces, hyphens, punctuation, digits)
  normalized = normalized.replace(/class/g, '');
  normalized = normalized.replace(/[^a-z]/g, '');

  const map: Record<string, string> = {
    i: 'I',
    ii: 'II',
    iii: 'III',
    is: 'Is',
    im: 'Im',
    ir: 'Ir',
    iia: 'IIa',
    iib: 'IIb',
    a: 'A',
    b: 'B',
    c: 'C',
    d: 'D',
    // EUDAMED lowercase formats
    'classi': 'I',
    'classiia': 'IIa',
    'classiib': 'IIb',
    'classiii': 'III',
  };

  if (map[normalized]) return map[normalized];

  // Fallback: try to preserve original meaning – remove leading 'Class' and trim, then basic capitalization
  const fallback = raw.replace(/^class\s+/i, '').trim();
  // Capitalize first letter and keep rest as-is
  return fallback.charAt(0).toUpperCase() + fallback.slice(1);
}

export function formatDeviceClassLabel(input?: string | null): string {
  const code = formatDeviceClassCode(input);
  if (!code) return 'Class -';
  return `Class ${code}`;
}

// Enhanced EUDAMED risk class mapping for comprehensive support
export function mapEudamedRiskClass(eudamedRiskClass?: string | null): string {
  if (!eudamedRiskClass) return '';
  
  const normalized = eudamedRiskClass.toLowerCase().trim();
  
  // EUDAMED-specific risk class mappings
  const eudamedMap: Record<string, string> = {
    // Standard MD classes
    'class-i': 'I',
    'class-iia': 'IIa', 
    'class-iib': 'IIb',
    'class-iii': 'III',
    
    // Alternative formats
    'class i': 'I',
    'class iia': 'IIa',
    'class iib': 'IIb', 
    'class iii': 'III',
    
    // IVD classes
    'ivd-annex-ii-list-a': 'IIa',
    'ivd-annex-ii-list-b': 'IIb',
    'ivd-class-c': 'III',
    'ivd-class-d': 'III',
    
    // General IVD
    'class a': 'A',
    'class b': 'B',
    'class c': 'C',
    'class d': 'D',
    
    // Legacy formats
    'i': 'I',
    'iia': 'IIa',
    'iib': 'IIb',
    'iii': 'III'
  };
  
  // Try exact match first
  if (eudamedMap[normalized]) {
    return eudamedMap[normalized];
  }
  
  // Fallback to general formatter
  return formatDeviceClassCode(eudamedRiskClass);
}
