/**
 * Safely format a number as currency
 * Handles undefined, null, and invalid values
 */
export function formatCurrency(
  value: number | string | undefined | null,
  options: {
    locale?: string;
    currency?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  } = {}
): string {
  const {
    locale = 'en-US',
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
  } = options;

  // Handle undefined, null, or invalid values
  if (value === undefined || value === null || value === '') {
    return '0.00';
  }

  // Convert string to number
  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  // Check if conversion resulted in NaN
  if (isNaN(numValue)) {
    return '0.00';
  }

  try {
    return numValue.toLocaleString(locale, {
      minimumFractionDigits,
      maximumFractionDigits,
    });
  } catch (error) {
    // Fallback to fixed decimal if toLocaleString fails
    return numValue.toFixed(minimumFractionDigits);
  }
}

/**
 * Format Indian Rupees
 */
export function formatINR(value: number | string | undefined | null): string {
  return formatCurrency(value, {
    locale: 'en-IN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Format USD
 */
export function formatUSD(value: number | string | undefined | null): string {
  return formatCurrency(value, {
    locale: 'en-US',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Format percentage
 */
export function formatPercent(value: number | string | undefined | null, decimals: number = 1): string {
  if (value === undefined || value === null || value === '') {
    return '0.0';
  }

  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numValue)) {
    return '0.0';
  }

  return numValue.toFixed(decimals);
}
