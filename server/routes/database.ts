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
            (process.env.SUPABASE_URL ? process.env.SUPABASE_URL.replace('https://', 'postgresql://postgres:').replace('.supabase.co', '.supabase.co:5432/postgres') : null);

        if (!connectionString) {
            return res.status(500).json({ error: 'No database connection string found in environment.' });
        }

        const client = new Client({
            connectionString,
            ssl: { rejectUnauthorized: false }
        });

        await client.connect();

        const sql = `
            CREATE EXTENSION IF NOT EXISTS pg_trgm;

            CREATE INDEX IF NOT EXISTS idx_customers_name_trgm ON public.customers USING gin (name gin_trgm_ops);
            CREATE INDEX IF NOT EXISTS idx_customers_phone_trgm ON public.customers USING gin (phone gin_trgm_ops);
            CREATE INDEX IF NOT EXISTS idx_customers_id_trgm ON public.customers USING gin (id gin_trgm_ops);
            CREATE INDEX IF NOT EXISTS idx_customers_email_trgm ON public.customers USING gin (email gin_trgm_ops);

            CREATE OR REPLACE FUNCTION public.search_customers_autocomplete(
              p_query TEXT,
              p_limit INT DEFAULT 10
            )
            RETURNS TABLE (
              id TEXT,
              name TEXT,
              phone TEXT,
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
                c.id, c.name, c.phone, c.email, c.address, c.status,
                c.credit_balance::TEXT, c.credit_limit::TEXT, c.total_orders,
                c.total_spent::TEXT, c.last_order, c.wallet_balance_cache::TEXT,
                c.created_at, c.updated_at,
                (
                  CASE WHEN LOWER(c.name) = v_query_lower THEN 100 ELSE 0 END +
                  CASE WHEN v_digits <> '' AND regexp_replace(regexp_replace(COALESCE(c.phone,''), '[^0-9]', '', 'g'), '^(91|0+)', '') = v_digits THEN 100 ELSE 0 END +
                  CASE WHEN LOWER(c.id) = v_query_lower THEN 100 ELSE 0 END +
                  CASE WHEN LOWER(c.name) LIKE v_query_lower || '%' THEN 80 ELSE 0 END +
                  CASE WHEN v_digits <> '' AND regexp_replace(regexp_replace(COALESCE(c.phone,''), '[^0-9]', '', 'g'), '^(91|0+)', '') LIKE v_digits || '%' THEN 80 ELSE 0 END +
                  CASE WHEN LOWER(c.id) LIKE v_query_lower || '%' THEN 80 ELSE 0 END +
                  CASE WHEN LOWER(c.name) LIKE '%' || v_query_lower || '%' THEN 50 ELSE 0 END +
                  CASE WHEN v_digits <> '' AND regexp_replace(COALESCE(c.phone,''), '[^0-9]', '', 'g') LIKE '%' || v_digits || '%' THEN 50 ELSE 0 END +
                  CASE WHEN LOWER(COALESCE(c.email,'')) LIKE '%' || v_query_lower || '%' THEN 50 ELSE 0 END +
                  CASE WHEN LOWER(c.id) LIKE '%' || v_query_lower || '%' THEN 50 ELSE 0 END +
                  CASE WHEN LENGTH(v_query) >= 3 AND similarity(LOWER(c.name), v_query_lower) > 0.3 THEN (similarity(LOWER(c.name), v_query_lower) * 40)::NUMERIC ELSE 0 END
                )::NUMERIC AS relevance_score
              FROM public.customers c
              WHERE c.status IS DISTINCT FROM 'deleted'
                AND (
                  LOWER(c.name) LIKE '%' || v_query_lower || '%'
                  OR COALESCE(c.phone, '') LIKE '%' || v_query || '%'
                  OR (v_digits <> '' AND regexp_replace(COALESCE(c.phone,''), '[^0-9]', '', 'g') LIKE '%' || v_digits || '%')
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
        await client.end();

        res.json({ success: true, message: 'Successfully applied GIN pg_trgm indexes and optimized autocomplete RPC!' });
    } catch (error: any) {
        console.error('Failed to apply indexes:', error);
        res.status(500).json({ error: error.message, stack: error.stack });
    }
});

export default router;
