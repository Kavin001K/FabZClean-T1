# FabZClean Testing Guide

This document outlines the testing strategy, conventions, and best practices for the FabZClean project.

## Table of Contents

1. [Testing Philosophy](#testing-philosophy)
2. [Test ID Conventions](#test-id-conventions)
3. [Component Testing](#component-testing)
4. [Integration Testing](#integration-testing)
5. [E2E Testing](#e2e-testing)
6. [Testing Utilities](#testing-utilities)

## Testing Philosophy

### Testing Pyramid

Our testing strategy follows the testing pyramid approach:

1. **Unit Tests (70%)**: Test individual components and functions in isolation
2. **Integration Tests (20%)**: Test component interactions and API integrations
3. **E2E Tests (10%)**: Test complete user workflows

### Testing Principles

- **Test behavior, not implementation**: Focus on what the component does, not how it does it
- **Write tests that give confidence**: Tests should catch real bugs and regressions
- **Keep tests simple and readable**: Tests should be easy to understand and maintain
- **Test the happy path first**: Ensure core functionality works before edge cases
- **Use descriptive test names**: Test names should clearly describe what is being tested

## Test ID Conventions

### Naming Convention

Test IDs should be descriptive and follow a consistent pattern:

```typescript
// Pattern: [component-name]-[element-type]-[specific-identifier]
data-testid="user-profile-edit-button"
data-testid="order-list-item-123"
data-testid="dashboard-metrics-revenue-card"

// For forms
data-testid="customer-form-name-input"
data-testid="customer-form-email-input"
data-testid="customer-form-submit-button"

// For lists and collections
data-testid="order-list"
data-testid="order-item-{id}"
data-testid="customer-card-{id}"

// For modals and dialogs
data-testid="confirm-delete-dialog"
data-testid="edit-user-modal"
data-testid="add-order-dialog"

// For navigation
data-testid="main-navigation"
data-testid="sidebar-menu"
data-testid="breadcrumb-navigation"
```

### Test ID Categories

#### Interactive Elements
```typescript
// Buttons
data-testid="submit-button"
data-testid="cancel-button"
data-testid="delete-button"
data-testid="edit-button"

// Form inputs
data-testid="name-input"
data-testid="email-input"
data-testid="phone-input"
data-testid="password-input"

// Dropdowns and selects
data-testid="status-select"
data-testid="category-dropdown"
data-testid="date-picker"

// Checkboxes and radios
data-testid="terms-checkbox"
data-testid="newsletter-checkbox"
data-testid="payment-method-radio"
```

#### Display Elements
```typescript
// Cards and containers
data-testid="user-profile-card"
data-testid="order-summary-card"
data-testid="metrics-container"

// Text and labels
data-testid="user-name-text"
data-testid="order-total-amount"
data-testid="status-badge"

// Images and media
data-testid="user-avatar"
data-testid="product-image"
data-testid="company-logo"
```

#### Navigation Elements
```typescript
// Links and navigation
data-testid="dashboard-nav-link"
data-testid="orders-nav-link"
data-testid="customers-nav-link"

// Breadcrumbs
data-testid="breadcrumb-home"
data-testid="breadcrumb-orders"
data-testid="breadcrumb-current"

// Pagination
data-testid="pagination-previous"
data-testid="pagination-next"
data-testid="pagination-page-{number}"
```

## Component Testing

### Basic Component Test Structure

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { UserProfile } from './UserProfile';

describe('UserProfile Component', () => {
  const mockUser = {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890'
  };

  const mockProps = {
    user: mockUser,
    onUserUpdate: vi.fn(),
    isLoading: false
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render user information correctly', () => {
      render(<UserProfile {...mockProps} />);
      
      expect(screen.getByTestId('user-profile')).toBeInTheDocument();
      expect(screen.getByTestId('user-name-text')).toHaveTextContent('John Doe');
      expect(screen.getByTestId('user-email-text')).toHaveTextContent('john@example.com');
      expect(screen.getByTestId('user-phone-text')).toHaveTextContent('+1234567890');
    });

    it('should show loading state when isLoading is true', () => {
      render(<UserProfile {...mockProps} isLoading={true} />);
      
      expect(screen.getByTestId('user-profile-loading')).toBeInTheDocument();
      expect(screen.queryByTestId('user-profile')).not.toBeInTheDocument();
    });

    it('should display edit button when user can be edited', () => {
      render(<UserProfile {...mockProps} />);
      
      expect(screen.getByTestId('edit-user-button')).toBeInTheDocument();
      expect(screen.getByTestId('edit-user-button')).toBeEnabled();
    });
  });

  describe('Interactions', () => {
    it('should enter edit mode when edit button is clicked', async () => {
      render(<UserProfile {...mockProps} />);
      
      const editButton = screen.getByTestId('edit-user-button');
      fireEvent.click(editButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('user-form')).toBeInTheDocument();
        expect(screen.getByTestId('user-name-input')).toBeInTheDocument();
        expect(screen.getByTestId('save-user-button')).toBeInTheDocument();
        expect(screen.getByTestId('cancel-edit-button')).toBeInTheDocument();
      });
    });

    it('should call onUserUpdate when save button is clicked', async () => {
      render(<UserProfile {...mockProps} />);
      
      // Enter edit mode
      fireEvent.click(screen.getByTestId('edit-user-button'));
      
      await waitFor(() => {
        expect(screen.getByTestId('user-form')).toBeInTheDocument();
      });
      
      // Update user name
      const nameInput = screen.getByTestId('user-name-input');
      fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });
      
      // Save changes
      fireEvent.click(screen.getByTestId('save-user-button'));
      
      await waitFor(() => {
        expect(mockProps.onUserUpdate).toHaveBeenCalledWith({
          ...mockUser,
          name: 'Jane Doe'
        });
      });
    });

    it('should cancel edit mode when cancel button is clicked', async () => {
      render(<UserProfile {...mockProps} />);
      
      // Enter edit mode
      fireEvent.click(screen.getByTestId('edit-user-button'));
      
      await waitFor(() => {
        expect(screen.getByTestId('user-form')).toBeInTheDocument();
      });
      
      // Cancel edit
      fireEvent.click(screen.getByTestId('cancel-edit-button'));
      
      await waitFor(() => {
        expect(screen.queryByTestId('user-form')).not.toBeInTheDocument();
        expect(screen.getByTestId('user-name-text')).toHaveTextContent('John Doe');
      });
    });
  });

  describe('Form Validation', () => {
    it('should show validation error for empty name', async () => {
      render(<UserProfile {...mockProps} />);
      
      // Enter edit mode
      fireEvent.click(screen.getByTestId('edit-user-button'));
      
      await waitFor(() => {
        expect(screen.getByTestId('user-form')).toBeInTheDocument();
      });
      
      // Clear name input
      const nameInput = screen.getByTestId('user-name-input');
      fireEvent.change(nameInput, { target: { value: '' } });
      
      // Try to save
      fireEvent.click(screen.getByTestId('save-user-button'));
      
      await waitFor(() => {
        expect(screen.getByTestId('name-error-message')).toBeInTheDocument();
        expect(screen.getByTestId('name-error-message')).toHaveTextContent('Name is required');
      });
    });

    it('should show validation error for invalid email', async () => {
      render(<UserProfile {...mockProps} />);
      
      // Enter edit mode
      fireEvent.click(screen.getByTestId('edit-user-button'));
      
      await waitFor(() => {
        expect(screen.getByTestId('user-form')).toBeInTheDocument();
      });
      
      // Enter invalid email
      const emailInput = screen.getByTestId('user-email-input');
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      
      // Try to save
      fireEvent.click(screen.getByTestId('save-user-button'));
      
      await waitFor(() => {
        expect(screen.getByTestId('email-error-message')).toBeInTheDocument();
        expect(screen.getByTestId('email-error-message')).toHaveTextContent('Please enter a valid email address');
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when save fails', async () => {
      const mockOnUserUpdate = vi.fn().mockRejectedValue(new Error('Save failed'));
      
      render(<UserProfile {...mockProps} onUserUpdate={mockOnUserUpdate} />);
      
      // Enter edit mode and try to save
      fireEvent.click(screen.getByTestId('edit-user-button'));
      
      await waitFor(() => {
        expect(screen.getByTestId('user-form')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByTestId('save-user-button'));
      
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
        expect(screen.getByTestId('error-message')).toHaveTextContent('Failed to save user');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<UserProfile {...mockProps} />);
      
      expect(screen.getByTestId('edit-user-button')).toHaveAttribute('aria-label', 'Edit user profile');
      expect(screen.getByTestId('user-profile')).toHaveAttribute('role', 'region');
      expect(screen.getByTestId('user-profile')).toHaveAttribute('aria-label', 'User profile information');
    });

    it('should be keyboard navigable', async () => {
      render(<UserProfile {...mockProps} />);
      
      const editButton = screen.getByTestId('edit-user-button');
      editButton.focus();
      
      expect(editButton).toHaveFocus();
      
      // Simulate Enter key press
      fireEvent.keyDown(editButton, { key: 'Enter', code: 'Enter' });
      
      await waitFor(() => {
        expect(screen.getByTestId('user-form')).toBeInTheDocument();
      });
    });
  });
});
```

### Testing Custom Hooks

```typescript
import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import { useUserData } from './useUserData';

describe('useUserData Hook', () => {
  const mockApiGet = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock the API module
    vi.mock('@/lib/api', () => ({
      api: {
        get: mockApiGet
      }
    }));
  });

  it('should fetch user data successfully', async () => {
    const mockUser = { id: '1', name: 'John Doe', email: 'john@example.com' };
    mockApiGet.mockResolvedValue({ data: mockUser });

    const { result } = renderHook(() => useUserData('1'));

    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBe(null);
    expect(result.current.error).toBe(null);

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.error).toBe(null);
    expect(mockApiGet).toHaveBeenCalledWith('/users/1');
  });

  it('should handle fetch error', async () => {
    const mockError = new Error('Failed to fetch user');
    mockApiGet.mockRejectedValue(mockError);

    const { result } = renderHook(() => useUserData('1'));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.user).toBe(null);
    expect(result.current.error).toBe('Failed to fetch user');
  });
});
```

## Integration Testing

### Testing Component Integration

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import { UserManagement } from './UserManagement';

describe('UserManagement Integration', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });
    vi.clearAllMocks();
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  it('should load and display users from API', async () => {
    const mockUsers = [
      { id: '1', name: 'John Doe', email: 'john@example.com' },
      { id: '2', name: 'Jane Smith', email: 'jane@example.com' }
    ];

    // Mock API response
    vi.mock('@/lib/api', () => ({
      api: {
        get: vi.fn().mockResolvedValue({ data: mockUsers })
      }
    }));

    renderWithProviders(<UserManagement />);

    // Should show loading state initially
    expect(screen.getByTestId('users-loading')).toBeInTheDocument();

    // Wait for users to load
    await waitFor(() => {
      expect(screen.getByTestId('users-list')).toBeInTheDocument();
    });

    // Should display all users
    expect(screen.getByTestId('user-card-1')).toBeInTheDocument();
    expect(screen.getByTestId('user-card-2')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('should handle user creation workflow', async () => {
    renderWithProviders(<UserManagement />);

    // Click add user button
    fireEvent.click(screen.getByTestId('add-user-button'));

    // Should open create user dialog
    await waitFor(() => {
      expect(screen.getByTestId('create-user-dialog')).toBeInTheDocument();
    });

    // Fill out form
    fireEvent.change(screen.getByTestId('user-name-input'), {
      target: { value: 'New User' }
    });
    fireEvent.change(screen.getByTestId('user-email-input'), {
      target: { value: 'newuser@example.com' }
    });

    // Submit form
    fireEvent.click(screen.getByTestId('create-user-submit'));

    // Should show success message
    await waitFor(() => {
      expect(screen.getByTestId('success-message')).toBeInTheDocument();
      expect(screen.getByText('User created successfully')).toBeInTheDocument();
    });

    // Dialog should close
    await waitFor(() => {
      expect(screen.queryByTestId('create-user-dialog')).not.toBeInTheDocument();
    });
  });
});
```

