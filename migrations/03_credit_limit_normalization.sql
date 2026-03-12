BEGIN;

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS credit_limit numeric(10, 2);

UPDATE public.customers
SET credit_limit = 1000
WHERE credit_limit IS DISTINCT FROM 1000;

ALTER TABLE public.customers
  ALTER COLUMN credit_limit SET DEFAULT 1000;

ALTER TABLE public.customers
  ALTER COLUMN credit_limit SET NOT NULL;

ALTER TABLE public.customers
  DROP CONSTRAINT IF EXISTS customers_credit_limit_non_positive_chk;

ALTER TABLE public.customers
  DROP CONSTRAINT IF EXISTS customers_credit_limit_positive_chk;

ALTER TABLE public.customers
  ADD CONSTRAINT customers_credit_limit_positive_chk
  CHECK (credit_limit >= 0);

COMMIT;
