// Check character calculation utilities for UDI agencies

/**
 * Calculate GS1 check digit using the standard algorithm
 * @param code - The code without check digit
 * @returns The calculated check digit
 */
export function calculateGS1CheckDigit(code: string): string {
  const digits = code.split('').map(Number);
  let sum = 0;
  
  for (let i = 0; i < digits.length; i++) {
    const weight = i % 2 === 0 ? 1 : 3;
    sum += digits[i] * weight;
  }
  
  const remainder = sum % 10;
  return remainder === 0 ? '0' : (10 - remainder).toString();
}

/**
 * Calculate HIBCC check character using modulo 43 algorithm
 * @param code - The code without check character
 * @returns The calculated check character
 */
export function calculateHIBCCCheckCharacter(code: string): string {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ-. $/+%';
  let sum = 0;
  
  for (let i = 0; i < code.length; i++) {
    const char = code[i];
    const value = chars.indexOf(char);
    if (value === -1) {
      throw new Error(`Invalid character '${char}' in HIBCC code`);
    }
    sum += value;
  }
  
  const remainder = sum % 43;
  return chars[remainder];
}

/**
 * Calculate ICCBBA check character using modulo 23 algorithm
 * @param code - The code without check character
 * @returns The calculated check character
 */
export function calculateICCBBACheckCharacter(code: string): string {
  const chars = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let sum = 0;
  
  for (let i = 0; i < code.length; i++) {
    const char = code[i];
    const value = chars.indexOf(char);
    if (value === -1) {
      throw new Error(`Invalid character '${char}' in ICCBBA code`);
    }
    sum += value * (i + 1);
  }
  
  const remainder = sum % 23;
  return chars[remainder];
}

/**
 * Calculate check character based on issuing agency
 * @param agency - The issuing agency (GS1, HIBCC, ICCBBA)
 * @param code - The code without check character
 * @returns The calculated check character
 */
export function calculateCheckCharacter(agency: string, code: string): string {
  switch (agency) {
    case 'GS1':
      return calculateGS1CheckDigit(code);
    case 'HIBCC':
      return calculateHIBCCCheckCharacter(code);
    case 'ICCBBA':
      return calculateICCBBACheckCharacter(code);
    default:
      throw new Error(`Unknown issuing agency: ${agency}`);
  }
}

/**
 * Generate formatted Basic UDI-DI based on agency
 * @param agency - The issuing agency
 * @param companyPrefix - Company prefix/identifier
 * @param internalReference - Internal reference number
 * @param checkCharacter - Check character/digit
 * @returns Formatted Basic UDI-DI
 */
export function formatBasicUDI(
  agency: string,
  companyPrefix: string,
  internalReference: string,
  checkCharacter: string
): string {
  const combinedCode = `${companyPrefix}${internalReference}`;
  
  switch (agency) {
    case 'GS1':
      return `(01)${combinedCode}${checkCharacter}`;
    case 'HIBCC':
      return `+${combinedCode}${checkCharacter}`;
    case 'ICCBBA':
      return `=${combinedCode}${checkCharacter}`;
    default:
      return `${combinedCode}${checkCharacter}`;
  }
}

/**
 * Generate GTIN-14 formatted UDI-DI for product labels
 * @param agency - The issuing agency
 * @param companyPrefix - Company prefix/identifier
 * @param itemReference - Item reference number
 * @param packageLevelIndicator - Package level indicator (0-9)
 * @returns Formatted UDI-DI
 */
export function generateUDIDI(
  agency: string,
  companyPrefix: string,
  itemReference: string,
  packageLevelIndicator: number = 0
): string {
  // Create the full code without check digit
  const baseCode = `${packageLevelIndicator}${companyPrefix}${itemReference}`;
  
  // Calculate check digit
  const checkDigit = calculateCheckCharacter(agency, baseCode);
  
  // Format based on agency
  switch (agency) {
    case 'GS1':
      return `(01)${baseCode}${checkDigit}`;
    case 'HIBCC':
      return `+${baseCode}${checkDigit}`;
    case 'ICCBBA':
      return `=${baseCode}${checkDigit}`;
    default:
      return `${baseCode}${checkDigit}`;
  }
}

