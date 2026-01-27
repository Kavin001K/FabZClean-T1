/**
 * Documentation utilities for consistent JSDoc comments and component documentation
 * Provides templates and helpers for generating comprehensive documentation
 */

/**
 * JSDoc template for React components
 */
export const COMPONENT_JSDOC_TEMPLATE = `/**
 * {componentName} - {description}
 * 
 * @component
 * @param {Object} props - Component props
 * @param {string} [props.className] - Additional CSS classes
 * @param {React.ReactNode} [props.children] - Child elements
 * @param {string} [props.testId] - Test identifier for testing
 * @param {Function} [props.onClick] - Click handler function
 * @param {boolean} [props.disabled] - Whether the component is disabled
 * @param {string} [props.variant] - Visual variant of the component
 * @param {string} [props.size] - Size of the component
 * @param {Object} [props.style] - Inline styles
 * @param {Object} [props.aria] - ARIA attributes for accessibility
 * @returns {JSX.Element} Rendered component
 * 
 * @example
 * \`\`\`tsx
 * <{componentName}
 *   className="custom-class"
 *   testId="my-component"
 *   onClick={handleClick}
 *   disabled={false}
 *   variant="primary"
 *   size="md"
 * >
 *   Content here
 * </{componentName}>
 * \`\`\`
 * 
 * @see {@link https://example.com/docs} for more information
 */`;

/**
 * JSDoc template for custom hooks
 */
export const HOOK_JSDOC_TEMPLATE = `/**
 * {hookName} - {description}
 * 
 * @hook
 * @param {any} param1 - Description of parameter 1
 * @param {any} [param2] - Optional parameter 2
 * @returns {Object} Hook return value
 * @returns {any} returns.value - Description of returned value
 * @returns {Function} returns.setValue - Description of returned function
 * @returns {boolean} returns.isLoading - Loading state
 * @returns {Error} returns.error - Error state
 * 
 * @example
 * \`\`\`tsx
 * const { value, setValue, isLoading, error } = use{hookName}(param1, param2);
 * \`\`\`
 * 
 * @see {@link https://example.com/docs} for more information
 */`;

/**
 * JSDoc template for utility functions
 */
export const UTILITY_JSDOC_TEMPLATE = `/**
 * {functionName} - {description}
 * 
 * @function
 * @param {any} param1 - Description of parameter 1
 * @param {any} [param2] - Optional parameter 2
 * @returns {any} Description of return value
 * 
 * @example
 * \`\`\`tsx
 * const result = {functionName}(param1, param2);
 * \`\`\`
 * 
 * @throws {Error} Description of when this function throws
 * 
 * @see {@link https://example.com/docs} for more information
 */`;

/**
 * JSDoc template for TypeScript interfaces
 */
export const INTERFACE_JSDOC_TEMPLATE = `/**
 * {interfaceName} - {description}
 * 
 * @interface
 * @property {string} property1 - Description of property 1
 * @property {number} [property2] - Optional property 2
 * @property {Function} [property3] - Optional function property
 * 
 * @example
 * \`\`\`tsx
 * const example: {interfaceName} = {
 *   property1: 'value',
 *   property2: 42,
 *   property3: () =>
* };
 * \`\`\`
 */`;

/**
 * JSDoc template for enums
 */
export const ENUM_JSDOC_TEMPLATE = `/**
 * {enumName} - {description}
 * 
 * @enum
 * @readonly
 * @property {string} VALUE1 - Description of value 1
 * @property {string} VALUE2 - Description of value 2
 * 
 * @example
 * \`\`\`tsx
 * const value = {enumName}.VALUE1;
 * \`\`\`
 */`;

/**
 * Common JSDoc tags
 */
