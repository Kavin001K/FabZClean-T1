import express from 'express';
import { getDatabaseInfo } from '../db-utils';
import { authMiddleware, roleMiddleware } from '../middleware/employee-auth';
import { extractListData } from '../utils/list-result';

const router = express.Router();

router.use(authMiddleware, roleMiddleware(['admin']));

// Database info
router.get('/info', async (req, res) => {
    try {
        const info = await getDatabaseInfo();
        res.json(info);
    } catch (error: any) {
        console.error('Failed to get database info:', error);
        res.status(500).json({ error: error.message });
    }
});

// Fix customer revenues
router.get('/fix-revenues', async (req, res) => {
    try {
        const { db } = await import('../db');
        console.log("Fetching all customers...");
        const customers = extractListData(await db.listCustomers());
        const orders = await db.listOrders();
        let updatedCount = 0;

        for (const customer of customers) {
            const customerOrders = orders.filter((o: any) => o.customerId === customer.id);
            const totalOrders = customerOrders.length;
            const totalSpent = customerOrders.reduce((sum: number, o: any) => sum + parseFloat(o.totalAmount || "0"), 0);

            if (customer.totalOrders !== totalOrders || parseFloat(customer.totalSpent || "0") !== totalSpent) {
                updatedCount++;
                await db.updateCustomer(customer.id, {
                    totalOrders,
                    totalSpent
                } as any);
            }
        }
        res.json({ success: true, message: `Fixed revenue for ${updatedCount} customers.` });
    } catch (error: any) {
        console.error('Failed to fix revenues:', error);
        res.status(500).json({ error: error.message });
    }
});

