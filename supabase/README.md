# Supabase Backend

This repository now uses Supabase for authentication, authorization, and user profile storage. Supabase owns the canonical record for who can access the FabZClean apps, and the Node/React stack consumes Supabase tokens to authorize requests.

## Getting Started

1. **Install the Supabase CLI**

   ```bash
   brew install supabase/tap/supabase
   # or see https://supabase.com/docs/guides/cli for other platforms
   ```

2. **Initialize the project (one-time)**

   ```bash
   supabase init
   ```

   The CLI will create a local `.supabase` folder that can be ignored.

3. **Configure environment variables**

   Copy `env.example` to `.env` (or merge into your existing environment files) and fill in:

   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_JWT_SECRET`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

   The backend uses the service role key to validate tokens and load profile metadata, while the frontend relies on the anon key.

4. **Run migrations locally**

   ```bash
   supabase db reset --db-url "$SUPABASE_URL"
   # or to apply without wiping data:
   supabase db push --db-url "$SUPABASE_URL"
   ```

   The migrations in `supabase/migrations` define roles, capabilities, and the `profiles` table that is synced from `auth.users`.

5. **Start Supabase locally (optional)**

   ```bash
   supabase start
   ```

   This spins up a local Postgres, GoTrue auth, and storage stack so you can develop without touching production.

## Roles

The platform defines four first-class roles:

| Role                | Purpose                                                                 |
| ------------------- | ------------------------------------------------------------------------ |
| `admin`             | Full system access, can manage everything                                |
| `employee`          | Handles day-to-day operations (orders, customers)                        |
| `franchise_manager` | Oversees franchise performance, analytics, and high-level order insights |
| `factory_manager`   | Manages production, inventory, and logistics                             |

Capabilities are stored in `role_capabilities` and can be extended from SQL without touching app code.

## Provisioning Admin Users

1. Create a user from the Supabase dashboard (Authentication → Users) or via CLI.
2. Run the following SQL against the project to grant the `admin` role:

   ```sql
   update public.profiles
      set role = 'admin'
    where email = 'you@example.com';
   ```

   The login page accepts any Supabase-authenticated user; their UI and API access are trimmed to the capabilities of the stored role.

## Deploying

Add the following environment variables wherever the backend runs:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_JWT_SECRET`

The frontend build (Vite) requires `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. These should always point to the same Supabase project but keep the service key private.

