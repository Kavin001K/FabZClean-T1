# FabZClean Production Fix Summary

## Problem

When deploying to AWS Amplify (static hosting), the application was failing with:
- 404 errors on `/api/settings/`, `/api/auth/login/`, and other API endpoints
- Error: "Unexpected token '<', '<!DOCTYPE '... is not valid JSON"
- WebSocket connection failures to Supabase realtime

**Root Cause:** AWS Amplify is a static hosting service that only serves the frontend build. The backend Express server was NOT deployed, so all `/api/*` calls returned HTML 404 pages instead of JSON.

## Solution Implemented

### 1. Direct Supabase Authentication (`client/src/lib/supabase-auth.ts`)
Created a new authentication service that:
- Authenticates directly against Supabase `employees` and `auth_employees` tables
- Uses bcryptjs for password verification in the browser
- Generates client-side session tokens
- Automatically activates when no backend API URL is configured

### 2. Updated Auth Context (`client/src/contexts/auth-context.tsx`)
Modified to:
- Detect when running on static hosting (no backend)
- Automatically switch to direct Supabase authentication
- Fall back to backend API when `VITE_API_URL` is configured

### 3. Updated Settings Context (`client/src/contexts/settings-context.tsx`)
Modified to:
- Query settings directly from Supabase when no backend is available
- Provide default settings as fallback
- Prevent 404 errors on settings API calls

### 4. API Client (`client/src/lib/api-client.ts`)
Created a unified API client that:
- Routes requests to backend or Supabase based on configuration
- Supports GET, POST, PUT, DELETE operations
- Maps API endpoints to Supabase tables

### 5. AWS Amplify Configuration (`amplify.yml`)
Created proper build configuration with:
- Security headers (CSP, XSS protection, etc.)
- SPA routing rewrites
- Asset caching

### 6. Database Migration (`supabase/migrations/enable_frontend_auth.sql`)
SQL script to enable frontend authentication by:
- Adding RLS policies for public read access on `employees` table
- Adding RLS policies for `auth_employees` table
- Adding RLS policies for `settings` table

## Files Created/Modified

### New Files:
1. `client/src/lib/supabase-auth.ts` - Direct Supabase auth service
2. `client/src/lib/api-client.ts` - Unified API client
3. `amplify.yml` - AWS Amplify build configuration
4. `client/public/_redirects` - SPA routing redirects
5. `supabase/migrations/enable_frontend_auth.sql` - RLS policies
6. `.env.production.template` - Production environment template
7. `AMPLIFY_DEPLOYMENT_GUIDE.md` - Detailed deployment guide

### Modified Files:
1. `client/src/contexts/auth-context.tsx` - Hybrid auth context
2. `client/src/contexts/settings-context.tsx` - Direct Supabase settings

## Action Required

### Step 1: Run SQL Migration in Supabase

Go to Supabase SQL Editor and run:

```sql
-- Enable public access for employee authentication
DROP POLICY IF EXISTS "Allow public read for authentication" ON employees;
CREATE POLICY "Allow public read for authentication" ON employees
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow public read for authentication" ON auth_employees;
CREATE POLICY "Allow public read for authentication" ON auth_employees
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow public read settings" ON settings;
CREATE POLICY "Allow public read settings" ON settings
  FOR SELECT
  USING (true);
```

### Step 2: Configure Environment Variables in Amplify

In AWS Amplify Console → Environment Variables:

| Variable | Value |
|----------|-------|
| `VITE_SUPABASE_URL` | `https://rxyatfvjjnvjxwyhhhqn.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `NODE_ENV` | `production` |

**Important:** Do NOT set `VITE_API_URL` - this enables direct Supabase mode.

### Step 3: Redeploy

Push the changes to trigger a new Amplify build:

```bash
git add .
git commit -m "Fix: Enable direct Supabase auth for static hosting"
git push
```

### Step 4: Verify

1. Wait for Amplify build to complete
2. Navigate to your Amplify URL
3. Try logging in with employee credentials
4. Check browser console for any errors

## Known Limitations

When running in direct Supabase mode (without backend):
1. Some advanced features may not work (e.g., WhatsApp notifications, PDF document uploads)
2. Password hashes are accessible in browser network tab (bcrypt-protected)
3. Complex backend-only operations will fail

## Recommended Next Steps

For full production security:
1. Deploy the backend to a service like Render.com
2. Set `VITE_API_URL` in Amplify to point to the backend
3. Use Supabase Edge Functions for sensitive operations
4. Migrate to Supabase Auth for user management

---

**Date:** January 5, 2026