export const JSDOC_TAGS = {
  // Component tags
  COMPONENT: '@component',
  PARAM: '@param',
  RETURNS: '@returns',
  EXAMPLE: '@example',
  SEE: '@see',
  SINCE: '@since',
  DEPRECATED: '@deprecated',
  
  // Hook tags
  HOOK: '@hook',
  
  // Function tags
  FUNCTION: '@function',
  THROWS: '@throws',
  
  // Type tags
  INTERFACE: '@interface',
  ENUM: '@enum',
  TYPE: '@type',
  READONLY: '@readonly',
  
  // Accessibility tags
  ACCESSIBILITY: '@accessibility',
  ARIA: '@aria',
  
  // Performance tags
  PERFORMANCE: '@performance',
  OPTIMIZATION: '@optimization',
  
  // Testing tags
  TEST: '@test',
  TESTID: '@testid',
} as const;

/**
 * Common JSDoc descriptions
 */
export const JSDOC_DESCRIPTIONS = {
  // Component descriptions
  COMPONENT: {
    BUTTON: 'A clickable button component with various styles and sizes',
    CARD: 'A container component for grouping related content',
    MODAL: 'A dialog component that overlays the main content',
    FORM: 'A form component with validation and submission handling',
    TABLE: 'A data table component with sorting and filtering',
    INPUT: 'An input field component with validation states',
    SELECT: 'A dropdown select component with search functionality',
    CHECKBOX: 'A checkbox input component with label support',
    RADIO: 'A radio button input component with group support',
    BADGE: 'A small status indicator component',
    AVATAR: 'A user avatar component with fallback support',
    LOADING: 'A loading indicator component with various styles',
    ERROR: 'An error display component with retry functionality',
  },
  
  // Hook descriptions
  HOOK: {
    STATE: 'A state management hook with additional utilities',
    EFFECT: 'A side effect hook with cleanup and dependencies',
    CALLBACK: 'A memoized callback hook for performance optimization',
    MEMO: 'A memoized value hook for expensive calculations',
    REF: 'A ref hook for accessing DOM elements',
    QUERY: 'A data fetching hook with caching and error handling',
    MUTATION: 'A data mutation hook with optimistic updates',
    DEBOUNCE: 'A debounced value hook for search and input handling',
    THROTTLE: 'A throttled value hook for scroll and resize handling',
    LOCAL_STORAGE: 'A local storage hook with serialization',
    SESSION_STORAGE: 'A session storage hook with serialization',
    WEBSOCKET: 'A WebSocket connection hook with reconnection',
    NOTIFICATION: 'A notification management hook',
  },
  
  // Utility descriptions
  UTILITY: {
    FORMAT: 'A formatting utility function for data display',
    VALIDATE: 'A validation utility function for form inputs',
    PARSE: 'A parsing utility function for data conversion',
    TRANSFORM: 'A transformation utility function for data manipulation',
    FILTER: 'A filtering utility function for data arrays',
    SORT: 'A sorting utility function for data arrays',
    SEARCH: 'A search utility function for data arrays',
    EXPORT: 'An export utility function for data files',
    IMPORT: 'An import utility function for data files',
    LOG: 'A logging utility function for debugging',
    ERROR: 'An error handling utility function',
    PERFORMANCE: 'A performance monitoring utility function',
  },
} as const;

/**
 * Generate JSDoc comment for a component
 */
export function generateComponentJSDoc(
  componentName: string,
  description: string,
  props: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
  }>,
  example?: string
): string {
  const propsDoc = props.map(prop => 
    ` * @param {${prop.type}} ${prop.required ? prop.name : `[${prop.name}]`} - ${prop.description}`
  ).join('\n');
  
  const exampleDoc = example ? `\n * \n * @example\n * \`\`\`tsx\n * ${example}\n * \`\`\`` : '';
  
  return `/**\n * ${componentName} - ${description}\n * \n * @component\n${propsDoc}\n * @returns {JSX.Element} Rendered component${exampleDoc}\n */`;
}

/**
 * Generate JSDoc comment for a hook
 */
