/**
 * Test ID utilities for consistent testing across the application
 * Provides centralized test ID generation and management
 */

export const TEST_IDS = {
  // Common UI elements
  BUTTON: {
    PRIMARY: 'btn-primary',
    SECONDARY: 'btn-secondary',
    DESTRUCTIVE: 'btn-destructive',
    OUTLINE: 'btn-outline',
    GHOST: 'btn-ghost',
    LINK: 'btn-link',
    SUBMIT: 'btn-submit',
    CANCEL: 'btn-cancel',
    SAVE: 'btn-save',
    EDIT: 'btn-edit',
    DELETE: 'btn-delete',
    ADD: 'btn-add',
    REMOVE: 'btn-remove',
    CLOSE: 'btn-close',
    REFRESH: 'btn-refresh',
    EXPORT: 'btn-export',
    IMPORT: 'btn-import',
    FILTER: 'btn-filter',
    CLEAR: 'btn-clear',
    SEARCH: 'btn-search',
    VIEW: 'btn-view',
    PRINT: 'btn-print',
    DOWNLOAD: 'btn-download',
    UPLOAD: 'btn-upload',
  },

  // Form elements
  FORM: {
    CONTAINER: 'form-container',
    FIELD: 'form-field',
    INPUT: 'form-input',
    SELECT: 'form-select',
    TEXTAREA: 'form-textarea',
    CHECKBOX: 'form-checkbox',
    RADIO: 'form-radio',
    LABEL: 'form-label',
    ERROR: 'form-error',
    HELP: 'form-help',
    SUBMIT: 'form-submit',
    RESET: 'form-reset',
  },

  // Navigation
  NAV: {
    MAIN: 'nav-main',
    SIDEBAR: 'nav-sidebar',
    BREADCRUMB: 'nav-breadcrumb',
    TABS: 'nav-tabs',
    TAB: 'nav-tab',
    MENU: 'nav-menu',
    MENU_ITEM: 'nav-menu-item',
  },

  // Cards and containers
  CARD: {
    CONTAINER: 'card-container',
    HEADER: 'card-header',
    TITLE: 'card-title',
    CONTENT: 'card-content',
    FOOTER: 'card-footer',
  },

  // Tables
  TABLE: {
    CONTAINER: 'table-container',
    HEADER: 'table-header',
    BODY: 'table-body',
    ROW: 'table-row',
    CELL: 'table-cell',
    HEAD: 'table-head',
    SORT: 'table-sort',
    FILTER: 'table-filter',
    PAGINATION: 'table-pagination',
  },

  // Modals and dialogs
  MODAL: {
    CONTAINER: 'modal-container',
    OVERLAY: 'modal-overlay',
    HEADER: 'modal-header',
    TITLE: 'modal-title',
    CONTENT: 'modal-content',
    FOOTER: 'modal-footer',
    CLOSE: 'modal-close',
  },

  DIALOG: {
    CONTAINER: 'dialog-container',
    TRIGGER: 'dialog-trigger',
    HEADER: 'dialog-header',
    TITLE: 'dialog-title',
    CONTENT: 'dialog-content',
    FOOTER: 'dialog-footer',
    CLOSE: 'dialog-close',
  },

  // Loading states
  LOADING: {
    SPINNER: 'loading-spinner',
    SKELETON: 'loading-skeleton',
    OVERLAY: 'loading-overlay',
    BUTTON: 'loading-button',
  },

  // Error states
  ERROR: {
    CONTAINER: 'error-container',
    MESSAGE: 'error-message',
    RETRY: 'error-retry',
    FALLBACK: 'error-fallback',
  },

  // Search and filters
  SEARCH: {
    INPUT: 'search-input',
    BUTTON: 'search-button',
    CLEAR: 'search-clear',
    RESULTS: 'search-results',
    FILTER: 'search-filter',
  },

  FILTER: {
    CONTAINER: 'filter-container',
    DROPDOWN: 'filter-dropdown',
    OPTION: 'filter-option',
    CLEAR: 'filter-clear',
    APPLY: 'filter-apply',
  },

  // Data display
  DATA: {
    LIST: 'data-list',
    ITEM: 'data-item',
    GRID: 'data-grid',
    EMPTY: 'data-empty',
    LOADING: 'data-loading',
    ERROR: 'data-error',
  },

  // Charts and analytics
  CHART: {
    CONTAINER: 'chart-container',
    LEGEND: 'chart-legend',
    TOOLTIP: 'chart-tooltip',
    AXIS: 'chart-axis',
  },

  // Specific page elements
  DASHBOARD: {
    CONTAINER: 'dashboard-container',
    KPI: 'dashboard-kpi',
    WIDGET: 'dashboard-widget',
    CHART: 'dashboard-chart',
    TABLE: 'dashboard-table',
  },

  CUSTOMERS: {
    PAGE: 'customers-page',
    TABLE: 'customers-table',
    FORM: 'customers-form',
    SEARCH: 'customers-search',
    FILTER: 'customers-filter',
    KPI: 'customers-kpi',
  },

  ORDERS: {
    PAGE: 'orders-page',
    TABLE: 'orders-table',
    FORM: 'orders-form',
    SEARCH: 'orders-search',
    FILTER: 'orders-filter',
    KPI: 'orders-kpi',
    STATUS: 'orders-status',
  },

  INVENTORY: {
    PAGE: 'inventory-page',
    TABLE: 'inventory-table',
    FORM: 'inventory-form',
    SEARCH: 'inventory-search',
    FILTER: 'inventory-filter',
    KPI: 'inventory-kpi',
  },

  SERVICES: {
    PAGE: 'services-page',
    TABLE: 'services-table',
    FORM: 'services-form',
    SEARCH: 'services-search',
    FILTER: 'services-filter',
    KPI: 'services-kpi',
  },

  // Print and export
  PRINT: {
    BUTTON: 'print-button',
    PREVIEW: 'print-preview',
    SETTINGS: 'print-settings',
    MANAGER: 'print-manager',
  },

  EXPORT: {
    BUTTON: 'export-button',
    CSV: 'export-csv',
    PDF: 'export-pdf',
    EXCEL: 'export-excel',
  },

  // Barcode and QR
  BARCODE: {
    DISPLAY: 'barcode-display',
    SCANNER: 'barcode-scanner',
    GENERATOR: 'barcode-generator',
  },

  QR: {
    DISPLAY: 'qr-display',
    SCANNER: 'qr-scanner',
    GENERATOR: 'qr-generator',
  },

  // Tracking and logistics
  TRACKING: {
    MAP: 'tracking-map',
    ROUTE: 'tracking-route',
    DRIVER: 'tracking-driver',
    STATUS: 'tracking-status',
  },

  // Notifications
  NOTIFICATION: {
    CONTAINER: 'notification-container',
    ITEM: 'notification-item',
    CLOSE: 'notification-close',
    CLEAR: 'notification-clear',
  },

  // Settings
  SETTINGS: {
    PAGE: 'settings-page',
    SECTION: 'settings-section',
    FIELD: 'settings-field',
    SAVE: 'settings-save',
    RESET: 'settings-reset',
  },
} as const;

