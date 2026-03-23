-- Supabase performance + reliability tuning for orders / ledger workloads
-- Safe to run multiple times.

BEGIN;

-- ---------------------------------------------------------------------------
-- ORDERS: common filters/sorts for status boards and order lookup
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_orders_created_at_desc
  ON public.orders (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_status_created_at_desc
  ON public.orders (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_payment_status_created_at_desc
  ON public.orders (payment_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_customer_created_at_desc
  ON public.orders (customer_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_order_number
  ON public.orders (order_number);

-- ---------------------------------------------------------------------------
-- DOCUMENTS: invoice lookup by order number / filename
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_documents_order_number_created_at_desc
  ON public.documents (order_number, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_documents_filename
  ON public.documents (filename);

CREATE INDEX IF NOT EXISTS idx_documents_type_status_created_at_desc
  ON public.documents (type, status, created_at DESC);

-- ---------------------------------------------------------------------------
-- WALLET LEDGER: supports customer history and fast recent-entry lookup
-- Handles both old/new wallet_transactions schemas.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'wallet_transactions'
      AND column_name = 'entry_no'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_wallet_tx_customer_entry_no_desc ON public.wallet_transactions (customer_id, entry_no DESC)';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'wallet_transactions'
      AND column_name = 'created_at'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_wallet_tx_customer_created_at_desc ON public.wallet_transactions (customer_id, created_at DESC)';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'wallet_transactions'
      AND column_name = 'reference_id'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_wallet_tx_reference_id ON public.wallet_transactions (reference_id)';
  END IF;
END
$$;

-- ---------------------------------------------------------------------------
-- Data integrity guardrails
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'orders_payment_status_valid_chk'
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_payment_status_valid_chk
      CHECK (payment_status IN ('pending', 'paid', 'failed', 'partial', 'credit'));
  END IF;
END
$$;

-- ---------------------------------------------------------------------------
-- Cache sync helper: rebuild customers.credit_balance / wallet_balance_cache
-- from latest wallet ledger entries.
-- ---------------------------------------------------------------------------
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

COMMIT;

-- Optional one-time backfill after deploying:
-- SELECT public.recompute_customer_wallet_cache(NULL);
