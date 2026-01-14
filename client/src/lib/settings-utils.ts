/**
 * Settings Utilities - Access settings outside of React components
 * Used by API services, utility functions, and non-React code
 */

const STORAGE_KEY = 'fabzclean_settings_v2';

export interface StoredSettings {
  theme: string;
  density: string;
  currency: string;
  dateFormat: string;
  defaultPrinterType: string;
  autoPrintInvoice: boolean;
  showPrintPreview: boolean;
  shopAddress: string;
  shopPhone: string;
  enableWhatsApp: boolean;
  soundEnabled: boolean;
  offlineMode: boolean;
  autoSubmitOnScan: boolean;
  defaultLandingPage: string;
  quickActionSlots: string[];
  lowDataMode: boolean;
  reduceMotion: boolean;
  hapticFeedback: boolean;
}

/**
 * Safely retrieves and parses settings from localStorage
 * Returns null if localStorage is unavailable (SSR, private browsing)
 */
export function getStoredSettings(): StoredSettings | null {
  try {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

/**
 * Format currency using stored settings or defaults
 * @param amount - Number or string to format
 * @returns Formatted currency string (e.g., "₹1,234.00")
 */
export function formatCurrency(amount: number | string): string {
  const settings = getStoredSettings();
  const currency = settings?.currency || 'INR';

  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '₹0.00';

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2
  }).format(num);
}

/**
 * Format currency with explicit settings parameter (for React components)
 */
export function formatCurrencyWithSettings(amount: number | string, currency: string = 'INR'): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '₹0.00';

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2
  }).format(num);
}

/**
 * Round invoice amount based on common rounding practices
 */
export function roundInvoiceAmount(amount: number): number {
  return Math.round(amount);
}

/**
 * Check if printing should happen automatically
 */
export function shouldAutoPrint(): boolean {
  const settings = getStoredSettings();
  return settings?.autoPrintInvoice === true;
}

/**
 * Check if scanner should auto-submit
 */
export function shouldAutoSubmitOnScan(): boolean {
  const settings = getStoredSettings();
  return settings?.autoSubmitOnScan === true;
}

/**
 * Get the default landing page after login
 */
export function getDefaultLandingPage(): string {
  const settings = getStoredSettings();
  return settings?.defaultLandingPage || '/dashboard';
}

/**
 * Check if low data mode is enabled
 */
export function isLowDataModeEnabled(): boolean {
  const settings = getStoredSettings();
  return settings?.lowDataMode === true;
}

/**
 * Check if reduce motion is enabled
 */
export function isReduceMotionEnabled(): boolean {
  const settings = getStoredSettings();
  return settings?.reduceMotion === true;
}

// Haptic vibration patterns
const VIBRATION_PATTERNS = {
  click: [30],
  success: [50, 30, 50],
  error: [100, 50, 100, 50, 100],
  warning: [80, 40, 80],
} as const;

type HapticType = keyof typeof VIBRATION_PATTERNS;

/**
 * Trigger haptic feedback if enabled and supported
 * @param type - Type of haptic feedback: 'click', 'success', 'error', 'warning'
 */
export function triggerHaptic(type: HapticType = 'click'): void {
  try {
    const settings = getStoredSettings();

    // Check if haptic feedback is enabled
    if (!settings?.hapticFeedback) return;

    // Check if vibration API is available
    if (typeof navigator === 'undefined' || !navigator.vibrate) return;

    // Get the pattern and trigger vibration
    const pattern = VIBRATION_PATTERNS[type] || VIBRATION_PATTERNS.click;
    navigator.vibrate(pattern);
  } catch {
    // Silently fail - haptic feedback is non-critical
  }
}

/**
 * Play a sound effect if sound is enabled
 * @param type - Type of sound: 'success', 'error', 'scan'
 */
export function playSound(type: 'success' | 'error' | 'scan' = 'success'): void {
  try {
    const settings = getStoredSettings();
    if (!settings?.soundEnabled) return;

    // Use Web Audio API for simple beeps
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Configure based on type
    switch (type) {
      case 'success':
        oscillator.frequency.value = 800;
        gainNode.gain.value = 0.1;
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.1);
        break;
      case 'error':
        oscillator.frequency.value = 300;
        gainNode.gain.value = 0.15;
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.2);
        break;
      case 'scan':
        oscillator.frequency.value = 1000;
        gainNode.gain.value = 0.08;
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.05);
        break;
    }
  } catch {
    // Silently fail - audio is non-critical
  }
}

/**
 * Combined feedback helper - trigger both haptic and sound
 */
export function triggerFeedback(type: 'success' | 'error' | 'click' = 'success'): void {
  triggerHaptic(type as HapticType);
  if (type === 'success' || type === 'error') {
    playSound(type);
  }
}
