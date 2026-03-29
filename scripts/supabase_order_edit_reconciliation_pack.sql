-- Supabase SQL Pack: Order Edit Performance + Financial Reconciliation
-- Created: 2026-03-29
-- Safe to run multiple times (idempotent where applicable).

BEGIN;

-- -----------------------------------------------------------------------------
-- 0) Preflight checks
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.orders') IS NULL THEN
    RAISE EXCEPTION 'public.orders table not found';
  END IF;

  IF to_regclass('public.customers') IS NULL THEN
    RAISE EXCEPTION 'public.customers table not found';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'order_number'
  ) OR NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'total_amount'
  ) OR NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'advance_paid'
  ) OR NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'wallet_used'
  ) OR NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'credit_used'
  ) OR NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'payment_status'
  ) OR NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'is_credit_order'
  ) THEN
    RAISE EXCEPTION 'Required columns missing on public.orders. Run latest wallet/order migrations first.';
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 1) Performance indexes for order screens and reconciliation queries
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_orders_customer_updated_at
  ON public.orders (customer_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_status_updated_at
  ON public.orders (status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_payment_status_updated_at
  ON public.orders (payment_status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_created_at_desc
  ON public.orders (created_at DESC);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'orders'
      AND column_name = 'credit_used'
  ) THEN
    EXECUTE '
      CREATE INDEX IF NOT EXISTS idx_orders_credit_used_positive
      ON public.orders (customer_id, created_at DESC)
      WHERE coalesce(credit_used, 0) > 0
    ';
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 2) Create/refresh a diagnostics view for mismatch auditing
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.order_credit_reconciliation_issues AS
WITH normalized AS (
  SELECT
    o.id,
    o.order_number,
    o.customer_id,
    o.status,
    o.payment_status,
    coalesce(o.total_amount, 0)::numeric(10,2) AS total_amount,
    coalesce(o.advance_paid, 0)::numeric(10,2) AS advance_paid,
    coalesce(o.wallet_used, 0)::numeric(10,2) AS wallet_used,
    coalesce(o.credit_used, 0)::numeric(10,2) AS credit_used,
    greatest(coalesce(o.total_amount, 0) - coalesce(o.advance_paid, 0) - coalesce(o.wallet_used, 0), 0)::numeric(10,2) AS expected_credit_used,
    coalesce(o.is_credit_order, false) AS is_credit_order,
    o.updated_at
  FROM public.orders o
)
SELECT
  n.*,
  (n.expected_credit_used - n.credit_used)::numeric(10,2) AS credit_delta,
  CASE
    WHEN n.expected_credit_used > 0 THEN 'credit'
    WHEN n.advance_paid + n.wallet_used >= n.total_amount THEN 'paid'
    ELSE 'pending'
  END AS expected_payment_status,
  CASE
    WHEN n.expected_credit_used > 0 THEN true
    ELSE false
  END AS expected_is_credit_order
FROM normalized n
WHERE
  abs(n.expected_credit_used - n.credit_used) >= 0.01
  OR n.payment_status IS DISTINCT FROM (
    CASE
      WHEN n.expected_credit_used > 0 THEN 'credit'
      WHEN n.advance_paid + n.wallet_used >= n.total_amount THEN 'paid'
      ELSE 'pending'
    END
  )
  OR n.is_credit_order IS DISTINCT FROM (
    CASE
      WHEN n.expected_credit_used > 0 THEN true
      ELSE false
    END
  );

-- -----------------------------------------------------------------------------
-- 3) Reconcile inconsistent order financial flags and outstanding fields
-- -----------------------------------------------------------------------------
WITH recalculated AS (
  SELECT
    o.id,
    greatest(coalesce(o.total_amount, 0) - coalesce(o.advance_paid, 0) - coalesce(o.wallet_used, 0), 0)::numeric(10,2) AS expected_credit_used,
    CASE
      WHEN greatest(coalesce(o.total_amount, 0) - coalesce(o.advance_paid, 0) - coalesce(o.wallet_used, 0), 0) > 0 THEN 'credit'
      WHEN coalesce(o.advance_paid, 0) + coalesce(o.wallet_used, 0) >= coalesce(o.total_amount, 0) THEN 'paid'
      ELSE 'pending'
    END AS expected_payment_status,
    CASE
      WHEN greatest(coalesce(o.total_amount, 0) - coalesce(o.advance_paid, 0) - coalesce(o.wallet_used, 0), 0) > 0 THEN true
      ELSE false
    END AS expected_is_credit_order
  FROM public.orders o
)
UPDATE public.orders o
SET
  credit_used = r.expected_credit_used,
  payment_status = r.expected_payment_status,
  is_credit_order = r.expected_is_credit_order,
  updated_at = NOW()
FROM recalculated r
WHERE o.id = r.id
  AND (
    abs(coalesce(o.credit_used, 0) - r.expected_credit_used) >= 0.01
    OR o.payment_status IS DISTINCT FROM r.expected_payment_status
    OR coalesce(o.is_credit_order, false) IS DISTINCT FROM r.expected_is_credit_order
  );

-- -----------------------------------------------------------------------------
-- 4) Keep legacy customer.credit_balance aligned with wallet_balance_cache
--    (legacy compatibility only)
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'customers'
      AND column_name = 'wallet_balance_cache'
  )
  AND EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'customers'
      AND column_name = 'credit_balance'
  ) THEN
    UPDATE public.customers c
    SET
      credit_balance = CASE
        WHEN coalesce(c.wallet_balance_cache, 0) < 0 THEN abs(c.wallet_balance_cache)
        ELSE 0
      END,
      updated_at = NOW()
    WHERE coalesce(c.credit_balance, 0) IS DISTINCT FROM (
      CASE
        WHEN coalesce(c.wallet_balance_cache, 0) < 0 THEN abs(c.wallet_balance_cache)
        ELSE 0
      END
    );
  END IF;
END $$;

COMMIT;

-- -----------------------------------------------------------------------------
-- 5) Post-run checks
-- -----------------------------------------------------------------------------
SELECT count(*)::int AS unresolved_mismatches
FROM public.order_credit_reconciliation_issues;

SELECT
  id,
  order_number,
  customer_id,
  credit_used,
  expected_credit_used,
  payment_status,
  expected_payment_status,
  is_credit_order,
  expected_is_credit_order,
  credit_delta,
  updated_at
FROM public.order_credit_reconciliation_issues
ORDER BY updated_at DESC
LIMIT 100;
