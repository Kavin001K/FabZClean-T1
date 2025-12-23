/**
 * Component splitting utilities for breaking down large components
 * Provides patterns and helpers for creating smaller, reusable components
 */

import { ReactNode, ComponentType, forwardRef } from 'react';
import { cn } from './utils';
import { TEST_IDS, getTestId } from './test-ids';

/**
 * Base component props interface
 */
export interface BaseComponentProps {
  className?: string;
  children?: ReactNode;
  'data-testid'?: string;
}

/**
 * Common component splitting patterns
 */
export const COMPONENT_PATTERNS = {
  // Header patterns
  HEADER: {
    base: 'flex items-center justify-between',
    title: 'text-lg font-semibold',
    actions: 'flex items-center gap-2',
  },
  
  // Content patterns
  CONTENT: {
    base: 'space-y-4',
    section: 'space-y-2',
    grid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4',
  },
  
  // Footer patterns
  FOOTER: {
    base: 'flex items-center justify-between pt-4 border-t',
    actions: 'flex items-center gap-2',
    info: 'text-sm text-muted-foreground',
  },
  
  // List patterns
  LIST: {
    base: 'space-y-2',
    item: 'flex items-center justify-between p-3 border rounded-lg',
    empty: 'text-center py-8 text-muted-foreground',
  },
  
  // Form patterns
  FORM: {
    base: 'space-y-4',
    field: 'space-y-2',
    group: 'grid grid-cols-1 md:grid-cols-2 gap-4',
    actions: 'flex items-center justify-end gap-2',
  },
  
  // Table patterns
  TABLE: {
    base: 'w-full',
    header: 'bg-muted/50',
    row: 'border-b hover:bg-muted/50',
    cell: 'p-4',
  },
  
  // Modal patterns
  MODAL: {
    base: 'fixed inset-0 z-50 bg-black/80 flex items-center justify-center',
    content: 'bg-background rounded-lg shadow-lg max-w-md w-full mx-4',
    header: 'flex items-center justify-between p-6 border-b',
    body: 'p-6',
    footer: 'flex items-center justify-end gap-2 p-6 border-t',
  },
} as const;

/**
 * Create a header component
 */
export function createHeaderComponent(
  title: string,
  actions?: ReactNode,
  className?: string
) {
  return (
    <div className={cn(COMPONENT_PATTERNS.HEADER.base, className)}>
      <h2 className={COMPONENT_PATTERNS.HEADER.title}>{title}</h2>
      {actions && (
        <div className={COMPONENT_PATTERNS.HEADER.actions}>{actions}</div>
      )}
    </div>
  );
}

/**
 * Create a content section component
 */
export function createContentSection(
  children: ReactNode,
  className?: string
) {
  return (
    <div className={cn(COMPONENT_PATTERNS.CONTENT.base, className)}>
      {children}
    </div>
  );
}

/**
 * Create a footer component
 */
export function createFooterComponent(
  actions?: ReactNode,
  info?: string,
  className?: string
) {
  return (
    <div className={cn(COMPONENT_PATTERNS.FOOTER.base, className)}>
      {info && (
        <div className={COMPONENT_PATTERNS.FOOTER.info}>{info}</div>
      )}
      {actions && (
        <div className={COMPONENT_PATTERNS.FOOTER.actions}>{actions}</div>
      )}
    </div>
  );
}

/**
 * Create a list component
 */
