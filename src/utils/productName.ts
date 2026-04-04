// Utility functions for product name formatting
// Removes trailing numeric codes in parentheses, e.g., "ENJOY E-F2 330 (838497)" -> "ENJOY E-F2 330"
export function sanitizeProductName(name: string | undefined | null): string {
  if (!name) return '';
  // Trim spaces, then remove a trailing parenthetical containing only digits (with optional spaces)
  return String(name).trim().replace(/\s*\(\s*\d+\s*\)\s*$/, '');
}
