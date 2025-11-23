# FabZClean Project Structure

## Overview

FabZClean is a comprehensive laundry management system built with React, TypeScript, Supabase, and Express. This document outlines the project structure and organization.

## Root Directory Structure

```
FabZClean/
├── client/                 # Frontend application
├── server/                 # Backend API server
├── supabase/              # Supabase schema and migrations
├── shared/                # Shared code between client and server
├── scripts/               # Utility scripts
├── public/                # Static assets
├── tests/                 # Test files
└── [config files]         # Various configuration files
```

## Frontend Structure (`client/`)

```
client/
├── src/
│   ├── components/        # React components
│   │   ├── auth/         # Authentication components
│   │   ├── layout/       # Layout components (Header, Sidebar, etc.)
│   │   ├── ui/           # Reusable UI components (shadcn/ui)
│   │   ├── accounting/   # Accounting-specific components
│   │   ├── analytics/    # Analytics and reporting components
│   │   ├── customers/    # Customer management components
│   │   ├── inventory/    # Inventory management components
│   │   ├── logistics/    # Logistics and delivery components
│   │   ├── orders/       # Order management components
│   │   └── ...           # Other feature-specific components
│   │
│   ├── contexts/          # React Context providers
│   │   ├── auth-context.tsx        # Authentication state
│   │   ├── realtime-context.tsx    # WebSocket/real-time updates
│   │   └── settings-context.tsx    # App settings
│   │
│   ├── hooks/             # Custom React hooks
│   │   ├── use-auth.tsx            # Authentication hooks
│   │   ├── use-debounce.ts         # Debouncing utility
│   │   ├── use-mobile.tsx          # Mobile detection
│   │   └── ...                     # Other custom hooks
│   │
│   ├── lib/               # Utility libraries
│   │   ├── supabase.ts            # Supabase client configuration
│   │   ├── queryClient.ts         # React Query configuration
│   │   ├── utils.ts               # General utilities
│   │   └── ...                    # Other utility modules
│   │
│   ├── pages/             # Page components
│   │   ├── dashboard.tsx          # Main dashboard
│   │   ├── login.tsx              # Login page
│   │   ├── signup.tsx             # Signup page
│   │   ├── orders.tsx             # Orders list
│   │   ├── customers.tsx          # Customers list
│   │   └── ...                    # Other pages
│   │
│   ├── types/             # TypeScript type definitions
│   │   ├── supabase.ts            # Supabase types
│   │   └── dashboard.ts           # Dashboard types
│   │
│   ├── App.tsx            # Main app component
│   ├── main.tsx           # App entry point
│   └── index.css          # Global styles
│
└── public/                # Static assets

```

## Backend Structure (`server/`)

```
server/
├── routes/                # API route handlers
│   ├── orders.ts         # Order-related endpoints
│   ├── customers.ts      # Customer-related endpoints
│   ├── inventory.ts      # Inventory management
│   ├── deliveries.ts     # Delivery tracking
│   └── ...               # Other route modules
│
├── services/             # Business logic services
│   ├── order-service.ts
│   ├── customer-service.ts
│   └── ...
│
├── algorithms/           # Advanced algorithms
│   ├── route-optimization.ts
│   ├── load-balancing.ts
│   └── ...
│
├── middleware/           # Express middleware
│   └── auth.ts          # Authentication middleware
│
├── models/              # Data models
│   └── types.ts
│
├── index.ts             # Server entry point
├── routes.ts            # Route registration
├── db.ts                # Database connection
└── schema.ts            # Validation schemas
```

## Supabase Structure (`supabase/`)

```
supabase/
├── schema.sql           # Database schema definition
└── migrations/          # Database migrations (future)
```

## Shared Code (`shared/`)

```
shared/
├── schema.ts            # Shared type definitions
├── validation-utils.ts  # Validation helpers
└── gst-utils.ts        # GST calculation utilities
```

## Key Files

### Configuration Files

- `package.json` - Project dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `vite.config.ts` - Vite bundler configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `supabase-env-template.txt` - Environment variables template

### Documentation Files

- `README.md` - Project overview
- `SUPABASE_SETUP.md` - Supabase setup guide
- `API_DOCUMENTATION.md` - API endpoints documentation
- `ARCHITECTURE_DOCUMENTATION.md` - System architecture
- `PROJECT_STRUCTURE.md` - This file

## Component Organization

### UI Components (`client/src/components/ui/`)

These are reusable, generic UI components from shadcn/ui:
- `button.tsx` - Button component
- `card.tsx` - Card component
- `dialog.tsx` - Modal dialog
- `form.tsx` - Form components
- `input.tsx` - Input field
- `select.tsx` - Select dropdown
- `table.tsx` - Data table
- And many more...

