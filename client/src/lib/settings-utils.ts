/**
 * Settings utility functions
 * These functions format data based on user settings
 */

import { format, parseISO } from 'date-fns';

/**
 * Format currency based on settings
 */
export function formatCurrencyWithSettings(
  amount: number | string,
  currency: string = 'INR',
  showSymbol: boolean = true
): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numAmount)) return '₹0.00';

  const currencyMap: Record<string, { symbol: string; locale: string }> = {
    INR: { symbol: '₹', locale: 'en-IN' },
    USD: { symbol: '$', locale: 'en-US' },
    EUR: { symbol: '€', locale: 'de-DE' },
    AED: { symbol: 'د.إ', locale: 'ar-AE' },
  };

  const currencyInfo = currencyMap[currency] || currencyMap['INR'];

  if (!showSymbol) {
    return numAmount.toLocaleString(currencyInfo.locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  return `${currencyInfo.symbol}${numAmount.toLocaleString(currencyInfo.locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Round invoice amount based on settings
 */
export function roundInvoiceAmount(
  amount: number,
  strategy: 'none' | 'nearest_1' | 'nearest_5' = 'nearest_1'
): number {
  if (strategy === 'none') return amount;
  if (strategy === 'nearest_5') return Math.round(amount / 5) * 5;
  return Math.round(amount);
}

/**
 * Format date based on settings
 */
export function formatDateWithSettings(
  date: string | Date,
  dateFormat: string = 'DD/MM/YYYY'
): string {
  if (!date) return '';

  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;

    const formatMap: Record<string, string> = {
      'DD/MM/YYYY': 'dd/MM/yyyy',
      'MM/DD/YYYY': 'MM/dd/yyyy',
      'YYYY-MM-DD': 'yyyy-MM-dd',
    };

    const formatString = formatMap[dateFormat] || 'dd/MM/yyyy';
    return format(parsedDate, formatString);
  } catch (error) {
    console.error('Error formatting date:', error);
    return String(date);
  }
}

/**
 * Format date and time based on settings
 */
export function formatDateTimeWithSettings(
  date: string | Date,
  dateFormat: string = 'DD/MM/YYYY',
  timeFormat: '12' | '24' = '24'
): string {
  if (!date) return '';

  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;

    const formatMap: Record<string, string> = {
      'DD/MM/YYYY': 'dd/MM/yyyy',
      'MM/DD/YYYY': 'MM/dd/yyyy',
      'YYYY-MM-DD': 'yyyy-MM-dd',
    };

    const dateFormatString = formatMap[dateFormat] || 'dd/MM/yyyy';
    const timeFormatString = timeFormat === '12' ? 'hh:mm a' : 'HH:mm';

    return format(parsedDate, `${dateFormatString} ${timeFormatString}`);
  } catch (error) {
    console.error('Error formatting date time:', error);
    return String(date);
  }
}

/**
 * Convert date to user's timezone
 */
export function convertToTimezone(
  date: string | Date,
  timezone: string = 'Asia/Kolkata'
): Date {
  if (!date) return new Date();

  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    // For now, return as-is. Full timezone conversion would require a library like date-fns-tz
    return parsedDate;
  } catch (error) {
    console.error('Error converting timezone:', error);
    return new Date();
  }
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currency: string = 'INR'): string {
  const currencySymbols: Record<string, string> = {
    INR: '₹',
    USD: '$',
    EUR: '€',
    AED: 'د.إ',
  };

  return currencySymbols[currency] || '₹';
}

/**
 * Check if current time is within operating hours
 */
export function isWithinOperatingHours(
  operatingHours: { start: string; end: string; workingDays: string[] }
): boolean {
  const now = new Date();
  const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

  // Check if today is a working day
  if (!operatingHours.workingDays.includes(currentDay)) {
    return false;
  }

  // Check if current time is within operating hours
  const [startHour, startMinute] = operatingHours.start.split(':').map(Number);
  const [endHour, endMinute] = operatingHours.end.split(':').map(Number);

  const startTime = startHour * 60 + startMinute;
  const endTime = endHour * 60 + endMinute;
  const currentTime = now.getHours() * 60 + now.getMinutes();

  return currentTime >= startTime && currentTime <= endTime;
}

/**
 * Calculate delivery fee based on settings
 */
export function calculateDeliveryFee(
  orderAmount: number,
  deliveryFeeSettings: number,
  minimumForFreeDelivery: number = 500
): number {
  if (orderAmount >= minimumForFreeDelivery) {
    return 0;
  }
  return deliveryFeeSettings;
}

/**
 * Calculate advance payment amount
 */
export function calculateAdvancePayment(
  totalAmount: number,
  advancePaymentPercentage: number,
  advancePaymentRequired: boolean
): number {
  if (!advancePaymentRequired) return 0;
  return (totalAmount * advancePaymentPercentage) / 100;
}

/**
 * Validate minimum order amount
 */
export function meetsMinimumOrder(
  orderAmount: number,
  minimumOrderAmount: number
): boolean {
  return orderAmount >= minimumOrderAmount;
}

/**
 * Get theme CSS variables
 */
export function getThemeCSSVariables(primaryColor: string): Record<string, string> {
  // Convert hex to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
      : { r: 59, g: 130, b: 246 }; // default blue
  };

  const rgb = hexToRgb(primaryColor);

  return {
    '--primary': `${rgb.r} ${rgb.g} ${rgb.b}`,
    '--primary-foreground': '255 255 255',
  };
}

/**
 * Apply theme to document
 */
export function applyTheme(theme: 'light' | 'dark' | 'system'): void {
  const root = document.documentElement;

  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('dark', prefersDark);
  } else {
    root.classList.toggle('dark', theme === 'dark');
  }
}

/**
 * Apply primary color
 */
export function applyPrimaryColor(primaryColor: string): void {
  const root = document.documentElement;
  const cssVars = getThemeCSSVariables(primaryColor);

  Object.entries(cssVars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
}