/**
 * Generate a test ID with optional suffix
 * @param baseId - Base test ID from TEST_IDS
 * @param suffix - Optional suffix to append
 * @returns Complete test ID string
 */
export function getTestId(baseId: string, suffix?: string | number): string {
  return suffix ? `${baseId}-${suffix}` : baseId;
}

/**
 * Generate test ID for list items
 * @param baseId - Base test ID
 * @param index - Item index
 * @param id - Optional item ID
 * @returns Test ID for list item
 */
export function getListItemTestId(baseId: string, index: number, id?: string): string {
  return id ? `${baseId}-${id}` : `${baseId}-${index}`;
}

/**
 * Generate test ID for form fields
 * @param fieldName - Field name
 * @param type - Field type (input, select, etc.)
 * @returns Test ID for form field
 */
export function getFormFieldTestId(fieldName: string, type: string = 'input'): string {
  return `form-${type}-${fieldName}`;
}

/**
 * Generate test ID for table elements
 * @param tableName - Table name
 * @param element - Table element type
 * @param identifier - Row/column identifier
 * @returns Test ID for table element
 */
export function getTableTestId(tableName: string, element: string, identifier?: string | number): string {
  return identifier ? `table-${tableName}-${element}-${identifier}` : `table-${tableName}-${element}`;
}

/**
 * Generate test ID for modal/dialog elements
 * @param modalName - Modal name
 * @param element - Modal element type
 * @returns Test ID for modal element
 */
export function getModalTestId(modalName: string, element: string): string {
  return `modal-${modalName}-${element}`;
}

/**
 * Generate test ID for button actions
 * @param action - Button action
 * @param context - Optional context (e.g., 'row-1', 'item-abc')
 * @returns Test ID for button
 */
export function getButtonTestId(action: string, context?: string): string {
  return context ? `btn-${action}-${context}` : `btn-${action}`;
}

/**
 * Generate test ID for data elements
 * @param dataType - Type of data (customer, order, etc.)
 * @param element - Element type (item, list, form, etc.)
 * @param identifier - Optional identifier
 * @returns Test ID for data element
 */
export function getDataTestId(dataType: string, element: string, identifier?: string | number): string {
  return identifier ? `data-${dataType}-${element}-${identifier}` : `data-${dataType}-${element}`;
}

/**
 * Type-safe test ID getter
 * @param testId - Test ID key from TEST_IDS
 * @param suffix - Optional suffix
 * @returns Test ID string
 */
export function testId(testId: string, suffix?: string | number): string {
  return getTestId(testId, suffix);
}

/**
 * Common test ID patterns
 */
export const COMMON_TEST_IDS = {
  // Page containers
  PAGE_CONTAINER: (pageName: string) => `${pageName}-page`,
  
  // Data tables
  DATA_TABLE: (dataType: string) => `${dataType}-table`,
  DATA_ROW: (dataType: string, id: string | number) => `${dataType}-row-${id}`,
  DATA_CELL: (dataType: string, rowId: string | number, column: string) => `${dataType}-cell-${rowId}-${column}`,
  
  // Forms
  FORM: (formName: string) => `${formName}-form`,
  FORM_FIELD: (formName: string, fieldName: string) => `${formName}-field-${fieldName}`,
  FORM_SUBMIT: (formName: string) => `${formName}-submit`,
  
  // Modals
  MODAL: (modalName: string) => `${modalName}-modal`,
  MODAL_TRIGGER: (modalName: string) => `${modalName}-modal-trigger`,
  MODAL_CLOSE: (modalName: string) => `${modalName}-modal-close`,
  
  // Actions
  ACTION: (action: string, context?: string) => `action-${action}${context ? `-${context}` : ''}`,
  
  // Status indicators
  STATUS: (type: string, status: string) => `status-${type}-${status}`,
  
  // Loading states
  LOADING: (context: string) => `loading-${context}`,
  
  // Error states
  ERROR: (context: string) => `error-${context}`,
} as const;