### Feature Components

Feature-specific components are organized by domain:

**Authentication** (`components/auth/`)
- `login-form.tsx` - Login form
- `signup-form.tsx` - Signup form
- `protected-route.tsx` - Route protection wrapper
- `role-guard.tsx` - Component-level role checking

**Layout** (`components/layout/`)
- `main-layout.tsx` - Main application layout
- `header.tsx` - Top header with navigation
- `sidebar.tsx` - Sidebar navigation
- `footer.tsx` - Footer component
- `user-menu.tsx` - User profile menu

**Domain-Specific** (orders, customers, etc.)
- Each domain has its own folder with related components
- Components are named descriptively (e.g., `customer-table.tsx`)
- Dialogs and forms are kept with their related components

## State Management

### Context API
- Used for global state (auth, settings, realtime)
- Located in `client/src/contexts/`

### React Query
- Used for server state and caching
- Configured in `client/src/lib/queryClient.ts`
- Custom hooks in `client/src/hooks/`

### Local State
- Component-local state uses `useState`
- Form state uses `react-hook-form`

## Styling

### Tailwind CSS
- Utility-first CSS framework
- Configuration in `tailwind.config.ts`
- Custom theme and design tokens

### Component Styles
- Inline Tailwind classes
- CSS modules for complex components
- Global styles in `client/src/index.css`

## Data Flow

1. **User Interaction** → Component
2. **Component** → React Query Hook
3. **Hook** → API Call (Supabase)
4. **API** → Database (PostgreSQL)
5. **Response** → Cache & Update UI

## Authentication Flow

1. User enters credentials → Login Form
2. Form calls `signIn()` from Auth Context
3. Auth Context → Supabase Auth
4. Supabase → Returns JWT + User
5. Auth Context updates state
6. Protected routes check auth state
7. User redirected to dashboard

## Role-Based Access Control

1. User logs in → User profile fetched
2. Profile contains `role` field
3. `ProtectedRoute` checks `allowedRoles`
4. `RoleGuard` shows/hides UI elements
5. Supabase RLS enforces at database level

## API Architecture

### RESTful Endpoints
- Follow REST conventions
- Proper HTTP methods (GET, POST, PUT, DELETE)
- Consistent response format

### WebSocket (Optional)
- Real-time updates for orders, deliveries
- Connection managed by realtime-context

## Database Architecture

### Tables
- **users** - User accounts and profiles
- **franchises** - Franchise locations
- **factories** - Processing facilities
- **customers** - Customer information
- **orders** - Order records
- **order_items** - Individual order items
- **services** - Available services
- **drivers** - Delivery drivers
- **deliveries** - Delivery tracking
- **inventory** - Stock management
- **activity_logs** - Audit trail

### Relationships
- Foreign keys enforce referential integrity
- Cascade deletes where appropriate
- Indexes on frequently queried columns

## Development Workflow

1. **Feature Branch** - Create from main
2. **Develop** - Write code and tests
3. **Test** - Run tests locally
4. **Lint** - Check code style
5. **Commit** - Commit with meaningful message
6. **Push** - Push to remote
7. **Review** - Create pull request
8. **Merge** - Merge to main

## Build and Deploy

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Environment Variables
- `.env` - Development (not committed)
- `.env.production` - Production (not committed)
- `supabase-env-template.txt` - Template for reference

## Testing

```
tests/
├── unit/              # Unit tests
├── integration/       # Integration tests
└── e2e/              # End-to-end tests
```

## Scripts

```
scripts/
├── backup_db.sh              # Database backup
├── migrate_sqlite_to_mysql.py # Migration utility
└── ...                        # Other utilities
```

## Best Practices

### Code Organization
- One component per file
- Co-locate related files
- Keep files under 300 lines
- Use meaningful names

### TypeScript
- Define types for all props
- Avoid `any` type
- Use interfaces for objects
- Export types when shared

### React
- Use functional components
- Custom hooks for logic reuse
- Memoize expensive computations
- Clean up effects properly

### Styling
- Mobile-first approach
- Consistent spacing (4px grid)
- Use theme colors
- Dark mode support

## Future Enhancements

- GraphQL API layer
- Real-time collaboration
- Advanced analytics
- Mobile app (React Native)
- Offline support
- Multi-language support

## Contributing

When adding new features:
1. Follow existing structure
2. Add types for new data
3. Update documentation
4. Write tests
5. Update this document if needed

## Questions?

Refer to other documentation files or create an issue in the repository.

