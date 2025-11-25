# Supabase Setup Guide

This project supports switching between local SQLite storage and Supabase for the backend database.

## Prerequisites

1.  A Supabase project (create one at [supabase.com](https://supabase.com)).
2.  Node.js installed.

## Configuration

1.  **Environment Variables**:
    Create or update your `.env` file (or `.env.production`) with the following variables:

    ```env
    # Enable Supabase storage
    USE_SUPABASE=true

    # Supabase Credentials
    SUPABASE_URL=your_supabase_project_url
    SUPABASE_SERVICE_KEY=your_supabase_service_role_key
    ```

    > **Note**: Use the `service_role` key, not the `anon` key, as the backend needs full access to the database.

2.  **Database Migration**:
    Run the SQL migration script in your Supabase SQL Editor to create the necessary tables.

    The migration file is located at: `supabase/migrations/schema.sql`

    Copy the content of this file and execute it in the Supabase SQL Editor.

## Switching Back to SQLite

To switch back to the local SQLite database, simply set `USE_SUPABASE=false` or remove the variable from your environment file.

## Vercel Deployment

When deploying to Vercel:

1.  Add the environment variables (`USE_SUPABASE`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`) in the Vercel Project Settings.
2.  Ensure `VITE_WS_URL` is NOT set if you want to use the default WebSocket connection logic (or set it if you have a specific WebSocket server).
3.  The project is configured with `vercel.json` to handle API routing via `api/index.ts`.

## Features Supported

The Supabase integration currently supports:
- Users
- Products
- Customers
- Orders
- Deliveries
- Drivers
- Services
- Employees
- Barcodes
- Shipments
- POS Transactions
- Dashboard Metrics

## Limitations

- Real-time subscriptions are currently handled via the custom WebSocket server. Supabase Realtime is not yet fully integrated into the client-side subscription logic (it uses the existing `SocketContext`).
- Complex queries for analytics might be slower than optimized SQL queries if not indexed properly (indexes are included in the schema).
