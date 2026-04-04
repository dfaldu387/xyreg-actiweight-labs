
/**
 * Utility functions for Notified Body operations
 */

/**
 * Format a Notified Body number to 4-digit string with leading zeros
 * @param nbNumber - The NB number as integer
 * @returns Formatted 4-digit string (e.g., 44 -> "0044", 1234 -> "1234")
 */
export function formatNotifiedBodyNumber(nbNumber: number): string {
  return nbNumber.toString().padStart(4, '0');
}

/**
 * Parse a potentially formatted NB number back to integer
 * @param nbNumberString - The NB number as string (e.g., "0044" or "44")
 * @returns The NB number as integer
 */
export function parseNotifiedBodyNumber(nbNumberString: string): number {
  return parseInt(nbNumberString, 10);
}
