/**
 * Device class normalization utilities for PMS activity template matching
 * Handles conversion between different device class formats used across the system
 */

/**
 * Normalize device class from product format to template format
 * Examples:
 * - "class-iia" → "IIa"
 * - "class-iib" → "IIb"
 * - "class-iii" → "III"
 * - "Class IIa" → "IIa"
 */
export function normalizeDeviceClassForTemplate(deviceClass: string | null | undefined): string | null {
  if (!deviceClass) return null;
  
  const normalized = deviceClass
    .toLowerCase()
    .replace(/^class[\s-]*/, '') // Remove "class" prefix and optional separator
    .trim();
  
  const classMap: Record<string, string> = {
    'i': 'I',
    'is': 'Is',
    'im': 'Im',
    'ir': 'Ir',
    'ii': 'II',
    'iia': 'IIa',
    'iib': 'IIb',
    'iii': 'III',
    'a': 'A',
    'b': 'B',
    'c': 'C',
    'd': 'D'
  };
  
  return classMap[normalized] || null;
}
