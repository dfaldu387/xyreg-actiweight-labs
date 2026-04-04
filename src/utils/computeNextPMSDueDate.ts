/**
 * Central utility to compute the next PMS due date based on:
 * - Device class (determines interval: Class I = none, IIa = 24mo, IIb/III = 12mo)
 * - Launch date (anchor for first review)
 * - Latest PMS report date (anchor for subsequent reviews)
 * 
 * This replaces the static `post_market_surveillance_date` field as the primary source.
 */

import { formatDeviceClassCode } from './deviceClassUtils';

export interface PMSDueDateResult {
  /** Next PMS review due date, or null if not applicable */
  nextDueDate: Date | null;
  /** Interval in months between reviews */
  intervalMonths: number;
  /** Human-readable interval label */
  intervalLabel: string;
  /** Whether this class requires periodic PMS */
  requiresPeriodicPMS: boolean;
  /** Normalized device class used */
  deviceClass: string | null;
}

/**
 * Get the PMS interval in months for a given device class (EU MDR rules).
 * Class I: no periodic review (returns 0)
 * Class IIa: every 2 years (24 months)
 * Class IIb / III: every year (12 months)
 */
export function getPMSIntervalMonths(deviceClass: string | null | undefined): number {
  const normalized = formatDeviceClassCode(deviceClass);
  if (!normalized) return 12; // default fallback

  switch (normalized) {
    case 'I':
    case 'Is':
    case 'Im':
    case 'Ir':
      return 0; // No periodic PMS
    case 'IIa':
      return 24; // Every 2 years
    case 'IIb':
    case 'III':
      return 12; // Every year
    default:
      return 12; // Default to annual
  }
}

/**
 * Get a human-readable label for the PMS interval.
 */
export function getPMSIntervalLabel(deviceClass: string | null | undefined): string {
  const normalized = formatDeviceClassCode(deviceClass);
  if (!normalized) return 'Annual review';

  switch (normalized) {
    case 'I':
    case 'Is':
    case 'Im':
    case 'Ir':
      return 'No periodic PMS required';
    case 'IIa':
      return 'PSUR every 2 years';
    case 'IIb':
      return 'PSUR every year';
    case 'III':
      return 'PSUR every year';
    default:
      return 'Annual review';
  }
}

/**
 * Compute the next PMS due date.
 * 
 * @param deviceClass - The device class (e.g., "class-iia", "IIb", "III")
 * @param anchorDate - The anchor date (launch date or latest PMS report date)
 * @returns PMSDueDateResult with computed next due date
 */
export function computeNextPMSDueDate(
  deviceClass: string | null | undefined,
  anchorDate: Date | string | null | undefined
): PMSDueDateResult {
  const normalized = formatDeviceClassCode(deviceClass);
  const intervalMonths = getPMSIntervalMonths(deviceClass);
  const intervalLabel = getPMSIntervalLabel(deviceClass);
  const requiresPeriodicPMS = intervalMonths > 0;

  if (!requiresPeriodicPMS || !anchorDate) {
    return {
      nextDueDate: null,
      intervalMonths,
      intervalLabel,
      requiresPeriodicPMS,
      deviceClass: normalized,
    };
  }

  const anchor = typeof anchorDate === 'string' ? new Date(anchorDate) : anchorDate;
  const today = new Date();

  // Roll forward from anchor until we find the next future date
  let nextReview = new Date(anchor);
  while (nextReview <= today) {
    nextReview.setMonth(nextReview.getMonth() + intervalMonths);
  }

  return {
    nextDueDate: nextReview,
    intervalMonths,
    intervalLabel,
    requiresPeriodicPMS,
    deviceClass: normalized,
  };
}
