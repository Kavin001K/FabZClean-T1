# FabZClean - AWS Amplify Production Deployment Guide

## Overview

This guide covers deploying FabZClean to AWS Amplify as a static website with direct Supabase integration.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        AWS Amplify                          │
│                    (Static Hosting)                         │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                 React Frontend                       │   │
│  │              (Vite Build Output)                     │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS/WSS
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       Supabase                              │
│                                                             │
│  ┌───────────────┐  ┌───────────────┐  ┌──────────────┐   │
│  │   PostgreSQL  │  │   Realtime    │  │   Storage    │   │
│  │   Database    │  │   (WebSocket) │  │   (Files)    │   │
│  └───────────────┘  └───────────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Step 1: Configure Supabase

### 1.1 Run Authentication Migration

Execute this SQL in your Supabase SQL Editor to enable frontend authentication:

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

### 1.2 Verify Realtime is Enabled

1. Go to Supabase Dashboard → Database → Replication
2. Enable realtime for tables you need live updates: `orders`, `customers`, `drivers`

## Step 2: Configure AWS Amplify

### 2.1 Connect Repository

1. Go to AWS Amplify Console
2. Click "New app" → "Host web app"
3. Connect your GitHub repository
4. Select the branch to deploy (e.g., `main`)

### 2.2 Configure Build Settings

Amplify should auto-detect the `amplify.yml` file. If not, use these settings:

- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Node.js version**: 18 or higher

### 2.3 Set Environment Variables

In Amplify Console → App settings → Environment variables:

| Variable | Value | Description |
|----------|-------|-------------|
| `VITE_SUPABASE_URL` | `https://rxyatfvjjnvjxwyhhhqn.supabase.co` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGci...` | Your Supabase anonymous key |
| `NODE_ENV` | `production` | Environment mode |

**Important:** Do NOT set `VITE_API_URL` to enable direct Supabase mode.

### 2.4 Configure Rewrites (SPA Routing)

In Amplify Console → App settings → Rewrites and redirects:

Add this rule if not auto-configured:
- **Source**: `</^[^.]+$|\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|eot|map|json|webp|webm|mp4)$)([^.]+$)/>`
- **Target**: `/index.html`
- **Type**: `200 (Rewrite)`

## Step 3: Deploy

1. Push your code to the connected branch
2. Amplify will automatically build and deploy
3. Access your app at the Amplify URL (e.g., `main.d1234abcd.amplifyapp.com`)

## Step 4: Post-Deployment Verification

### 4.1 Test Login

1. Navigate to `/login`
2. Enter employee credentials
3. Verify successful authentication

### 4.2 Test Realtime

1. Open two browser tabs with the app
2. Make a change (e.g., update an order)
3. Verify the change appears in both tabs

### 4.3 Check Console for Errors

Open browser DevTools and look for:
- ❌ 404 errors on `/api/*` endpoints (should NOT occur now)
- ❌ WebSocket connection failures (check Supabase realtime config)
- ✅ Supabase connection success messages

## Troubleshooting

### Error: "Unexpected token '<'" on login

**Cause:** The app is trying to call `/api/auth/login` which returns HTML 404.

**Fix:** Ensure these conditions are met:
1. `VITE_API_URL` is NOT set in Amplify environment variables
2. The build was done with the updated `auth-context.tsx` and `supabase-auth.ts`

### Error: 401 Unauthorized from Supabase

**Cause:** RLS policies are blocking the query.

**Fix:** Run the SQL migration in Step 1.1 to enable public read access.

### Error: WebSocket connection failed

**Cause:** Supabase realtime might not be enabled or there's a CSP issue.

**Fix:**
1. Check Supabase Dashboard → Database → Replication
2. Verify Content-Security-Policy allows WebSocket connections to Supabase

### Error: Settings not loading

**Cause:** The `settings` table RLS policy is blocking reads.

**Fix:** The app now uses default settings if the database is unavailable. Run the SQL migration to enable reading from the database.

## Security Considerations

### Current Setup

This deployment uses direct Supabase access from the browser, which means:

1. **Password hashes are visible** in the network tab when querying employees table
2. **All CRUD operations** use the anon key with RLS policies

### Recommended Hardening

For production with sensitive data:

1. **Use Supabase Edge Functions** for authentication instead of exposing password hashes
2. **Implement proper RLS policies** that don't expose password columns
3. **Use Supabase Auth** for user authentication (recommended)
4. **Deploy a backend server** for sensitive operations

### Create a Supabase Edge Function for Auth (Optional)

```typescript
// supabase/functions/login/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as bcrypt from 'https://deno.land/x/bcrypt@v0.4.1/mod.ts'

serve(async (req) => {
  const { username, password } = await req.json()
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
  
  const { data: employee } = await supabase
    .from('employees')
    .select('id, employee_id, password, role, franchise_id, first_name, last_name, email')
    .or(`employee_id.eq."${username}",email.eq."${username}"`)
    .single()
  
  if (!employee || !(await bcrypt.compare(password, employee.password))) {
    return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401 })
  }
  
  // Generate JWT and return
  // ...
})
```

## Maintenance

### Updating the App

1. Push changes to the connected branch
2. Amplify automatically rebuilds and deploys
3. New version is live in ~2-3 minutes

### Monitoring

1. Set up AWS CloudWatch for access logs
2. Monitor Supabase Dashboard for database metrics
3. Check browser console for JavaScript errors

---

**Last Updated:** January 2026
