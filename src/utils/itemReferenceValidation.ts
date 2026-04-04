/**
 * Item Reference Validation Utilities
 * Calculates available digit allocation based on GS1 company prefix length
 */

export interface ItemReferenceInfo {
  availableDigits: number;
  minValue: string;
  maxValue: string;
  capacity: number;
  formatDescription: string;
}

export interface ItemReferenceValidation {
  isValid: boolean;
  error?: string;
  warning?: string;
  paddedValue?: string;
}

export interface ItemReferenceSuggestion {
  nextSequential: string;      // max + 1 (e.g., "1171")
  lowestAvailable: string;     // First unused from 0001 (e.g., "0001")
  hasGaps: boolean;            // Are there gaps in the sequence?
  gapCount: number;            // How many unused numbers below max
  maxUsed: number;             // The highest number currently used
}

/**
 * Calculate available Item Reference digits based on company prefix length
 * GTIN-14 structure: 1 (package indicator) + company prefix + item reference + 1 (check digit) = 14
 * So: Item Reference digits = 14 - 1 - 1 - company prefix length = 12 - prefix length
 */
export function calculateItemReferenceDigits(companyPrefixLength: number, agency: string): number {
  if (agency !== 'GS1') {
    return 10; // Non-GS1 agencies don't have strict digit requirements
  }
  
  // GTIN-14: 14 digits total
  // 1 digit for package level indicator
  // 1 digit for check digit
  // Remaining = 12 - company prefix length
  const availableDigits = 12 - companyPrefixLength;
  return Math.max(1, Math.min(availableDigits, 10)); // Clamp between 1-10
}

/**
 * Detect item reference digit count from existing references
 * Analyzes actual usage pattern to determine realistic digit allocation
 */
export function detectDigitsFromUsedReferences(usedReferences: string[]): number {
  if (usedReferences.length === 0) return 4; // Default to 4 digits if no data
  
  // Find the max length of existing numeric references
  const numericRefs = usedReferences.filter(ref => /^\d+$/.test(ref));
  if (numericRefs.length === 0) return 4;
  
  const maxLength = Math.max(...numericRefs.map(ref => ref.length));
  return Math.max(maxLength, 4); // At least 4 digits
}

/**
 * Suggest next available Item Reference - returns both next sequential and lowest available
 */
export function suggestNextItemReference(
  usedReferences: string[], 
  availableDigits: number
): ItemReferenceSuggestion {
  const maxDigit = Math.pow(10, availableDigits) - 1;
  
  // Build Set for O(1) lookup
  const usedNumbers = new Set(
    usedReferences
      .map(ref => parseInt(ref, 10))
      .filter(n => !isNaN(n) && n > 0)
  );
  
  // Find max used
  const maxUsed = usedNumbers.size > 0 ? Math.max(...usedNumbers) : 0;
  
  // Next sequential (max + 1)
  const nextSeq = Math.min(maxUsed + 1, maxDigit);
  
  // Lowest available (first gap starting from 1)
  let lowestAvail = 1;
  while (usedNumbers.has(lowestAvail) && lowestAvail <= maxDigit) {
    lowestAvail++;
  }
  
  // Count gaps below max
  const gapCount = maxUsed > 0 ? maxUsed - usedNumbers.size : 0;
  
  return {
    nextSequential: nextSeq.toString().padStart(availableDigits, '0'),
    lowestAvailable: lowestAvail.toString().padStart(availableDigits, '0'),
    hasGaps: lowestAvail < maxUsed,
    gapCount,
    maxUsed
  };
}

/**
 * Get Item Reference range information
 * Now accepts optional usedReferences to intelligently detect digit count
 */
export function getItemReferenceInfo(
  companyPrefixLength: number, 
  agency: string,
  usedReferences: string[] = []
): ItemReferenceInfo {
  // Use intelligent detection if prefix is missing/empty but we have existing references
  let availableDigits: number;
  if (companyPrefixLength === 0 && usedReferences.length > 0) {
    availableDigits = detectDigitsFromUsedReferences(usedReferences);
  } else if (companyPrefixLength === 0) {
    availableDigits = 4; // Reasonable default instead of 10
  } else {
    availableDigits = calculateItemReferenceDigits(companyPrefixLength, agency);
  }
  
  const minValue = '0'.repeat(availableDigits);
  const maxValue = '9'.repeat(availableDigits);
  const capacity = Math.pow(10, availableDigits);
  
  const formatDescription = agency === 'GS1' 
    ? `${availableDigits}-digit numeric (${minValue} - ${maxValue})`
    : `Up to ${availableDigits} characters`;
  
  return {
    availableDigits,
    minValue,
    maxValue,
    capacity,
    formatDescription
  };
}

/**
 * Validate an Item Reference value
 */
export function validateItemReference(
  value: string, 
  companyPrefixLength: number, 
  agency: string,
  usedReferences: string[] = []
): ItemReferenceValidation {
  if (!value || value.trim() === '') {
    return { isValid: false, error: 'Item reference is required' };
  }
  
  const trimmedValue = value.trim();
  const info = getItemReferenceInfo(companyPrefixLength, agency, usedReferences);
  
  // For GS1, must be numeric only
  if (agency === 'GS1' && !/^\d+$/.test(trimmedValue)) {
    return { 
      isValid: false, 
      error: 'GS1 item reference must contain only numbers (0-9)' 
    };
  }
  
  // Check length
  if (trimmedValue.length > info.availableDigits) {
    return { 
      isValid: false, 
      error: `Too many digits! Maximum is ${info.availableDigits} for your prefix length` 
    };
  }
  
  // Check for duplicates (case-insensitive for non-numeric)
  const normalizedValue = agency === 'GS1' 
    ? trimmedValue.padStart(info.availableDigits, '0')
    : trimmedValue;
    
  const isDuplicate = usedReferences.some(ref => {
    const normalizedRef = agency === 'GS1' 
      ? ref.padStart(info.availableDigits, '0')
      : ref;
    return normalizedRef === normalizedValue;
  });
  
  if (isDuplicate) {
    return { 
      isValid: false, 
      error: 'This item reference is already in use within this Basic UDI-DI group' 
    };
  }
  
  // Check if needs zero-padding (warning, not error)
  if (agency === 'GS1' && trimmedValue.length < info.availableDigits) {
    const paddedValue = trimmedValue.padStart(info.availableDigits, '0');
    return { 
      isValid: true, 
      warning: `Will be zero-padded to ${paddedValue}`,
      paddedValue 
    };
  }
  
  return { isValid: true };
}

/**
 * Format an Item Reference with proper zero-padding
 */
export function formatItemReference(
  value: string, 
  companyPrefixLength: number, 
  agency: string,
  usedReferences: string[] = []
): string {
  if (!value) return '';
  
  const info = getItemReferenceInfo(companyPrefixLength, agency, usedReferences);
  
  if (agency === 'GS1') {
    // Pad with leading zeros for GS1
    return value.padStart(info.availableDigits, '0');
  }
  
  return value;
}

/**
 * Calculate capacity usage percentage
 */
export function calculateCapacityUsage(usedCount: number, totalCapacity: number): {
  percentage: number;
  remaining: number;
  status: 'low' | 'medium' | 'high' | 'critical';
} {
  const percentage = Math.round((usedCount / totalCapacity) * 100);
  const remaining = totalCapacity - usedCount;
  
  let status: 'low' | 'medium' | 'high' | 'critical';
  if (percentage >= 90) status = 'critical';
  else if (percentage >= 70) status = 'high';
  else if (percentage >= 40) status = 'medium';
  else status = 'low';
  
  return { percentage, remaining, status };
}