/**
 * Validate UDI-DI format and check digit
 * @param udiDI - The UDI-DI to validate
 * @param agency - The issuing agency
 * @returns Object with validation result and error message
 */
export function validateUDIDI(udiDI: string, agency: string): { valid: boolean; error?: string } {
  try {
    // Remove formatting prefixes
    let cleanCode = udiDI;
    switch (agency) {
      case 'GS1':
        if (!cleanCode.startsWith('(01)')) {
          return { valid: false, error: 'GS1 UDI-DI must start with (01)' };
        }
        cleanCode = cleanCode.substring(4);
        break;
      case 'HIBCC':
        if (!cleanCode.startsWith('+')) {
          return { valid: false, error: 'HIBCC UDI-DI must start with +' };
        }
        cleanCode = cleanCode.substring(1);
        break;
      case 'ICCBBA':
        if (!cleanCode.startsWith('=')) {
          return { valid: false, error: 'ICCBBA UDI-DI must start with =' };
        }
        cleanCode = cleanCode.substring(1);
        break;
    }

    // Check minimum length
    if (cleanCode.length < 8) {
      return { valid: false, error: 'UDI-DI must be at least 8 characters long' };
    }

    // Extract check digit
    const checkDigit = cleanCode.slice(-1);
    const codeWithoutCheck = cleanCode.slice(0, -1);

    // Calculate expected check digit
    const expectedCheckDigit = calculateCheckCharacter(agency, codeWithoutCheck);

    if (checkDigit !== expectedCheckDigit) {
      return { valid: false, error: 'Invalid check digit' };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Invalid UDI-DI format' };
  }
}

/**
 * Get packaging level options
 * @returns Array of packaging level options
 */
export function getPackagingLevels(): { value: number; label: string; description: string; example: string }[] {
  return [
    { 
      value: 0, 
      label: 'Unit of Use', 
      description: 'The smallest individual item intended for use on a single patient. This is the actual device as dispensed or applied.',
      example: 'A single catheter, one syringe, or an individual sterile dressing'
    },
    { 
      value: 1, 
      label: 'Each', 
      description: 'The lowest level of packaging that carries a UDI barcode. Often the primary package containing one unit.',
      example: 'A box containing one pacemaker, or a pouch with one surgical instrument'
    },
    { 
      value: 2, 
      label: 'Inner Pack', 
      description: 'An intermediate package that groups multiple "Each" items together for handling efficiency.',
      example: '10 individual syringes bundled together inside a shrink-wrap'
    },
    { 
      value: 3, 
      label: 'Case', 
      description: 'A shipping container that holds multiple inner packs. Standard logistics unit for hospital orders.',
      example: 'A cardboard box containing 10 inner packs (100 total syringes)'
    },
    { 
      value: 4, 
      label: 'Pallet', 
      description: 'The highest logistics level, containing multiple cases for warehouse storage and transport.',
      example: 'A pallet with 48 cases for bulk shipment to distribution centers'
    },
    { 
      value: 5, 
      label: 'Display Pack', 
      description: 'Retail-ready packaging designed for point-of-sale display in pharmacies or retail stores.',
      example: 'A countertop display box of blood glucose test strips'
    },
    { 
      value: 6, 
      label: 'Variety Pack', 
      description: 'A package containing a mix of different but related products sold as one SKU.',
      example: 'A wound care kit with multiple dressing sizes and types'
    },
    { 
      value: 7, 
      label: 'Set/Kit', 
      description: 'A procedural set or kit with multiple components needed together for a clinical procedure.',
      example: 'A surgical tray with scalpels, clamps, and sutures for a procedure'
    },
    { 
      value: 8, 
      label: 'Variable Measure', 
      description: 'Items sold by variable weight, length, or quantity where packaging varies.',
      example: 'Surgical mesh sold by the meter, or tubing sold by length'
    },
    { 
      value: 9, 
      label: 'Reserved', 
      description: 'Reserved by GS1 for future use. Do not use unless directed by a regulatory authority.',
      example: 'Not currently applicable'
    }
  ];
}