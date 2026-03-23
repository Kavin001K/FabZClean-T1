-- FABZCLEAN: Consolidated Supabase Optimization Script 2026
-- Targets: Orders, Customers, Wallet Transactions (Ledger)
-- Purpose: Performance indexing, Data integrity, and Cache synchronization

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. ORDERS TABLE OPTIMIZATIONS
-- ---------------------------------------------------------------------------
-- Efficient lookups for status boards, customer order history, and sorting
CREATE INDEX IF NOT EXISTS idx_orders_created_at_desc ON public.orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status_created_at_desc ON public.orders (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders (payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders (customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders (order_number);

-- Integrity check for payment statuses
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_payment_status_valid_chk') THEN
    ALTER TABLE public.orders 
    ADD CONSTRAINT orders_payment_status_valid_chk 
    CHECK (payment_status IN ('pending', 'paid', 'failed', 'partial', 'credit'));
  END IF;
END
$$;

-- ---------------------------------------------------------------------------
-- 2. WALLET TRANSACTIONS (LEDGER) OPTIMIZATIONS
-- ---------------------------------------------------------------------------
-- Critical for fast scrolling and customer history retrieval
CREATE INDEX IF NOT EXISTS idx_wallet_tx_customer_created_at_desc ON public.wallet_transactions (customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_reference_id ON public.wallet_transactions (reference_id);

-- ---------------------------------------------------------------------------
-- 3. CACHE SYNCHRONIZATION (High Reliability)
-- ---------------------------------------------------------------------------
-- Recompute customer wallet_balance_cache and credit_balance from ledger history
-- Use this after manual adjustments or to fix drift.
CREATE OR REPLACE FUNCTION public.recompute_customer_wallet_cache(p_customer_id text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  WITH latest AS (
    SELECT DISTINCT ON (wt.customer_id)
      wt.customer_id,
      COALESCE(wt.balance_after::numeric, 0) AS wallet_balance_after
    FROM public.wallet_transactions wt
    WHERE p_customer_id IS NULL OR wt.customer_id::text = p_customer_id
    ORDER BY wt.customer_id, wt.created_at DESC
  )
  UPDATE public.customers c
  SET
    wallet_balance_cache = COALESCE(l.wallet_balance_after, 0),
    credit_balance = CASE
      WHEN COALESCE(l.wallet_balance_after, 0) < 0 THEN ABS(l.wallet_balance_after)
      ELSE 0
    END,
    updated_at = NOW()
  FROM latest l
  WHERE c.id = l.customer_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- 4. HOUSEKEEPING (Optional)
-- ---------------------------------------------------------------------------
-- Ensure trgm extension is available for fast autocomplete search (if used)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

COMMIT;

-- Usage: SELECT public.recompute_customer_wallet_cache('CUSTOMER_ID');
-- Usage (All): SELECT public.recompute_customer_wallet_cache(NULL);
