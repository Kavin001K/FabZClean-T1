/**
 * Style guide utilities for consistent styling across the application
 * Provides standardized classes, colors, spacing, and component patterns
 */

import { cn } from './utils';

/**
 * Color palette for consistent theming
 */
export const COLORS = {
  // Primary colors
  primary: {
    50: 'bg-primary-50 text-primary-50-foreground',
    100: 'bg-primary-100 text-primary-100-foreground',
    200: 'bg-primary-200 text-primary-200-foreground',
    300: 'bg-primary-300 text-primary-300-foreground',
    400: 'bg-primary-400 text-primary-400-foreground',
    500: 'bg-primary-500 text-primary-500-foreground',
    600: 'bg-primary-600 text-primary-600-foreground',
    700: 'bg-primary-700 text-primary-700-foreground',
    800: 'bg-primary-800 text-primary-800-foreground',
    900: 'bg-primary-900 text-primary-900-foreground',
  },

  // Secondary colors
  secondary: {
    50: 'bg-secondary-50 text-secondary-50-foreground',
    100: 'bg-secondary-100 text-secondary-100-foreground',
    200: 'bg-secondary-200 text-secondary-200-foreground',
    300: 'bg-secondary-300 text-secondary-300-foreground',
    400: 'bg-secondary-400 text-secondary-400-foreground',
    500: 'bg-secondary-500 text-secondary-500-foreground',
    600: 'bg-secondary-600 text-secondary-600-foreground',
    700: 'bg-secondary-700 text-secondary-700-foreground',
    800: 'bg-secondary-800 text-secondary-800-foreground',
    900: 'bg-secondary-900 text-secondary-900-foreground',
  },

  // Status colors
  success: {
    50: 'bg-green-50 text-green-50',
    100: 'bg-green-100 text-green-100',
    200: 'bg-green-200 text-green-200',
    300: 'bg-green-300 text-green-300',
    400: 'bg-green-400 text-green-400',
    500: 'bg-green-500 text-green-500',
    600: 'bg-green-600 text-green-600',
    700: 'bg-green-700 text-green-700',
    800: 'bg-green-800 text-green-800',
    900: 'bg-green-900 text-green-900',
  },

  warning: {
    50: 'bg-yellow-50 text-yellow-50',
    100: 'bg-yellow-100 text-yellow-100',
    200: 'bg-yellow-200 text-yellow-200',
    300: 'bg-yellow-300 text-yellow-300',
    400: 'bg-yellow-400 text-yellow-400',
    500: 'bg-yellow-500 text-yellow-500',
    600: 'bg-yellow-600 text-yellow-600',
    700: 'bg-yellow-700 text-yellow-700',
    800: 'bg-yellow-800 text-yellow-800',
    900: 'bg-yellow-900 text-yellow-900',
  },

  error: {
    50: 'bg-red-50 text-red-50',
    100: 'bg-red-100 text-red-100',
    200: 'bg-red-200 text-red-200',
    300: 'bg-red-300 text-red-300',
    400: 'bg-red-400 text-red-400',
    500: 'bg-red-500 text-red-500',
    600: 'bg-red-600 text-red-600',
    700: 'bg-red-700 text-red-700',
    800: 'bg-red-800 text-red-800',
    900: 'bg-red-900 text-red-900',
  },

  info: {
    50: 'bg-blue-50 text-blue-50',
    100: 'bg-blue-100 text-blue-100',
    200: 'bg-blue-200 text-blue-200',
    300: 'bg-blue-300 text-blue-300',
    400: 'bg-blue-400 text-blue-400',
    500: 'bg-blue-500 text-blue-500',
    600: 'bg-blue-600 text-blue-600',
    700: 'bg-blue-700 text-blue-700',
    800: 'bg-blue-800 text-blue-800',
    900: 'bg-blue-900 text-blue-900',
  },
} as const;

/**
 * Typography scale for consistent text styling
 */
export const TYPOGRAPHY = {
  // Headings
  h1: 'text-4xl font-bold tracking-tight lg:text-5xl',
  h2: 'text-3xl font-semibold tracking-tight',
  h3: 'text-2xl font-semibold tracking-tight',
  h4: 'text-xl font-semibold tracking-tight',
  h5: 'text-lg font-semibold tracking-tight',
  h6: 'text-base font-semibold tracking-tight',

  // Body text
  body: {
    large: 'text-lg leading-7',
    base: 'text-base leading-6',
    small: 'text-sm leading-5',
    xs: 'text-xs leading-4',
  },

  // Special text
  lead: 'text-xl text-muted-foreground',
  large: 'text-lg font-semibold',
  small: 'text-sm font-medium leading-none',
  muted: 'text-sm text-muted-foreground',

  // Font weights
  weight: {
    thin: 'font-thin',
    light: 'font-light',
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
    extrabold: 'font-extrabold',
    black: 'font-black',
  },

  // Text alignment
  align: {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
    justify: 'text-justify',
  },
} as const;

