import { format } from 'date-fns';

/**
 * Date format options for company settings
 */
export interface DateFormatOption {
  value: string;
  label: string;
  description: string;
}

/**
 * Generate date format options with today's date as example
 */
function generateDateFormatOptions(): DateFormatOption[] {
  const today = new Date();

  const formats = [
    { value: 'dd-MM-yyyy', pattern: 'DD-MM-YYYY', description: 'EU Standard' },
    { value: 'MM-dd-yyyy', pattern: 'MM-DD-YYYY', description: 'US Standard' },
    { value: 'yyyy-MM-dd', pattern: 'YYYY-MM-DD', description: 'ISO Standard' },
    { value: 'dd/MM/yyyy', pattern: 'DD/MM/YYYY', description: 'EU with slashes' },
    { value: 'MM/dd/yyyy', pattern: 'MM/DD/YYYY', description: 'US with slashes' },
    { value: 'dd MMM yyyy', pattern: 'DD MMM YYYY', description: 'Short month' },
    { value: 'MMM dd, yyyy', pattern: 'MMM DD, YYYY', description: 'US with month' },
  ];

  return formats.map(({ value, pattern, description }) => ({
    value,
    label: `${pattern} (${format(today, value)})`,
    description,
  }));
}

export const DATE_FORMAT_OPTIONS: DateFormatOption[] = generateDateFormatOptions();

export const DEFAULT_DATE_FORMAT = 'dd-MM-yyyy';

/**
 * Format a date for display using the specified format
 * @param date - Date string, Date object, null, or undefined
 * @param dateFormat - date-fns format string (default: 'dd-MM-yyyy')
 * @returns Formatted date string or '-' if invalid/empty
 */
export function formatDisplayDate(
  date: string | Date | null | undefined,
  dateFormat: string = DEFAULT_DATE_FORMAT
): string {
  if (!date) return '-';

  try {
    let dateObj: Date;
    if (typeof date === 'string') {
      // For date-only strings (YYYY-MM-DD), parse as local date to avoid timezone shift
      // new Date("2026-03-27") parses as UTC midnight, which shifts to previous day in positive timezones
      const dateOnlyMatch = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (dateOnlyMatch) {
        const [, year, month, day] = dateOnlyMatch;
        dateObj = new Date(Number(year), Number(month) - 1, Number(day));
      } else {
        dateObj = new Date(date);
      }
    } else {
      dateObj = date;
    }
    if (isNaN(dateObj.getTime())) return '-';
    return format(dateObj, dateFormat);
  } catch {
    return '-';
  }
}

/**
 * Get the label for a date format value
 * @param value - date-fns format string
 * @returns Format label or the value itself if not found
 */
export function getDateFormatLabel(value: string): string {
  const option = DATE_FORMAT_OPTIONS.find(opt => opt.value === value);
  return option?.label || value;
}

/**
 * Validate if a format string is a valid option
 * @param value - Format string to validate
 * @returns true if valid, false otherwise
 */
export function isValidDateFormat(value: string): boolean {
  return DATE_FORMAT_OPTIONS.some(opt => opt.value === value);
}