## E2E Testing

### Playwright E2E Tests

```typescript
import { test, expect } from '@playwright/test';

test.describe('User Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/users');
    
    // Wait for the page to load
    await page.waitForSelector('[data-testid="users-page"]');
  });

  test('should create a new user', async ({ page }) => {
    // Click add user button
    await page.click('[data-testid="add-user-button"]');
    
    // Wait for dialog to open
    await page.waitForSelector('[data-testid="create-user-dialog"]');
    
    // Fill out the form
    await page.fill('[data-testid="user-name-input"]', 'John Doe');
    await page.fill('[data-testid="user-email-input"]', 'john@example.com');
    await page.fill('[data-testid="user-phone-input"]', '+1234567890');
    
    // Submit the form
    await page.click('[data-testid="create-user-submit"]');
    
    // Wait for success message
    await page.waitForSelector('[data-testid="success-message"]');
    
    // Verify user appears in the list
    await page.waitForSelector('[data-testid="user-card-john-doe"]');
    
    // Verify user details
    await expect(page.locator('[data-testid="user-name-john-doe"]')).toContainText('John Doe');
    await expect(page.locator('[data-testid="user-email-john-doe"]')).toContainText('john@example.com');
  });

  test('should edit an existing user', async ({ page }) => {
    // Assume there's already a user in the list
    await page.click('[data-testid="edit-user-button-1"]');
    
    // Wait for edit dialog
    await page.waitForSelector('[data-testid="edit-user-dialog"]');
    
    // Update user name
    await page.fill('[data-testid="user-name-input"]', 'Jane Doe Updated');
    
    // Save changes
    await page.click('[data-testid="save-user-button"]');
    
    // Wait for success message
    await page.waitForSelector('[data-testid="success-message"]');
    
    // Verify updated name appears
    await expect(page.locator('[data-testid="user-name-1"]')).toContainText('Jane Doe Updated');
  });

  test('should delete a user', async ({ page }) => {
    // Click delete button for first user
    await page.click('[data-testid="delete-user-button-1"]');
    
    // Wait for confirmation dialog
    await page.waitForSelector('[data-testid="confirm-delete-dialog"]');
    
    // Confirm deletion
    await page.click('[data-testid="confirm-delete-button"]');
    
    // Wait for success message
    await page.waitForSelector('[data-testid="success-message"]');
    
    // Verify user is removed from list
    await expect(page.locator('[data-testid="user-card-1"]')).not.toBeVisible();
  });

  test('should handle form validation errors', async ({ page }) => {
    // Click add user button
    await page.click('[data-testid="add-user-button"]');
    
    // Wait for dialog
    await page.waitForSelector('[data-testid="create-user-dialog"]');
    
    // Try to submit empty form
    await page.click('[data-testid="create-user-submit"]');
    
    // Check for validation errors
    await expect(page.locator('[data-testid="name-error-message"]')).toContainText('Name is required');
    await expect(page.locator('[data-testid="email-error-message"]')).toContainText('Email is required');
    
    // Fill invalid email
    await page.fill('[data-testid="user-email-input"]', 'invalid-email');
    await page.click('[data-testid="create-user-submit"]');
    
    // Check for email validation error
    await expect(page.locator('[data-testid="email-error-message"]')).toContainText('Please enter a valid email');
  });
});
```

