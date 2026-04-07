import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isElectron(): boolean {
  // Renderer process
  if (typeof window !== 'undefined' && typeof window.process === 'object' && (window.process as any).type === 'renderer') {
    return true;
  }

  // Main process
  if (typeof process !== 'undefined' && typeof process.versions === 'object' && !!process.versions.electron) {
    return true;
  }

  // Detect the user agent when the `nodeIntegration` option is set to true
  if (typeof navigator === 'object' && typeof navigator.userAgent === 'string' && navigator.userAgent.indexOf('Electron') >= 0) {
    return true;
  }

  return false;
}

/**
 * Capitalizes the first letter of a string.
 */
export function capitalizeFirst(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Capitalizes the first letter of every word (Title Case)
 */
export function toTitleCase(str: string): string {
  if (!str) return '';
  return str
    .split(' ')
    .map(word => word ? word.charAt(0).toUpperCase() + word.slice(1) : '')
    .join(' ');
}

/**
 * Detect if running on Windows
 */
export function isWindows(): boolean {
  if (typeof navigator === 'undefined') return false;
  return navigator.userAgent.toLowerCase().includes('win') ||
    navigator.platform?.toLowerCase().includes('win');
}

/**
 * Detect if running on Mac
 */
export function isMac(): boolean {
  if (typeof navigator === 'undefined') return false;
  return navigator.userAgent.toLowerCase().includes('mac') ||
    navigator.platform?.toLowerCase().includes('mac');
}

/**
 * Detect if running on Linux
 */
export function isLinux(): boolean {
  if (typeof navigator === 'undefined') return false;
  return navigator.userAgent.toLowerCase().includes('linux') ||
    navigator.platform?.toLowerCase().includes('linux');
}

/**
 * Get current OS name
 */
export function getOS(): 'windows' | 'mac' | 'linux' | 'unknown' {
  if (isWindows()) return 'windows';
  if (isMac()) return 'mac';
  if (isLinux()) return 'linux';
  return 'unknown';
}

/**
 * Check if running as desktop app (Electron on any OS)
 */
export function isDesktopApp(): boolean {
  return isElectron();
}

