BEGIN;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS cancellation_reason text;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS cancelled_by text;

CREATE OR REPLACE FUNCTION public.cancel_order_with_reason(
  p_order_id text,
  p_cancellation_reason text DEFAULT 'Operational Issue',
  p_cancelled_by text DEFAULT 'system'
)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
BEGIN
  PERFORM set_config('app.wallet_sync', 'on', true);

  UPDATE public.orders
  SET
    status = 'cancelled',
    cancellation_reason = COALESCE(NULLIF(btrim(p_cancellation_reason), ''), 'Operational Issue'),
    cancelled_at = NOW(),
    cancelled_by = COALESCE(NULLIF(btrim(p_cancelled_by), ''), 'system'),
    updated_at = NOW()
  WHERE id::text = p_order_id
  RETURNING * INTO v_order;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order % not found', p_order_id;
  END IF;

  RETURN v_order;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cancel_order_with_reason(text, text, text) TO anon, authenticated, service_role;

COMMIT;
