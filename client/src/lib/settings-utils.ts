import { format } from 'date-fns';

/**
 * Utility to get settings safely from localStorage without Hook rules
 * Useful for non-React files (like API services)
 */
export function getStoredSettings() {
  try {
    const stored = localStorage.getItem('fabzclean_settings_v1');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

/**
 * Format currency using stored settings or defaults
 */
export function formatCurrency(amount: number | string): string {
  const settings = getStoredSettings();
  const currency = settings?.currency || 'INR';

  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0.00';

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2
  }).format(num);
}

/**
 * Check if printing should happen automatically
 */
export function shouldAutoPrint(): boolean {
  const settings = getStoredSettings();
  return settings?.autoPrintInvoice === true;
}
