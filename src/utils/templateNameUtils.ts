/**
 * Utility functions for template name prefix handling.
 */

/** Strip leading doc prefix (e.g., "SOP-014 ", "RISK-003 ") from a template name for display */
export function stripDocPrefix(name: string): string {
  return name.replace(/^[A-Z]{2,6}-\d{3}\s+/, '');
}

/** Detect doc category and number from a template name */
export function detectDocCategory(name: string): { prefix: string; number: string } | null {
  const match = name.match(/^([A-Z]{2,6})-(\d{3})/);
  if (match) {
    return { prefix: match[1], number: match[2] };
  }
  return null;
}
