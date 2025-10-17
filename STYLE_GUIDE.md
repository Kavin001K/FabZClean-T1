# FabZClean Style Guide

This document outlines the coding standards, conventions, and best practices for the FabZClean project.

## Table of Contents

1. [General Principles](#general-principles)
2. [TypeScript/JavaScript](#typescriptjavascript)
3. [React Components](#react-components)
4. [CSS/Styling](#cssstyling)
5. [Testing](#testing)
6. [File Organization](#file-organization)
7. [Documentation](#documentation)

## General Principles

### Code Quality
- Write self-documenting code with clear, descriptive names
- Keep functions and components small and focused (single responsibility)
- Use TypeScript for type safety and better developer experience
- Follow the principle of least surprise - code should behave as expected

### Performance
- Use React.memo() for components that receive stable props
- Implement proper loading states and error boundaries
- Optimize bundle size with code splitting where appropriate
- Use useMemo() and useCallback() judiciously for expensive operations

### Accessibility
- Include proper ARIA labels and roles
- Ensure keyboard navigation works correctly
- Maintain proper color contrast ratios
- Add comprehensive test IDs for automated testing

## TypeScript/JavaScript

### Naming Conventions

```typescript
// Variables and functions: camelCase
const userName = 'john_doe';
const calculateTotalAmount = (items: Item[]) => { ... };

// Constants: SCREAMING_SNAKE_CASE
const MAX_RETRY_ATTEMPTS = 3;
const API_BASE_URL = 'https://api.example.com';

// Types and Interfaces: PascalCase
interface UserProfile {
  id: string;
  name: string;
  email: string;
}

type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled';

// Components: PascalCase
const UserDashboard: React.FC = () => { ... };

// Files: kebab-case
// user-profile.tsx
// order-management.tsx
```

### Type Definitions

```typescript
// Always define interfaces for component props
interface ButtonProps {
  /** Button text content */
  children: React.ReactNode;
  /** Click handler */
  onClick?: () => void;
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'danger';
  /** Loading state */
  isLoading?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Test identifier */
  'data-testid'?: string;
}

// Use union types for known values
type Theme = 'light' | 'dark' | 'auto';
type Size = 'sm' | 'md' | 'lg' | 'xl';

// Use generic types for reusable interfaces
interface ApiResponse<T> {
  data: T;
  message: string;
  status: 'success' | 'error';
}
```

### Function Declarations

```typescript
// Prefer arrow functions for components
const UserCard: React.FC<UserCardProps> = ({ user, onEdit }) => {
  // Component logic here
};

// Use regular functions for utilities
function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

// Use async/await instead of .then()
const fetchUserData = async (userId: string): Promise<User> => {
  try {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch user data:', error);
    throw error;
  }
};
```

## React Components

### Component Structure

```typescript
/**
 * User Profile Component
 * 
 * Displays user information with edit capabilities.
 * Handles form validation and submission.
 * 
 * @component
 */

import React, { useState, useCallback } from 'react';
import { User } from '@/types/user';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface UserProfileProps {
  /** User data to display */
  user: User;
  /** Callback when user is updated */
  onUserUpdate: (user: User) => void;
  /** Loading state */
  isLoading?: boolean;
  /** Custom CSS class */
  className?: string;
}

/**
 * UserProfile Component
 */
export const UserProfile: React.FC<UserProfileProps> = ({
  user,
  onUserUpdate,
  isLoading = false,
  className = ''
}) => {
  // State declarations
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(user);

  // Event handlers
  const handleEdit = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleSave = useCallback(async () => {
    try {
      await onUserUpdate(formData);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  }, [formData, onUserUpdate]);

  // Render
  return (
    <div className={`user-profile ${className}`} data-testid="user-profile">
      {/* Component JSX */}
    </div>
  );
};

// Default export for the component
export default UserProfile;
```

### Hooks Usage

```typescript
// Custom hooks should start with 'use'
const useUserData = (userId: string) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const userData = await api.getUser(userId);
        setUser(userData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  return { user, loading, error };
};

// Use useCallback for event handlers
const handleSubmit = useCallback(async (data: FormData) => {
  setIsSubmitting(true);
  try {
    await onSubmit(data);
  } finally {
    setIsSubmitting(false);
  }
}, [onSubmit]);

// Use useMemo for expensive calculations
const expensiveValue = useMemo(() => {
  return heavyCalculation(data);
}, [data]);
```

### Component Composition

```typescript
// Prefer composition over large monolithic components
const Dashboard: React.FC = () => {
  return (
    <div className="dashboard" data-testid="dashboard">
      <DashboardHeader />
      <DashboardMetrics />
      <DashboardCharts />
      <DashboardActivity />
    </div>
  );
};

// Create reusable sub-components
const DashboardMetrics: React.FC = () => {
  return (
    <div className="dashboard-metrics" data-testid="dashboard-metrics">
      <MetricCard title="Revenue" value="$12,345" />
      <MetricCard title="Orders" value="123" />
      <MetricCard title="Customers" value="456" />
    </div>
  );
};
```

## CSS/Styling

### Tailwind CSS Classes

```typescript
// Use consistent spacing scale
const spacing = {
  xs: 'p-1',    // 4px
  sm: 'p-2',    // 8px
  md: 'p-4',    // 16px
  lg: 'p-6',    // 24px
  xl: 'p-8',    // 32px
};

// Group related classes
<div className={cn(
  // Layout
  "flex items-center justify-between",
  // Spacing
  "p-4 mb-6",
  // Styling
  "bg-white rounded-lg shadow-sm",
  // Responsive
  "md:p-6 lg:p-8",
  // Conditional
  isActive && "border-blue-500",
  className
)}>
```

### Component Styling

```typescript
// Use the cn utility for conditional classes
import { cn } from '@/lib/utils';

const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  size = 'md', 
  className,
  ...props 
}) => {
  return (
    <button
      className={cn(
        // Base styles
        "inline-flex items-center justify-center rounded-md font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        
        // Variants
        {
          'bg-primary text-primary-foreground hover:bg-primary/90': variant === 'primary',
          'bg-secondary text-secondary-foreground hover:bg-secondary/80': variant === 'secondary',
          'bg-destructive text-destructive-foreground hover:bg-destructive/90': variant === 'destructive',
        },
        
        // Sizes
        {
          'h-8 px-3 text-sm': size === 'sm',
          'h-10 px-4': size === 'md',
          'h-12 px-6 text-lg': size === 'lg',
        },
        
        className
      )}
      {...props}
    />
  );
};
```

## Testing

### Test IDs

```typescript
// Always include data-testid for interactive elements
<button 
  data-testid="submit-button"
  onClick={handleSubmit}
>
  Submit
</button>

// Use descriptive test IDs that reflect the element's purpose
<div data-testid="user-profile-card">
  <h2 data-testid="user-name">{user.name}</h2>
  <p data-testid="user-email">{user.email}</p>
  <button data-testid="edit-user-button">Edit</button>
</div>

// For lists, include index or unique identifier
{users.map((user, index) => (
  <div key={user.id} data-testid={`user-card-${user.id}`}>
    <span data-testid={`user-name-${user.id}`}>{user.name}</span>
  </div>
))}
```

### Test Structure

```typescript
// Group tests logically
describe('UserProfile Component', () => {
  describe('Rendering', () => {
    it('should display user information', () => {
      // Test implementation
    });

    it('should show edit button when user can edit', () => {
      // Test implementation
    });
  });

  describe('Interactions', () => {
    it('should enable edit mode when edit button is clicked', () => {
      // Test implementation
    });

    it('should save changes when save button is clicked', () => {
      // Test implementation
    });
  });

  describe('Error Handling', () => {
    it('should display error message when save fails', () => {
      // Test implementation
    });
  });
});
```

## File Organization

### Directory Structure

```
src/
├── components/           # Reusable UI components
│   ├── ui/              # Basic UI components (buttons, inputs, etc.)
│   ├── dashboard/       # Dashboard-specific components
│   ├── orders/          # Order-related components
│   └── customers/       # Customer-related components
├── hooks/               # Custom React hooks
├── lib/                 # Utility functions and configurations
├── pages/               # Page components
├── types/               # TypeScript type definitions
└── styles/              # Global styles and themes
```

### File Naming

```
// Components: PascalCase with .tsx extension
UserProfile.tsx
OrderManagement.tsx
DashboardMetrics.tsx

// Hooks: camelCase starting with 'use'
useUserData.tsx
useOrderFilters.tsx
useDashboardMetrics.tsx

// Utilities: camelCase with .ts extension
formatUtils.ts
apiClient.ts
dateHelpers.ts

// Types: camelCase with .ts extension
userTypes.ts
orderTypes.ts
dashboardTypes.ts
```

## Documentation

### Component Documentation

```typescript
/**
 * User Profile Component
 * 
 * A comprehensive user profile display and editing component.
 * Supports inline editing, validation, and real-time updates.
 * 
 * @example
 * ```tsx
 * <UserProfile 
 *   user={currentUser}
 *   onUserUpdate={handleUserUpdate}
 *   isLoading={isUpdating}
 * />
 * ```
 * 
 * @component
 */
export const UserProfile: React.FC<UserProfileProps> = ({
  /** User data to display and edit */
  user,
  /** Callback fired when user data is updated */
  onUserUpdate,
  /** Loading state indicator */
  isLoading = false
}) => {
  // Component implementation
};
```

### Function Documentation

```typescript
/**
 * Formats a number as currency with proper localization
 * 
 * @param amount - The numeric amount to format
 * @param currency - The currency code (default: 'USD')
 * @param locale - The locale for formatting (default: 'en-US')
 * @returns Formatted currency string
 * 
 * @example
 * ```typescript
 * formatCurrency(1234.56) // "$1,234.56"
 * formatCurrency(1234.56, 'EUR', 'de-DE') // "1.234,56 €"
 * ```
 */
export function formatCurrency(
  amount: number, 
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
}
```

### README Documentation

Each major component or feature should include:

1. **Purpose**: What the component does
2. **Usage**: How to use it with examples
3. **Props**: Detailed prop documentation
4. **Styling**: How to customize appearance
5. **Testing**: How to test the component
6. **Accessibility**: Accessibility considerations

## Code Review Checklist

### Before Submitting

- [ ] Code follows the established naming conventions
- [ ] Components are properly typed with TypeScript
- [ ] All interactive elements have test IDs
- [ ] Components are documented with JSDoc comments
- [ ] No console.log statements in production code
- [ ] Error handling is implemented where appropriate
- [ ] Loading states are handled properly
- [ ] Accessibility attributes are included

### During Review

- [ ] Code is readable and self-documenting
- [ ] Components are appropriately sized and focused
- [ ] Performance considerations are addressed
- [ ] Security best practices are followed
- [ ] Tests cover the main functionality
- [ ] Documentation is accurate and helpful

## Tools and Linting

### ESLint Configuration

```json
{
  "extends": [
    "eslint:recommended",
    "@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended"
  ],
  "rules": {
    "react/prop-types": "off",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/no-unused-vars": "error",
    "prefer-const": "error",
    "no-var": "error"
  }
}
```

### Prettier Configuration

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false
}
```

This style guide should be followed consistently across the entire codebase to maintain code quality, readability, and maintainability.

