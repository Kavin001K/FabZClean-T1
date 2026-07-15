CREATE OR REPLACE FUNCTION public.recalculate_customer_stats_fn()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle OLD customer (for UPDATE or DELETE)
    IF (TG_OP = 'UPDATE' OR TG_OP = 'DELETE') THEN
        IF OLD.customer_id IS NOT NULL THEN
            UPDATE public.customers
            SET 
                total_orders = (
                    SELECT COALESCE(COUNT(*), 0)
                    FROM public.orders
                    WHERE customer_id = OLD.customer_id
                      AND status != 'cancelled'
                      AND status != 'refunded'
                ),
                total_spent = (
                    SELECT COALESCE(SUM(total_amount), 0)
                    FROM public.orders
                    WHERE customer_id = OLD.customer_id
                      AND status != 'cancelled'
                      AND status != 'refunded'
                ),
                updated_at = NOW()
            WHERE id = OLD.customer_id;
        END IF;
    END IF;

    -- Handle NEW customer (for INSERT or UPDATE)
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
        IF NEW.customer_id IS NOT NULL THEN
            UPDATE public.customers
            SET 
                total_orders = (
                    SELECT COALESCE(COUNT(*), 0)
                    FROM public.orders
                    WHERE customer_id = NEW.customer_id
                      AND status != 'cancelled'
                      AND status != 'refunded'
                ),
                total_spent = (
                    SELECT COALESCE(SUM(total_amount), 0)
                    FROM public.orders
                    WHERE customer_id = NEW.customer_id
                      AND status != 'cancelled'
                      AND status != 'refunded'
                ),
                updated_at = NOW()
            WHERE id = NEW.customer_id;
        END IF;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_recalculate_customer_stats ON public.orders;
CREATE TRIGGER trg_recalculate_customer_stats
AFTER INSERT OR UPDATE OR DELETE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.recalculate_customer_stats_fn();
