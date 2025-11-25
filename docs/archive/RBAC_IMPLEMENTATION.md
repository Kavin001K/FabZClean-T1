# Role-Based Access Control (RBAC) Implementation

## User Roles

### 1. **Admin**
- **Full Access** to all features
- Can manage all users, franchises, and factories
- Access to:
  - Dashboard
  - Orders
  - Customers
  - Services
  - Inventory
  - Logistics
  - Live Tracking
  - Documents
  - Accounting
  - Analytics
  - Employee Dashboard
  - User Management
  - Franchise Dashboard
  - Database Status

### 2. **Franchise Manager**
- Manages franchise-level operations
- Access to:
  - Dashboard
  - Orders
  - Customers
  - Live Tracking
  - Analytics
  - User Management (franchise employees only)
  - Franchise Dashboard

### 3. **Factory Manager**
- Manages factory operations
- Access to:
  - Dashboard
  - Orders
  - Services
  - Inventory
  - Logistics
  - Live Tracking
  - Documents
  - Accounting
  - Analytics
  - Employee Dashboard
  - User Management (factory employees only)
  - Database Status

### 4. **Employee**
- Basic operational access
- Access to:
  - Dashboard
  - Orders
  - Customers
  - Services
  - Documents
  - Employee Dashboard

### 5. **Driver**
- Delivery and logistics focused
- Access to:
  - Dashboard
  - Logistics
  - Live Tracking

## Implementation Details

### Frontend
- **Sidebar Navigation**: Filtered based on user role (see `client/src/components/layout/sidebar.tsx`)
- **Route Protection**: Protected routes check user role before rendering (see `client/src/components/auth/protected-route.tsx`)
- **Employee Type**: Updated to include all roles (`admin`, `franchise_manager`, `factory_manager`, `employee`, `driver`)

### Backend
- **Authentication Middleware**: `authMiddleware` verifies JWT tokens
- **Role Middleware**: `roleMiddleware` checks if user has required role
- **Route Protection**: Each route specifies allowed roles

## Testing RBAC

### Test Scenarios

1. **Admin User**
   - Should see all navigation items
   - Should access all pages without restriction

2. **Franchise Manager**
   - Should see: Dashboard, Orders, Customers, Live Tracking, Analytics, User Management, Franchise Dashboard
   - Should NOT see: Services, Inventory, Logistics, Documents, Accounting, Employee Dashboard, Database Status

3. **Factory Manager**
   - Should see: Dashboard, Orders, Services, Inventory, Logistics, Live Tracking, Documents, Accounting, Analytics, Employee Dashboard, User Management, Database Status
   - Should NOT see: Customers, Franchise Dashboard

4. **Employee**
   - Should see: Dashboard, Orders, Customers, Services, Documents, Employee Dashboard
   - Should NOT see: Inventory, Logistics, Live Tracking, Accounting, Analytics, User Management, Franchise Dashboard, Database Status

5. **Driver**
   - Should see: Dashboard, Logistics, Live Tracking
   - Should NOT see: Orders, Customers, Services, Inventory, Documents, Accounting, Analytics, Employee Dashboard, User Management, Franchise Dashboard, Database Status

## How to Test

1. Create test users with different roles
2. Login with each user
3. Verify sidebar shows only allowed navigation items
4. Try to access restricted pages directly via URL
5. Verify protected routes redirect to unauthorized page

## Files Modified

- `client/src/contexts/auth-context.tsx` - Added `employee` and `driver` to role type
- `client/src/components/layout/sidebar.tsx` - Added role labels for all roles
- `client/src/lib/data-service.ts` - Fixed API response handling for all endpoints