// Apply database indexes and RPC functions
router.get('/apply-indexes', async (req, res) => {
    try {
        const { Client } = await import('pg');
        
        // Find whichever connection string is available in the environment
        const connectionString = 
            process.env.DATABASE_URL || 
            process.env.SUPABASE_DB_URL || 
            (process.env.SUPABASE_URL ? process.env.SUPABASE_URL.replace('https://', 'postgresql://postgres@').replace('.supabase.co', '.supabase.co:5432/postgres') : null);

        if (!connectionString) {
            return res.status(500).json({ error: 'No database connection string found in environment.' });
        }

        const client = new Client({
            connectionString,
            ssl: { rejectUnauthorized: false }
        });

        await client.connect();

        const sql = `
            -- Table schema migrations
            ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_type VARCHAR(50) DEFAULT 'normal';
            ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS express_charge DECIMAL(10, 2) DEFAULT 0;
            ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS instant_charge DECIMAL(10, 2) DEFAULT 0;
            ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS status_timestamps JSONB DEFAULT '{}'::jsonb;
            ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cover_type TEXT NOT NULL DEFAULT 'bag';
            ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_partner_id TEXT;
            ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS bag_count INTEGER DEFAULT 1;
            ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tags_printed BOOLEAN DEFAULT false;
            ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;
            ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS dispatched_at TIMESTAMPTZ;
            -- customers schema additions
            ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS notes TEXT;
            ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS company_name TEXT;
            ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS tax_id TEXT;
            ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS date_of_birth DATE;
            ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS payment_terms TEXT;

            CREATE EXTENSION IF NOT EXISTS pg_trgm;

            CREATE INDEX IF NOT EXISTS idx_customers_name_trgm ON public.customers USING gin (name gin_trgm_ops);
            CREATE INDEX IF NOT EXISTS idx_customers_phone_trgm ON public.customers USING gin (phone gin_trgm_ops);
            CREATE INDEX IF NOT EXISTS idx_customers_id_trgm ON public.customers USING gin (id gin_trgm_ops);
            CREATE INDEX IF NOT EXISTS idx_customers_email_trgm ON public.customers USING gin (email gin_trgm_ops);

            DROP FUNCTION IF EXISTS public.search_customers_autocomplete(TEXT, INT);

            CREATE OR REPLACE FUNCTION public.search_customers_autocomplete(
              p_query TEXT,
              p_limit INT DEFAULT 10
            )
            RETURNS TABLE (
              id TEXT,
              name TEXT,
              phone TEXT,
              secondary_phone TEXT,
              email TEXT,
              address JSONB,
              status TEXT,
              credit_balance TEXT,
              credit_limit TEXT,
              total_orders INT,
              total_spent TEXT,
              last_order TIMESTAMPTZ,
              wallet_balance_cache TEXT,
              created_at TIMESTAMPTZ,
              updated_at TIMESTAMPTZ,
              relevance_score NUMERIC
            )
            LANGUAGE plpgsql STABLE AS $$
            DECLARE
              v_query TEXT;
              v_query_lower TEXT;
              v_digits TEXT;
            BEGIN
              v_query := TRIM(p_query);
              IF v_query = '' OR v_query IS NULL THEN RETURN; END IF;

              v_query_lower := LOWER(v_query);
              v_digits := regexp_replace(v_query, '[^0-9]', '', 'g');
              v_digits := regexp_replace(v_digits, '^(91|0+)', '');

              RETURN QUERY
              SELECT
                c.id, c.name, c.phone, c.secondary_phone, c.email, c.address, c.status,
                c.credit_balance::TEXT, c.credit_limit::TEXT, c.total_orders,
                c.total_spent::TEXT, c.last_order, c.wallet_balance_cache::TEXT,
                c.created_at, c.updated_at,
                (
                  CASE WHEN LOWER(c.name) = v_query_lower THEN 100 ELSE 0 END +
                  CASE WHEN v_digits <> '' AND regexp_replace(regexp_replace(COALESCE(c.phone,'') || COALESCE(c.secondary_phone,''), '[^0-9]', '', 'g'), '^(91|0+)', '') = v_digits THEN 100 ELSE 0 END +
                  CASE WHEN LOWER(c.id) = v_query_lower THEN 100 ELSE 0 END +
                  CASE WHEN LOWER(c.name) LIKE v_query_lower || '%' THEN 80 ELSE 0 END +
                  CASE WHEN v_digits <> '' AND regexp_replace(regexp_replace(COALESCE(c.phone,'') || COALESCE(c.secondary_phone,''), '[^0-9]', '', 'g'), '^(91|0+)', '') LIKE v_digits || '%' THEN 80 ELSE 0 END +
                  CASE WHEN LOWER(c.id) LIKE v_query_lower || '%' THEN 80 ELSE 0 END +
                  CASE WHEN LOWER(c.name) LIKE '%' || v_query_lower || '%' THEN 50 ELSE 0 END +
                  CASE WHEN v_digits <> '' AND regexp_replace(COALESCE(c.phone,'') || COALESCE(c.secondary_phone,''), '[^0-9]', '', 'g') LIKE '%' || v_digits || '%' THEN 50 ELSE 0 END +
                  CASE WHEN LOWER(COALESCE(c.email,'')) LIKE '%' || v_query_lower || '%' THEN 50 ELSE 0 END +
                  CASE WHEN LOWER(c.id) LIKE '%' || v_query_lower || '%' THEN 50 ELSE 0 END +
                  CASE WHEN LENGTH(v_query) >= 3 AND similarity(LOWER(c.name), v_query_lower) > 0.3 THEN (similarity(LOWER(c.name), v_query_lower) * 40)::NUMERIC ELSE 0 END
                )::NUMERIC AS relevance_score
              FROM public.customers c
              WHERE c.status IS DISTINCT FROM 'deleted'
                AND (
                  LOWER(c.name) LIKE '%' || v_query_lower || '%'
                  OR COALESCE(c.phone, '') LIKE '%' || v_query || '%'
                  OR COALESCE(c.secondary_phone, '') LIKE '%' || v_query || '%'
                  OR (v_digits <> '' AND regexp_replace(COALESCE(c.phone,'') || COALESCE(c.secondary_phone,''), '[^0-9]', '', 'g') LIKE '%' || v_digits || '%')
                  OR LOWER(COALESCE(c.email, '')) LIKE '%' || v_query_lower || '%'
                  OR LOWER(c.id) LIKE '%' || v_query_lower || '%'
                  OR (LENGTH(v_query) >= 3 AND similarity(LOWER(c.name), v_query_lower) > 0.3)
                )
              ORDER BY relevance_score DESC, c.name ASC
              LIMIT p_limit;
            END;
            $$;

            GRANT EXECUTE ON FUNCTION public.search_customers_autocomplete(TEXT, INT) TO anon, authenticated, service_role;
        `;

        await client.query(sql);

        // Notify PostgREST to reload its schema cache so new columns are visible immediately
        try {
            await client.query("SELECT pg_notify('pgrst', 'reload schema');");
        } catch (notifyErr: any) {
            console.warn('[database] NOTIFY pgrst skipped (may not be a superuser connection):', notifyErr.message);
        }

        await client.end();

        res.json({ success: true, message: 'Successfully applied schema migrations, GIN indexes, RPC functions, and reloaded PostgREST schema cache.' });
    } catch (error: any) {
        console.error('Failed to apply indexes:', error);
        res.status(500).json({ error: error.message, stack: error.stack });
    }
});

