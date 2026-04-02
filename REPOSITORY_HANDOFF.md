# FabZClean-T1 ERP Handoff

Last updated: 2026-04-02  
Repository: `FabZClean-T1`  
Current role: internal ERP + operational system of record for Fab Clean

## 1. What this repo is

This repo is the main internal ERP.

It is the canonical operational system for:
- billing
- customers
- orders
- wallet and credit
- employees and access
- delivery and transit
- documents and invoices
- WhatsApp operational messaging

This document is written so the next engineer or AI can understand the system even without access to the public website repo.

## 2. Core rule of this repo

This repo is production-sensitive.

The general rule is:
- do not rewrite core ERP logic casually
- prefer additive schema changes
- prefer route-level or UI-level additions over changing established order and billing behavior

This matters because the website integration now depends on this database, but the ERP must keep working on its own.

## 3. High-level architecture

Frontend:
- `client/`
- React + Vite + Wouter + React Query

Backend:
- `server/`
- Express + TypeScript

Shared model:
- `shared/schema.ts`

Database runtime:
- primary active backend uses `SupabaseStorage`
- `server/db.ts` exports a `SupabaseStorage` instance
- a legacy `SQLiteStorage` implementation still exists for compatibility and older code paths, but production intent is Supabase-backed

Build scripts:
- client build: `npm run build:client`
- server build: `npm run build:server`
- full typecheck: `npm run check`

Important reality:
- client and server production builds can pass even while `npm run check` fails because the repo has older unrelated type issues outside the customer-profile changes

## 4. Route surface

Main route registration:
- `server/routes/index.ts`

Major route groups:
- `/api/orders`
- `/api/customers`
- `/api/products`
- `/api/services`
- `/api/employees`
- `/api/wallet`
- `/api/credits`
- `/api/dashboard`
- `/api/accounting`
- `/api/settings`
- `/api/analytics`
- `/api/reports`
- `/api/whatsapp`
- `/api/public`

Public-facing ERP routes also exist here:
- public order tracking
- public invoice access

That means this repo is not only staff-facing. It already exposes some public operational endpoints.

## 5. Current data ownership

Canonical operational tables include:
- `customers`
- `orders`
- `wallet_transactions`
- `credit_ledger`
- `employees`
- `documents`

The public website and customer portal depend on this ERP database.

That means:
- ERP remains the source of truth for customers and orders
- website features should not fork separate business records unless explicitly additive

## 6. Current customer system

Customer schema is defined in:
- `shared/schema.ts`

Important customer fields:
- `id`
- `name`
- `email`
- `phone`
- `address`
- `totalOrders`
- `totalSpent`
- `creditLimit`
- `walletBalanceCache`
- `creditBalance`
- `status`
- `lastOrder`
- `notes`
- `companyName`
- `taxId`
- `dateOfBirth`
- `paymentTerms`
- `customerRating` (new additive field)

Important mapping layer:
- `server/SupabaseStorage.ts`
- `mapDates()` converts DB snake_case to app camelCase
- `toSnakeCase()` converts app camelCase to DB snake_case

## 7. Recent customer-profile enhancement added here

A precise customer-profile enhancement was added in this repo and kept isolated to the customer details flow.

### What was added

1. Additive customer rating support
- new shared field:
  - `customerRating`
- maps to database column:
  - `customer_rating`

2. New customer profile details API
- route:
  - `GET /api/customers/:id/profile`
- implemented in:
  - `server/routes/customers.ts`

3. Customer modal now shows:
- real recent order history
- order-wise ratings
- order-wise written feedback
- consolidated customer rating
- feedback sentiment/status summary
- feedback history list

4. SQL migration added for realtime customer rating sync
- file:
  - `supabase/customer_rating_sync.sql`

### What was intentionally not changed

- no destructive customer schema rewrite
- no rewrite of core order creation logic
- no wallet logic rewrite
- no billing flow rewrite
- no unrelated ERP page redesign

## 8. Customer rating logic

The customer rating shown in the ERP profile is not a naive raw average only.

It uses a smoothed rating formula so a customer with one extreme review does not distort the card too aggressively.

The implemented logic is:
- collect the customer’s feedback ratings
- compute the customer average
- compute the global review average
- apply Bayesian-style smoothing using a prior weight of `5`

Formula:

`smoothed = ((customer_avg * customer_review_count) + (global_avg * 5)) / (customer_review_count + 5)`

Why this was chosen:
- protects against unstable ratings with very low review counts
- remains simple enough to reason about operationally
- is additive and safe for ERP display use

The profile endpoint also returns:
- `rawAverageRating`
- `reviewCount`
- positive / neutral / negative counts

So both operational summary and raw context are available.

## 9. Realtime customer rating sync

Persistent rating sync is handled by SQL, not by fragile frontend-only logic.

Migration file:
- `supabase/customer_rating_sync.sql`

