# FabzClean

A laundry management SaaS application built with React + Vite (frontend) and Express + TypeScript (backend).

## Architecture

- **Frontend:** React + TypeScript + Vite, TailwindCSS + shadcn/ui, Framer Motion
- **Backend:** Express.js + TypeScript (server/minimal-server.ts is the entrypoint)
- **Database:** Supabase (PostgreSQL) as primary; schema in `server/schema.ts`
- **Storage:** Supabase + local fallback at `server/uploads/`
- **Routing:** Wouter (client-side)
- **State:** React Query (server state), Context API (auth, settings, theme)

## Project Structure

```
client/src/
  pages/          - Route-level page components
  components/     - Reusable UI components
  contexts/       - Auth, Settings, Query contexts
  lib/            - Utilities, hooks
  index.css       - Global styles + Tailwind
server/
  minimal-server.ts  - Main Express entrypoint
  schema.ts          - Database schema (Drizzle ORM)
  storage.ts         - Storage abstraction layer
  auth-service.ts    - Authentication logic
```

## Active Pages

- `/` — Dashboard
- `/orders` — Order management
- `/customers` — Customer management
- `/create-order` — New order form
- `/services` — Service catalog
- `/print-queue` — Print queue
- `/profile` — User profile + image upload
- `/settings` — App settings
- `/user-management` — User/role management
- `/wallet-management` — Wallet/credits management
- `/analytics` — Analytics dashboard
- `/account-inactive` — Account suspended gate
- `/terms`, `/privacy`, `/refund`, `/cookies` — Legal pages

## Key Features

- Dark/light/system theme with localStorage persistence (key: `fabzclean-theme`)
- Mobile-responsive layout: Sheet drawer sidebar on mobile, bottom nav bar
- Role-based access: admin, employee, customer
- Profile image upload with graceful error handling
- Real-time driver tracking via Supabase realtime
- Analytics with daily cron computation
- Loyalty program engine
- Export to Excel/PDF on customers and orders pages

## Development

Workflow: `Start application` — runs `npx tsx watch server/minimal-server.ts`

## Environment Variables

- `DATABASE_URL` / Supabase credentials (SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY)
- `JWT_SECRET` — Auth token signing
- `MONGO_URI` — Optional MongoDB (skipped if absent)
