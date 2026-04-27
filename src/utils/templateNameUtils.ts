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

/**
 * Split a document name like "SOP-014 Clinical Evaluation" or
 * "SOP-CL-014 Clinical Evaluation" into its prefix token and the
 * remaining title. Falls back to `{ prefix: '', title: name }` when
 * no recognisable prefix is present.
 */
export function splitDocPrefix(name: string): { prefix: string; title: string } {
  if (!name) return { prefix: '', title: '' };
  // Matches TYPE-NNN or TYPE-SUBTYPE-NNN (e.g. SOP-014 or SOP-CL-014)
  const match = name.match(/^([A-Z]{2,6}(?:-[A-Z]{2,4})?-\d{2,4})\s+(.*)$/);
  if (match) {
    return { prefix: match[1], title: match[2] };
  }
  return { prefix: '', title: name };
}
