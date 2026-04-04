
export function formatDate(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    return 'Invalid date';
  }
  
  // Format as Month Day, Year (e.g., "May 15, 2023")
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export function formatDateToLocalISO(date: Date): string {
  if (!date || isNaN(date.getTime())) {
    console.error(`[formatDateToLocalISO] Invalid date provided:`, date);
    throw new Error('Invalid date provided to formatDateToLocalISO');
  }
  
  // Format date in local timezone as YYYY-MM-DD for PostgreSQL DATE type
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const formatted = `${year}-${month}-${day}`;
  
  console.log(`[formatDateToLocalISO] Input date: ${date.toISOString()}, Output: ${formatted}`);
  return formatted;
}

/**
 * Debug function to test date formatting with detailed logging
 */
export function testDateFormatting(date: Date): void {
  console.log('=== Date Formatting Test ===');
  console.log('Input date:', date);
  console.log('Date valid?', !isNaN(date.getTime()));
  console.log('ISO string:', date.toISOString());
  console.log('Local date string:', date.toDateString());
  console.log('getFullYear():', date.getFullYear());
  console.log('getMonth() + 1:', date.getMonth() + 1);
  console.log('getDate():', date.getDate());
  
  try {
    const localISO = formatDateToLocalISO(date);
    console.log('Local ISO:', localISO);
    console.log('Formatted display:', formatDate(date));
  } catch (error) {
    console.error('Date formatting error:', error);
  }
  console.log('===========================');
}