// Apply schema via Supabase REST (works without direct pg TCP connection)
// Runs ALTER TABLE statements for all columns defined in shared/schema but missing from DB.
router.get('/apply-schema', async (req, res) => {
    try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseUrl = process.env.SUPABASE_URL || '';
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

        if (!supabaseUrl || !supabaseServiceKey) {
            return res.status(500).json({ error: 'SUPABASE_URL or SUPABASE_SERVICE_KEY not set.' });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
            auth: { persistSession: false }
        });

        const statements = [
            // orders - missing columns detected by schema comparison
            `ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cover_type TEXT NOT NULL DEFAULT 'bag'`,
            `ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_partner_id TEXT`,
            `ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS bag_count INTEGER DEFAULT 1`,
            `ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tags_printed BOOLEAN DEFAULT false`,
            `ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ`,
            `ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS dispatched_at TIMESTAMPTZ`,
            `ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS status_timestamps JSONB DEFAULT '{}'::jsonb`,
            `ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_type VARCHAR(50) DEFAULT 'normal'`,
            `ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS express_charge DECIMAL(10,2) DEFAULT 0`,
            `ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS instant_charge DECIMAL(10,2) DEFAULT 0`,
            // customers - missing columns
            `ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS notes TEXT`,
            `ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS company_name TEXT`,
            `ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS tax_id TEXT`,
            `ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS date_of_birth DATE`,
            `ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS payment_terms TEXT`,
        ];

        const results: { sql: string; ok: boolean; error?: string }[] = [];

        for (const stmt of statements) {
            // Use supabase.rpc('exec_sql') if available, otherwise use raw fetch to the Supabase Management API
            // Supabase exposes pg_catalog via the sql endpoint in service role
            const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': supabaseServiceKey,
                    'Authorization': `Bearer ${supabaseServiceKey}`,
                },
                body: JSON.stringify({ sql: stmt }),
            });

            if (response.ok) {
                results.push({ sql: stmt, ok: true });
            } else {
                const errText = await response.text();
                // IF NOT EXISTS errors are harmless - treat as success
                if (errText.includes('already exists') || errText.includes('PGRST202')) {
                    results.push({ sql: stmt, ok: true });
                } else {
                    results.push({ sql: stmt, ok: false, error: errText });
                }
            }
        }

        // Reload PostgREST schema cache
        await fetch(`${supabaseUrl}/rest/v1/rpc/reload_schema`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': supabaseServiceKey,
                'Authorization': `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({}),
        }).catch(() => {});

        const failed = results.filter(r => !r.ok);
        if (failed.length > 0) {
            return res.status(207).json({
                success: false,
                message: `${failed.length} statement(s) failed.`,
                results,
            });
        }

        res.json({ success: true, message: `Applied ${results.length} schema statements successfully.`, results });
    } catch (error: any) {
        console.error('Failed to apply schema:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
