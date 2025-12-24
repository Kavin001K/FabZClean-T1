/**
 * Component utility functions for consistent component patterns
 * Provides helpers for component splitting, styling, and common patterns
 */

import { ReactNode, ComponentType, forwardRef } from 'react';
import { cn } from './utils';

/**
 * Base component props interface
 */
export interface BaseComponentProps {
  className?: string;
  children?: ReactNode;
  'data-testid'?: string;
}

/**
 * Create a consistent component wrapper with common props
 */
export function createComponentWrapper<T extends BaseComponentProps>(
  Component: ComponentType<T>,
  displayName: string,
  defaultClassName?: string
) {
  const WrappedComponent = forwardRef<any, T>((props, ref) => {
    const { className, 'data-testid': testId, ...rest } = props;
    
    return (
      <Component
        ref={ref}
        className={cn(defaultClassName, className)}
        data-testid={testId}
        {...rest}
      />
    );
  });
  
  WrappedComponent.displayName = displayName;
  return WrappedComponent;
}

/**
 * Common component patterns
 */
export const COMPONENT_PATTERNS = {
  // Card patterns
  CARD: {
    container: 'rounded-lg border bg-card text-card-foreground shadow-sm',
    header: 'flex flex-col space-y-1.5 p-6',
    title: 'text-2xl font-semibold leading-none tracking-tight',
    content: 'p-6 pt-0',
    footer: 'flex items-center p-6 pt-0',
  },
  
  // Button patterns
  BUTTON: {
    base: 'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
    outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
    link: 'text-primary underline-offset-4 hover:underline',
  },
  
  // Form patterns
  FORM: {
    container: 'space-y-6',
    field: 'space-y-2',
    label: 'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
    input: 'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
    error: 'text-sm font-medium text-destructive',
    help: 'text-sm text-muted-foreground',
  },
  
  // Table patterns
  TABLE: {
    container: 'w-full overflow-auto',
    table: 'w-full caption-bottom text-sm',
    header: '[&_tr]:border-b',
    body: '[&_tr:last-child]:border-0',
    row: 'border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted',
    head: 'h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0',
    cell: 'p-4 align-middle [&:has([role=checkbox])]:pr-0',
  },
  
  // Modal patterns
  MODAL: {
    overlay: 'fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
    content: 'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg',
    header: 'flex flex-col space-y-1.5 text-center sm:text-left',
    title: 'text-lg font-semibold leading-none tracking-tight',
    footer: 'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
  },
  
  // Loading patterns
  LOADING: {
    spinner: 'animate-spin rounded-full border-2 border-gray-300 border-t-blue-600',
    skeleton: 'animate-pulse bg-gray-200 rounded',
    overlay: 'fixed inset-0 z-50 flex items-center justify-center bg-black/50',
  },
  
  // Status patterns
  STATUS: {
    badge: 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
    neutral: 'bg-gray-100 text-gray-800',
  },
} as const;

/**
 * Create a status badge component
 */
export function createStatusBadge(status: string, variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral') {
  const baseClasses = COMPONENT_PATTERNS.STATUS.badge;
  const variantClasses = variant ? COMPONENT_PATTERNS.STATUS[variant] : COMPONENT_PATTERNS.STATUS.neutral;
  
  return cn(baseClasses, variantClasses);
}

/**
 * Common component sizes
 */
export const COMPONENT_SIZES = {
  xs: 'h-6 px-2 text-xs',
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-8 text-base',
  xl: 'h-12 px-10 text-lg',
} as const;

/**
 * Common spacing utilities
 */
export const SPACING = {
  xs: 'space-y-1',
  sm: 'space-y-2',
  md: 'space-y-4',
  lg: 'space-y-6',
  xl: 'space-y-8',
} as const;

/**
 * Common layout utilities
 */
export const LAYOUT = {
  container: 'container mx-auto px-4',
  section: 'py-8',
  grid: {
    cols1: 'grid-cols-1',
    cols2: 'grid-cols-2',
    cols3: 'grid-cols-3',
    cols4: 'grid-cols-4',
    cols6: 'grid-cols-6',
    cols12: 'grid-cols-12',
  },
  flex: {
    row: 'flex-row',
    col: 'flex-col',
    center: 'items-center justify-center',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly',
  },
} as const;

/**
 * Create a responsive grid component
 */
export function createResponsiveGrid(
  cols: { sm?: number; md?: number; lg?: number; xl?: number },
  gap: 'sm' | 'md' | 'lg' = 'md'
) {
  const gapClass = gap === 'sm' ? 'gap-2' : gap === 'md' ? 'gap-4' : 'gap-6';
  const gridClasses = [
    'grid',
    gapClass,
    cols.sm && `sm:grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`,
  ].filter(Boolean).join(' ');
  
  return gridClasses;
}

/**
 * Common animation utilities
 */
export const ANIMATIONS = {
  fadeIn: 'animate-in fade-in duration-300',
  slideIn: 'animate-in slide-in-from-bottom-4 duration-300',
  scaleIn: 'animate-in zoom-in-95 duration-200',
  slideUp: 'animate-in slide-in-from-top-2 duration-200',
  slideDown: 'animate-in slide-in-from-bottom-2 duration-200',
} as const;

/**
 * Create a consistent loading state component
 */
export function createLoadingState(isLoading: boolean, children: ReactNode, fallback?: ReactNode) {
  if (isLoading) {
    return fallback || (
      <div className="flex items-center justify-center p-8">
        <div className={cn(COMPONENT_PATTERNS.LOADING.spinner, 'h-8 w-8')} />
      </div>
    );
  }
  
  return children;
}

/**
 * Create a consistent error state component
 */
export function createErrorState(
  hasError: boolean,
  error: Error | null,
  onRetry?: () => void,
  children?: ReactNode
) {
  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="text-destructive text-lg font-semibold mb-2">
          Something went wrong
        </div>
        {error && (
          <p className="text-sm text-muted-foreground mb-4">
            {error.message}
          </p>
        )}
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Try Again
          </button>
        )}
        {children}
      </div>
    );
  }
  
  return null;
}

/**
 * Create a consistent empty state component
 */
export function createEmptyState(
  isEmpty: boolean,
  title: string,
  description: string,
  action?: ReactNode,
  children?: ReactNode
) {
  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="text-lg font-semibold mb-2">{title}</div>
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
        {action}
        {children}
      </div>
    );
  }
  
  return null;
}
