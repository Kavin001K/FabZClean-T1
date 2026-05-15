/**
 * Date utility functions for the server
 */

/**
 * Converts a date string or object to an IST (UTC+5.5) date string (YYYY-MM-DD)
 * @param dateVal The date value to convert
 * @returns YYYY-MM-DD string in IST or null if invalid
 */
export function toISTDateString(dateVal: any): string | null {
  if (!dateVal) return null;
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return null;
    
    // Format to Asia/Kolkata using Intl API
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(d);
    
    const year = parts.find(p => p.type === 'year')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const day = parts.find(p => p.type === 'day')?.value;
    
    if (year && month && day) {
        return `${year}-${month}-${day}`;
    }
    return null;
  } catch (e) {
    return null;
  }
}

/**
 * Gets the current date in IST (YYYY-MM-DD)
 * @returns YYYY-MM-DD string in IST
 */
export function getTodayIST(): string {
  const d = new Date();
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(d);
  
  const year = parts.find(p => p.type === 'year')?.value;
  const month = parts.find(p => p.type === 'month')?.value;
  const day = parts.find(p => p.type === 'day')?.value;
  
  return `${year}-${month}-${day}`;
}
