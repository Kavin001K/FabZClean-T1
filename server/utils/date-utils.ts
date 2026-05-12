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
    
    // IST is UTC + 5.5 hours
    const istTime = d.getTime() + (5.5 * 60 * 60 * 1000);
    return new Date(istTime).toISOString().split('T')[0];
  } catch (e) {
    return null;
  }
}

/**
 * Gets the current date in IST (YYYY-MM-DD)
 * @returns YYYY-MM-DD string in IST
 */
export function getTodayIST(): string {
  const now = new Date();
  const istNow = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
  return istNow.toISOString().split('T')[0];
}
