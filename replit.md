# FabzClean

A laundry management SaaS application built with React + Vite (frontend) and Express + TypeScript (backend).

## Architecture

- **Frontend:** React + TypeScript + Vite, TailwindCSS + shadcn/ui, Framer Motion
- **Backend:** Express.js + TypeScript (server/minimal-server.ts is the entrypoint)
- **Database:** Supabase (PostgreSQL) as primary; schema in `server/schema.ts`
- **Storage:** Supabase + local fallback at `server/uploads/`
- **Routing:** Wouter (client-side)
- **State:** React Query (server state), Context API (auth, settings, theme)
- **Realtime:** Supabase Realtime (postgres_changes) for customers, orders, services, employees, wallet_transactions; WebSocket fallback for additional events

## Project Structure

```
client/src/
  pages/          - Route-level page components
  components/     - Reusable UI components
  contexts/       - Auth, Settings, Query, Realtime contexts
  hooks/          - Custom hooks (use-realtime, use-websocket, etc.)
  lib/            - Utilities, keyboard-shortcuts, data-service
  index.css       - Global styles + Tailwind
server/
  minimal-server.ts  - Main Express entrypoint
  schema.ts          - Database schema (Drizzle ORM)
  storage.ts         - Storage abstraction layer
  SupabaseStorage.ts - Supabase storage implementation
  auth-service.ts    - Authentication logic
  settings-service.ts - Settings persistence service
```

## Active Pages

- `/` — Dashboard
- `/orders` — Order management
- `/customers` — Customer management (paginated, default 20/page)
- `/create-order` — New order form (full dark mode support)
- `/services` — Service catalog
- `/print-queue` — Print queue
- `/profile` — User profile + image upload
- `/settings` — App settings (cloud persistence via user_settings table)
- `/user-management` — User/role management
- `/wallet-management` — Wallet/credits management
- `/analytics` — Analytics dashboard
- `/account-inactive` — Account suspended gate
- `/terms`, `/privacy`, `/refund`, `/cookies` — Legal pages

## Key Features

- Dark/light/system theme with localStorage persistence (key: `fabzclean-theme`)
- Login screen: glassmorphism UI with animated background blobs
- Mobile-responsive layout: Sheet drawer sidebar on mobile, bottom nav bar
- Role-based access: admin, employee, customer
- Profile image upload with graceful error handling
- Real-time updates via Supabase Realtime (postgres_changes on key tables)
- Platform-aware keyboard shortcuts (Cmd on Mac, Ctrl on Windows)
- Session timeout warning with extend/logout buttons
- Analytics with daily cron computation
- Loyalty program engine
- Export to Excel/PDF on customers and orders pages

## Performance Optimizations

- No polling: removed `refetchInterval` from customers, orders, credits pages
- `staleTime: 30000` for customers, `staleTime: 60000` for customer orders
- `refetchOnWindowFocus: true` for fresh data on tab switch
- Supabase Realtime invalidates React Query cache on data changes

## Settings Persistence

- Uses `user_settings` table in Supabase (per-user: theme, landing_page, compact_mode, quick_actions)
- Also uses flat `settings` table for app-wide key-value settings
- Gracefully handles missing tables (no crashes, no error toasts)
- SQL migration: `create_user_settings_table.sql` (must be run in Supabase SQL Editor)

## Pending Setup

- Run `create_user_settings_table.sql` in Supabase SQL Editor
- Create `avatars` bucket in Supabase Storage (public bucket named `avatars`)

## Development

Workflow: `Start application` — runs `npx tsx watch server/minimal-server.ts`

## Environment Variables

- `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` — Supabase connection
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — Client-side Supabase
- `JWT_SECRET` — Auth token signing
- `MONGO_URI` — Optional MongoDB (skipped if absent)