## Testing Utilities

### Custom Render Function

```typescript
// test-utils.tsx
import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
  initialRoute?: string;
}

export function renderWithProviders(
  ui: React.ReactElement,
  {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    }),
    initialRoute = '/',
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  window.history.pushState({}, 'Test page', initialRoute);

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </BrowserRouter>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Re-export everything
export * from '@testing-library/react';
export { renderWithProviders as render };
```

### Test Data Factories

```typescript
// test-factories.ts
export const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: '1',
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+1234567890',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides
});

export const createMockOrder = (overrides: Partial<Order> = {}): Order => ({
  id: '1',
  orderNumber: 'ORD-001',
  customerName: 'John Doe',
  status: 'pending',
  totalAmount: '100.00',
  createdAt: new Date().toISOString(),
  pickupDate: new Date().toISOString(),
  ...overrides
});

export const createMockUsers = (count: number): User[] => {
  return Array.from({ length: count }, (_, index) =>
    createMockUser({
      id: String(index + 1),
      name: `User ${index + 1}`,
      email: `user${index + 1}@example.com`
    })
  );
};
```

### Mock API Responses

```typescript
// api-mocks.ts
import { vi } from 'vitest';

export const mockApiSuccess = <T>(data: T) => {
  return vi.fn().mockResolvedValue({ data });
};

export const mockApiError = (message: string, status: number = 500) => {
  return vi.fn().mockRejectedValue({
    message,
    status,
    response: { status, data: { message } }
  });
};

export const mockApiLoading = () => {
  return vi.fn().mockImplementation(
    () => new Promise(resolve => setTimeout(resolve, 1000))
  );
};
```

## Best Practices

### Do's

- ✅ Use descriptive test IDs that reflect the element's purpose
- ✅ Test user interactions and workflows, not implementation details
- ✅ Include accessibility testing (ARIA labels, keyboard navigation)
- ✅ Test error states and edge cases
- ✅ Use factories for creating test data
- ✅ Mock external dependencies and APIs
- ✅ Write tests that are independent and can run in any order
- ✅ Use meaningful assertions that provide clear failure messages

### Don'ts

- ❌ Don't test implementation details (internal state, private methods)
- ❌ Don't use generic test IDs like "button-1", "div-2"
- ❌ Don't write tests that depend on other tests
- ❌ Don't mock everything - test real integrations where possible
- ❌ Don't ignore accessibility in tests
- ❌ Don't write overly complex tests that are hard to understand
- ❌ Don't skip error handling tests
- ❌ Don't forget to clean up mocks between tests

This testing guide ensures comprehensive coverage while maintaining code quality and reliability across the FabZClean application.
