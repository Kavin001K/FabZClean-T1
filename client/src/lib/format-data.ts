/**
 * Data formatting utility for safe display of values
 * Handles null, undefined, or missing values gracefully
 */

/**
 * Format text values - returns "Nill" for missing text
 */
export function formatText(value: string | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return 'Nill';
  }
  return String(value);
}

/**
 * Format number values - returns "0" for missing numbers
 */
export function formatNumber(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return '0';
  }
  
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) {
    return '0';
  }
  
  return num.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

/**
 * Format currency values - returns "₹0" for missing amounts
 */
export function formatCurrency(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return '₹0';
  }
  
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) {
    return '₹0';
  }
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Format status values - returns "NI" (No Info) for missing status
 */
export function formatStatus(value: string | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return 'NI';
  }
  return String(value);
}

/**
 * Format date values - returns "Nill" for missing dates
 */
export function formatDate(
  value: string | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (value === null || value === undefined || value === '') {
    return 'Nill';
  }
  
  try {
    const date = typeof value === 'string' ? new Date(value) : value;
    
    if (isNaN(date.getTime())) {
      return 'Nill';
    }
    
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...options,
    });
  } catch {
    return 'Nill';
  }
}

/**
 * Format date and time - returns "Nill" for missing datetime
 */
export function formatDateTime(
  value: string | Date | null | undefined
): string {
  if (value === null || value === undefined || value === '') {
    return 'Nill';
  }
  
  try {
    const date = typeof value === 'string' ? new Date(value) : value;
    
    if (isNaN(date.getTime())) {
      return 'Nill';
    }
  
    return date.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Nill';
  }
}

/**
 * Format percentage - returns "0%" for missing percentages
 */
export function formatPercentage(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return '0%';
  }
  
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) {
    return '0%';
  }
  
  return `${num.toFixed(1)}%`;
}

/**
 * Main formatData function - smart formatter that detects type
 */
export function formatData(
  value: any,
  type: 'text' | 'number' | 'currency' | 'status' | 'date' | 'datetime' | 'percentage' = 'text'
): string {
  switch (type) {
    case 'text':
      return formatText(value);
    case 'number':
      return formatNumber(value);
    case 'currency':
      return formatCurrency(value);
    case 'status':
      return formatStatus(value);
    case 'date':
      return formatDate(value);
    case 'datetime':
      return formatDateTime(value);
    case 'percentage':
      return formatPercentage(value);
    default:
      return formatText(value);
  }
}