/**
 * Spacing scale for consistent spacing
 */
export const SPACING = {
  // Padding
  padding: {
    xs: 'p-1',
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8',
    '2xl': 'p-12',
    '3xl': 'p-16',
  },

  // Margin
  margin: {
    xs: 'm-1',
    sm: 'm-2',
    md: 'm-4',
    lg: 'm-6',
    xl: 'm-8',
    '2xl': 'm-12',
    '3xl': 'm-16',
  },

  // Gap
  gap: {
    xs: 'gap-1',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
    '2xl': 'gap-12',
    '3xl': 'gap-16',
  },

  // Space between
  space: {
    xs: 'space-y-1',
    sm: 'space-y-2',
    md: 'space-y-4',
    lg: 'space-y-6',
    xl: 'space-y-8',
    '2xl': 'space-y-12',
    '3xl': 'space-y-16',
  },
} as const;

/**
 * Border radius scale
 */
export const BORDER_RADIUS = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  '3xl': 'rounded-3xl',
  full: 'rounded-full',
} as const;

/**
 * Shadow scale
 */
export const SHADOWS = {
  none: 'shadow-none',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
  '2xl': 'shadow-2xl',
  inner: 'shadow-inner',
} as const;

/**
 * Component size variants
 */
export const SIZES = {
  xs: 'h-6 px-2 text-xs',
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-8 text-base',
  xl: 'h-12 px-10 text-lg',
} as const;

/**
 * Common component patterns
 */
export const COMPONENT_PATTERNS = {
  // Button patterns
  button: {
    base: 'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
    outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
    link: 'text-primary underline-offset-4 hover:underline',
  },

  // Card patterns
  card: {
    base: 'rounded-lg border bg-card text-card-foreground shadow-sm',
    header: 'flex flex-col space-y-1.5 p-6',
    title: 'text-2xl font-semibold leading-none tracking-tight',
    content: 'p-6 pt-0',
    footer: 'flex items-center p-6 pt-0',
  },

  // Input patterns
  input: {
    base: 'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
    error: 'border-destructive focus-visible:ring-destructive',
    success: 'border-green-500 focus-visible:ring-green-500',
  },

  // Badge patterns
  badge: {
    base: 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
    default: 'bg-primary text-primary-foreground hover:bg-primary/80',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/80',
    outline: 'text-foreground',
  },

  // Status patterns
  status: {
    success: 'bg-green-100 text-green-800 border-green-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    error: 'bg-red-100 text-red-800 border-red-200',
    info: 'bg-blue-100 text-blue-800 border-blue-200',
    neutral: 'bg-gray-100 text-gray-800 border-gray-200',
  },
} as const;

/**
 * Layout patterns
 */
export const LAYOUT = {
  // Container patterns
  container: {
    base: 'container mx-auto px-4',
    sm: 'container mx-auto px-4 sm:px-6',
    lg: 'container mx-auto px-4 sm:px-6 lg:px-8',
  },

  // Grid patterns
  grid: {
    cols1: 'grid grid-cols-1',
    cols2: 'grid grid-cols-2',
    cols3: 'grid grid-cols-3',
    cols4: 'grid grid-cols-4',
    cols6: 'grid grid-cols-6',
    cols12: 'grid grid-cols-12',
    responsive: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  },

  // Flex patterns
  flex: {
    row: 'flex flex-row',
    col: 'flex flex-col',
    center: 'flex items-center justify-center',
    between: 'flex items-center justify-between',
    around: 'flex items-center justify-around',
    evenly: 'flex items-center justify-evenly',
    start: 'flex items-start',
    end: 'flex items-end',
  },

  // Stack patterns
  stack: {
    vertical: 'flex flex-col',
    horizontal: 'flex flex-row',
    verticalReverse: 'flex flex-col-reverse',
    horizontalReverse: 'flex flex-row-reverse',
  },
} as const;

/**
 * Animation patterns
 */
