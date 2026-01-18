/**
 * Safe utility functions to prevent runtime errors
 * These functions provide defensive programming patterns for common operations
 */

/**
 * Safely parse a float value with fallback
 */
export function safeParseFloat(value: string | number | undefined | null, fallback = 0): number {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  const parsed = parseFloat(String(value));
  return isNaN(parsed) ? fallback : parsed;
}

/**
 * Safely parse an integer value with fallback
 */
export function safeParseInt(value: string | number | undefined | null, fallback = 0): number {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  const parsed = parseInt(String(value), 10);
  return isNaN(parsed) ? fallback : parsed;
}

/**
 * Safely reduce an array with type safety
 */
export function safeReduce<T, R>(
  arr: T[] | undefined | null,
  reducer: (acc: R, item: T, index: number) => R,
  initial: R
): R {
  const safeArray = arr || [];
  return safeArray.reduce(reducer, initial);
}

/**
 * Safely filter an array
 */
export function safeFilter<T>(
  arr: T[] | undefined | null,
  predicate: (item: T, index: number) => boolean
): T[] {
  const safeArray = arr || [];
  return safeArray.filter(predicate);
}

/**
 * Safely map an array
 */
export function safeMap<T, R>(
  arr: T[] | undefined | null,
  mapper: (item: T, index: number) => R
): R[] {
  const safeArray = arr || [];
  return safeArray.map(mapper);
}

/**
 * Safely get array length
 */
export function safeLength(arr: any[] | undefined | null): number {
  return arr?.length ?? 0;
}

/**
 * Safely format a date string
 */
export function safeFormatDate(
  date: string | Date | undefined | null,
  locale = 'en-US',
  options?: Intl.DateTimeFormatOptions
): string {
  if (!date) return 'N/A';

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return 'Invalid Date';

    return dateObj.toLocaleDateString(locale, options);
  } catch {
    return 'Invalid Date';
  }
}

/**
 * Safely get property value with fallback
 */
export function safeGet<T, K extends keyof T>(
  obj: T | undefined | null,
  key: K,
  fallback?: T[K]
): T[K] | typeof fallback {
  if (!obj) return fallback as T[K];
  return obj[key] ?? fallback as T[K];
}

/**
 * Safely get nested property value
 */
export function safeGetNested<T>(
  obj: any,
  path: string,
  fallback?: T
): T | undefined {
  if (!obj || !path) return fallback;

  const keys = path.split('.');
  let result = obj;

  for (const key of keys) {
    if (result === null || result === undefined) {
      return fallback;
    }
    result = result[key];
  }

  return result ?? fallback;
}

/**
 * Safely get first N elements from array
 */
export function safeSlice<T>(
  arr: T[] | undefined | null,
  start = 0,
  end?: number
): T[] {
  // Ensure it's actually an array before calling slice
  const safeArray = Array.isArray(arr) ? arr : [];
  return safeArray.slice(start, end);
}

/**
 * Safely sum numeric values in an array
 */
export function safeSum(arr: (number | string | undefined | null)[]): number {
  if (!arr || arr.length === 0) return 0;

  return arr.reduce<number>((sum: number, val) => {
    const num = safeParseFloat(val);
    return sum + num;
  }, 0);
}

/**
 * Safely get initials from a name
 */
export function safeGetInitials(name: string | undefined | null, fallback = 'NA'): string {
  if (!name || typeof name !== 'string') return fallback;

  const trimmed = name.trim();
  if (!trimmed) return fallback;

  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return fallback;

  return parts.map(n => n[0]).join('').toUpperCase();
}

/**
 * Safely check if value is defined and not empty
 */
export function isDefined<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null;
}

/**
 * Safely get array item at index with fallback
 */
export function safeArrayAt<T>(
  arr: T[] | undefined | null,
  index: number,
  fallback?: T
): T | undefined {
  const safeArray = arr || [];
  return safeArray[index] ?? fallback;
}