What it does:
- adds `public.customers.customer_rating`
- adds helper functions to resolve the owning customer for an order
- calculates customer rating from `reviews_table` and fallback `orders.rating`
- refreshes `customer_rating` after inserts/updates/deletes on:
  - `reviews_table`
  - `orders` rating-related changes
- backfills existing customers

This keeps the rating field updated in near real time at the database level.

Important:
- this SQL still needs to be run in the Supabase SQL editor if not already applied

## 10. Customer profile endpoint behavior

`GET /api/customers/:id/profile` returns:
- serialized customer object
- consolidated customer rating
- raw average rating
- review count
- positive / neutral / negative review counts
- recent orders
- feedback history

Data sources used:
- `customers`
- `orders`
- `reviews_table`

Matching rules:
- match orders by `customer_id`
- fallback matching by normalized phone if needed

Feedback sources:
- first use `reviews_table`
- fallback to `orders.rating` / `orders.feedback` if there is no corresponding review row

This makes the profile resilient even if some historical orders were rated before the newer review table workflow was used.

## 11. Frontend customer page behavior

Customer page:
- `client/src/pages/customers.tsx`

Customer modal:
- `client/src/components/customers/customer-dialogs.tsx`

Current behavior:
- the customer list page still loads paginated customers normally
- when opening a customer profile modal, the UI now fetches detailed profile data from:
  - `customersApi.getProfileDetails(id)`
- this keeps the heavy feedback/order aggregation out of the main customer list response

Why this is safe:
- no change to list page payload size
- no global customer list performance regression
- detailed aggregation only happens for the selected customer

## 12. Important files to read first

If you are onboarding into this ERP repo, read these first:

1. `shared/schema.ts`
2. `server/db.ts`
3. `server/SupabaseStorage.ts`
4. `server/routes/index.ts`
5. `server/routes/orders.ts`
6. `server/routes/customers.ts`
7. `client/src/pages/customers.tsx`
8. `client/src/components/customers/customer-dialogs.tsx`
9. `client/src/lib/data-service.ts`
10. `supabase/customer_rating_sync.sql`

## 13. Relationship to the public website

Even if you do not have the website repo, remember this:

- the website depends on this ERP database
- customers and orders here are canonical
- website feedback writes into the unified Supabase review/order feedback model
- public tracking and public feedback rely on ERP order/customer truth

What the website expects from ERP:
- stable `customers`
- stable `orders`
- stable review-related feedback fields
- additive, non-breaking schema evolution

What ERP does not need from the website repo:
- no direct component reuse
- no direct dependency on website React code

Shared dependency is the database, not shared UI code.

## 14. Current review / feedback data model relevant to ERP

Important review-related structures now present in Supabase:
- `orders.rating`
- `orders.feedback`
- `orders.feedback_date`
- `orders.feedback_time`
- `orders.feedback_status`
- `orders.ai_sentiment`
- `orders.ai_score`
- `reviews_table`
- `top_reviews_table`
- `best_reviews_table`

In ERP customer profile usage:
- order history shows order-wise rating/feedback
- feedback history shows submitted review records
- customer rating card shows consolidated result

## 15. Validation status at handoff

For the customer-profile enhancement work:
- `npm run build:client` passed
- `npm run build:server` passed

`npm run check` currently fails, but not because of this customer-profile enhancement.

The remaining typecheck failures are pre-existing or unrelated, including areas like:
- `client/src/hooks/use-customer-kpis.tsx`
- `client/src/hooks/use-theme.tsx`
- analytics engine
- dashboard/accounting typing
- PDF route typing
- SQLite fallback interface mismatch

Do not assume those errors were introduced by the customer profile work.

## 16. Safe extension rules for future work

If you touch this repo later, prefer these rules:

- keep customer/profile changes additive
- do not rewrite `orders` logic unless absolutely necessary
- do not couple list endpoints to expensive analytics unless intentionally optimized
- compute heavy customer analytics in dedicated detail endpoints or SQL helpers
- keep website-facing schema changes backward compatible for ERP
- treat `customers` and `orders` as canonical master data

For customer profile specifically:
- if adding more feedback analytics, extend `GET /api/customers/:id/profile`
- avoid bloating `GET /api/customers`
- prefer database-side sync for values that must stay operationally current

## 17. SQL files worth knowing

Important SQL/migration files in this repo:
- `supabase/unified_customer_website_access.sql`
  unified website access layer and review model
- `supabase/review_submission_fix.sql`
  review ranking / flag fixups
- `supabase/customer_rating_sync.sql`
  ERP customer rating sync added for profile display

If you only care about the new ERP profile rating feature:
- `supabase/customer_rating_sync.sql` is the key file

## 18. Operational summary

If you only remember five things, remember these:

1. This repo is the operational source of truth.
2. Customer profile modal now uses a dedicated aggregated detail endpoint.
3. Customer rating is additive and statistically smoothed, not a naive raw number.
4. `customer_rating` is meant to be kept in sync by SQL triggers/functions.
5. The website depends on this ERP database, so schema changes here must stay backward compatible.