export const ANIMATIONS = {
  // Fade animations
  fade: {
    in: 'animate-in fade-in duration-300',
    out: 'animate-out fade-out duration-300',
  },

  // Slide animations
  slide: {
    up: 'animate-in slide-in-from-bottom-4 duration-300',
    down: 'animate-in slide-in-from-top-4 duration-300',
    left: 'animate-in slide-in-from-right-4 duration-300',
    right: 'animate-in slide-in-from-left-4 duration-300',
  },

  // Scale animations
  scale: {
    in: 'animate-in zoom-in-95 duration-200',
    out: 'animate-out zoom-out-95 duration-200',
  },

  // Spin animations
  spin: 'animate-spin',
  pulse: 'animate-pulse',
  bounce: 'animate-bounce',
  ping: 'animate-ping',
} as const;

/**
 * Responsive breakpoints
 */
export const BREAKPOINTS = {
  sm: 'sm:',
  md: 'md:',
  lg: 'lg:',
  xl: 'xl:',
  '2xl': '2xl:',
} as const;

/**
 * Create a consistent button style
 */
export function createButtonStyle(
  variant: keyof typeof COMPONENT_PATTERNS.button = 'primary',
  size: keyof typeof SIZES = 'md',
  className?: string
): string {
  return cn(
    COMPONENT_PATTERNS.button.base,
    COMPONENT_PATTERNS.button[variant],
    SIZES[size],
    className
  );
}

/**
 * Create a consistent card style
 */
export function createCardStyle(
  variant: keyof typeof COMPONENT_PATTERNS.card = 'base',
  className?: string
): string {
  return cn(
    COMPONENT_PATTERNS.card.base,
    COMPONENT_PATTERNS.card[variant],
    className
  );
}

/**
 * Create a consistent input style
 */
export function createInputStyle(
  variant: keyof typeof COMPONENT_PATTERNS.input = 'base',
  className?: string
): string {
  return cn(
    COMPONENT_PATTERNS.input.base,
    COMPONENT_PATTERNS.input[variant],
    className
  );
}

/**
 * Create a consistent badge style
 */
export function createBadgeStyle(
  variant: keyof typeof COMPONENT_PATTERNS.badge = 'default',
  className?: string
): string {
  return cn(
    COMPONENT_PATTERNS.badge.base,
    COMPONENT_PATTERNS.badge[variant],
    className
  );
}

/**
 * Create a consistent status style
 */
export function createStatusStyle(
  status: keyof typeof COMPONENT_PATTERNS.status,
  className?: string
): string {
  return cn(
    COMPONENT_PATTERNS.status[status],
    className
  );
}

/**
 * Create responsive classes
 */
export function createResponsiveClasses(
  base: string,
  sm?: string,
  md?: string,
  lg?: string,
  xl?: string,
  xxl?: string
): string {
  return cn(
    base,
    sm && `${BREAKPOINTS.sm}${sm}`,
    md && `${BREAKPOINTS.md}${md}`,
    lg && `${BREAKPOINTS.lg}${lg}`,
    xl && `${BREAKPOINTS.xl}${xl}`,
    xxl && `${BREAKPOINTS['2xl']}${xxl}`
  );
}

/**
 * Common utility classes
 */
export const UTILITIES = {
  // Display
  hidden: 'hidden',
  block: 'block',
  inline: 'inline',
  inlineBlock: 'inline-block',
  flex: 'flex',
  inlineFlex: 'inline-flex',
  grid: 'grid',
  table: 'table',

  // Position
  static: 'static',
  relative: 'relative',
  absolute: 'absolute',
  fixed: 'fixed',
  sticky: 'sticky',

  // Overflow
  overflowHidden: 'overflow-hidden',
  overflowVisible: 'overflow-visible',
  overflowScroll: 'overflow-scroll',
  overflowAuto: 'overflow-auto',

  // Cursor
  cursorPointer: 'cursor-pointer',
  cursorNotAllowed: 'cursor-not-allowed',
  cursorDefault: 'cursor-default',

  // User select
  selectNone: 'select-none',
  selectText: 'select-text',
  selectAll: 'select-all',
  selectAuto: 'select-auto',

  // Pointer events
  pointerEventsNone: 'pointer-events-none',
  pointerEventsAuto: 'pointer-events-auto',

  // Z-index
  z0: 'z-0',
  z10: 'z-10',
  z20: 'z-20',
  z30: 'z-30',
  z40: 'z-40',
  z50: 'z-50',
} as const;