export function generateHookJSDoc(
  hookName: string,
  description: string,
  params: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
  }>,
  returns: Array<{
    name: string;
    type: string;
    description: string;
  }>,
  example?: string
): string {
  const paramsDoc = params.map(param => 
    ` * @param {${param.type}} ${param.required ? param.name : `[${param.name}]`} - ${param.description}`
  ).join('\n');
  
  const returnsDoc = returns.map(ret => 
    ` * @returns {${ret.type}} returns.${ret.name} - ${ret.description}`
  ).join('\n');
  
  const exampleDoc = example ? `\n * \n * @example\n * \`\`\`tsx\n * ${example}\n * \`\`\`` : '';
  
  return `/**\n * ${hookName} - ${description}\n * \n * @hook\n${paramsDoc}\n${returnsDoc}${exampleDoc}\n */`;
}

/**
 * Generate JSDoc comment for a utility function
 */
export function generateUtilityJSDoc(
  functionName: string,
  description: string,
  params: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
  }>,
  returnType: string,
  returnDescription: string,
  example?: string,
  throws?: string
): string {
  const paramsDoc = params.map(param => 
    ` * @param {${param.type}} ${param.required ? param.name : `[${param.name}]`} - ${param.description}`
  ).join('\n');
  
  const returnsDoc = ` * @returns {${returnType}} ${returnDescription}`;
  
  const throwsDoc = throws ? `\n * \n * @throws {Error} ${throws}` : '';
  
  const exampleDoc = example ? `\n * \n * @example\n * \`\`\`tsx\n * ${example}\n * \`\`\`` : '';
  
  return `/**\n * ${functionName} - ${description}\n * \n * @function\n${paramsDoc}\n${returnsDoc}${throwsDoc}${exampleDoc}\n */`;
}

/**
 * Generate JSDoc comment for an interface
 */
export function generateInterfaceJSDoc(
  interfaceName: string,
  description: string,
  properties: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
  }>,
  example?: string
): string {
  const propertiesDoc = properties.map(prop => 
    ` * @property {${prop.type}} ${prop.required ? prop.name : `[${prop.name}]`} - ${prop.description}`
  ).join('\n');
  
  const exampleDoc = example ? `\n * \n * @example\n * \`\`\`tsx\n * ${example}\n * \`\`\`` : '';
  
  return `/**\n * ${interfaceName} - ${description}\n * \n * @interface\n${propertiesDoc}${exampleDoc}\n */`;
}

/**
 * Common accessibility JSDoc comments
 */
export const ACCESSIBILITY_JSDOC = {
  ARIA_LABEL: 'ARIA label for screen readers',
  ARIA_DESCRIBEDBY: 'ARIA describedby for additional description',
  ARIA_EXPANDED: 'ARIA expanded state for collapsible content',
  ARIA_SELECTED: 'ARIA selected state for selectable items',
  ARIA_CHECKED: 'ARIA checked state for checkable items',
  ARIA_DISABLED: 'ARIA disabled state for disabled elements',
  ARIA_HIDDEN: 'ARIA hidden state for visually hidden elements',
  ROLE: 'ARIA role for semantic meaning',
  TAB_INDEX: 'Tab index for keyboard navigation',
  KEYBOARD: 'Keyboard interaction support',
  FOCUS: 'Focus management and styling',
} as const;

/**
 * Common performance JSDoc comments
 */
export const PERFORMANCE_JSDOC = {
  MEMOIZED: 'This component is memoized for performance optimization',
  DEBOUNCED: 'This function is debounced to prevent excessive calls',
  THROTTLED: 'This function is throttled to limit call frequency',
  LAZY_LOADED: 'This component is lazy loaded for better performance',
  VIRTUALIZED: 'This list is virtualized for large datasets',
  CACHED: 'This value is cached to avoid recalculation',
  OPTIMIZED: 'This function is optimized for performance',
} as const;

/**
 * Common testing JSDoc comments
 */
export const TESTING_JSDOC = {
  TEST_ID: 'Test identifier for automated testing',
  TESTABLE: 'This component is designed to be easily testable',
  MOCKABLE: 'This function can be easily mocked in tests',
  COVERAGE: 'This function has test coverage',
  INTEGRATION: 'This component has integration tests',
  E2E: 'This component has end-to-end tests',
} as const;