export function createListComponent(
  items: ReactNode[],
  emptyMessage?: string,
  className?: string
) {
  if (items.length === 0 && emptyMessage) {
    return (
      <div className={cn(COMPONENT_PATTERNS.LIST.empty, className)}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={cn(COMPONENT_PATTERNS.LIST.base, className)}>
      {items}
    </div>
  );
}

/**
 * Create a form component
 */
export function createFormComponent(
  children: ReactNode,
  onSubmit?: (e: React.FormEvent) => void,
  className?: string
) {
  return (
    <form
      onSubmit={onSubmit}
      className={cn(COMPONENT_PATTERNS.FORM.base, className)}
    >
      {children}
    </form>
  );
}

/**
 * Create a table component
 */
export function createTableComponent(
  headers: string[],
  rows: ReactNode[][],
  className?: string
) {
  return (
    <div className={cn(COMPONENT_PATTERNS.TABLE.base, className)}>
      <table className="w-full">
        <thead className={COMPONENT_PATTERNS.TABLE.header}>
          <tr>
            {headers.map((header, index) => (
              <th key={index} className="p-4 text-left font-medium">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className={COMPONENT_PATTERNS.TABLE.row}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className={COMPONENT_PATTERNS.TABLE.cell}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Create a modal component
 */
export function createModalComponent(
  isOpen: boolean,
  onClose: () => void,
  title: string,
  children: ReactNode,
  actions?: ReactNode,
  className?: string
) {
  if (!isOpen) return null;

  return (
    <div className={COMPONENT_PATTERNS.MODAL.base}>
      <div className={cn(COMPONENT_PATTERNS.MODAL.content, className)}>
        <div className={COMPONENT_PATTERNS.MODAL.header}>
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>
        <div className={COMPONENT_PATTERNS.MODAL.body}>
          {children}
        </div>
        {actions && (
          <div className={COMPONENT_PATTERNS.MODAL.footer}>
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Common component splitting utilities
 */
export const SPLITTING_UTILITIES = {
  // Extract header logic
  extractHeader: (props: any) => ({
    title: props.title,
    actions: props.actions,
    onClose: props.onClose,
  }),
  
  // Extract content logic
  extractContent: (props: any) => ({
    children: props.children,
    data: props.data,
    isLoading: props.isLoading,
    error: props.error,
  }),
  
  // Extract footer logic
  extractFooter: (props: any) => ({
    actions: props.footerActions,
    info: props.footerInfo,
    onCancel: props.onCancel,
    onSubmit: props.onSubmit,
  }),
  
  // Extract form logic
  extractForm: (props: any) => ({
    onSubmit: props.onSubmit,
    onReset: props.onReset,
    isSubmitting: props.isSubmitting,
    errors: props.errors,
  }),
  
  // Extract table logic
  extractTable: (props: any) => ({
    data: props.data,
    columns: props.columns,
    onSort: props.onSort,
    onSelect: props.onSelect,
    selectedRows: props.selectedRows,
  }),
} as const;

/**
 * Create a component splitter
 */
export function createComponentSplitter<T extends BaseComponentProps>(
  Component: ComponentType<T>,
  splitter: (props: T) => { [key: string]: any }
) {
  return forwardRef<any, T>((props, ref) => {
    const splitProps = splitter(props);
    
    return (
      <Component
        ref={ref}
        {...props}
        {...splitProps}
      />
    );
  });
}

/**
 * Common component splitting patterns
 */
export const SPLITTING_PATTERNS = {
  // Page component pattern
  PAGE: {
    header: 'PageHeader',
    content: 'PageContent',
    sidebar: 'PageSidebar',
    footer: 'PageFooter',
  },
  
  // Card component pattern
  CARD: {
    header: 'CardHeader',
    content: 'CardContent',
    footer: 'CardFooter',
  },
  
  // Form component pattern
  FORM: {
    header: 'FormHeader',
    fields: 'FormFields',
    actions: 'FormActions',
  },
  
  // Table component pattern
  TABLE: {
    header: 'TableHeader',
    body: 'TableBody',
    footer: 'TableFooter',
    pagination: 'TablePagination',
  },
  
  // Modal component pattern
  MODAL: {
    header: 'ModalHeader',
    content: 'ModalContent',
    footer: 'ModalFooter',
  },
  
  // List component pattern
  LIST: {
    header: 'ListHeader',
    items: 'ListItem',
    footer: 'ListFooter',
  },
} as const;

/**
 * Create a split component
 */
export function createSplitComponent<T extends BaseComponentProps>(
  name: string,
  parts: { [key: string]: ComponentType<any> }
) {
  const SplitComponent = forwardRef<any, T>((props, ref) => {
    const { children, ...restProps } = props;
    
    return (
      <div ref={ref} {...restProps}>
        {children}
      </div>
    );
  });
  
  SplitComponent.displayName = name;
  
  // Add parts as static properties
  Object.entries(parts).forEach(([key, Component]) => {
    (SplitComponent as any)[key] = Component;
  });
  
  return SplitComponent;
}

/**
 * Common component splitting hooks
 */
export const SPLITTING_HOOKS = {
  // Extract state logic
  useExtractedState: <T>(props: T, keys: (keyof T)[]) => {
    const extracted = {} as Partial<T>;
    keys.forEach(key => {
      extracted[key] = props[key];
    });
    return extracted;
  },
  
  // Extract handlers
  useExtractedHandlers: <T>(props: T, handlers: (keyof T)[]) => {
    const extracted = {} as Partial<T>;
    handlers.forEach(handler => {
      extracted[handler] = props[handler];
    });
    return extracted;
  },
  
  // Extract data
  useExtractedData: <T>(props: T, dataKeys: (keyof T)[]) => {
    const extracted = {} as Partial<T>;
    dataKeys.forEach(key => {
      extracted[key] = props[key];
    });
    return extracted;
  },
} as const;

/**
 * Create a component with extracted parts
 */
export function createComponentWithParts<T extends BaseComponentProps>(
  name: string,
  parts: { [key: string]: ComponentType<any> },
  mainComponent: ComponentType<T>
) {
  const ComponentWithParts = forwardRef<any, T>((props, ref) => {
    return <mainComponent ref={ref} {...props} />;
  });
  
  ComponentWithParts.displayName = name;
  
  // Add parts as static properties
  Object.entries(parts).forEach(([key, PartComponent]) => {
    (ComponentWithParts as any)[key] = PartComponent;
  });
  
  return ComponentWithParts;
}

/**
 * Common component splitting utilities for specific patterns
 */
export const SPECIFIC_PATTERNS = {
  // Data table splitting
  DATA_TABLE: {
    extractHeader: (props: any) => ({
      title: props.title,
      actions: props.headerActions,
      search: props.search,
      filters: props.filters,
    }),
    extractBody: (props: any) => ({
      data: props.data,
      columns: props.columns,
      onRowClick: props.onRowClick,
      onRowSelect: props.onRowSelect,
    }),
    extractFooter: (props: any) => ({
      pagination: props.pagination,
      actions: props.footerActions,
      info: props.footerInfo,
    }),
  },
  
  // Form splitting
  FORM: {
    extractHeader: (props: any) => ({
      title: props.title,
      description: props.description,
      actions: props.headerActions,
    }),
    extractFields: (props: any) => ({
      fields: props.fields,
      errors: props.errors,
      touched: props.touched,
    }),
    extractActions: (props: any) => ({
      onSubmit: props.onSubmit,
      onCancel: props.onCancel,
      onReset: props.onReset,
      isSubmitting: props.isSubmitting,
    }),
  },
  
  // Card splitting
  CARD: {
    extractHeader: (props: any) => ({
      title: props.title,
      subtitle: props.subtitle,
      actions: props.headerActions,
    }),
    extractContent: (props: any) => ({
      children: props.children,
      data: props.data,
      isLoading: props.isLoading,
    }),
    extractFooter: (props: any) => ({
      actions: props.footerActions,
      info: props.footerInfo,
    }),
  },
} as const;
