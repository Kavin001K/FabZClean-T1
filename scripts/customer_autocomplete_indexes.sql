-- =====================================================================
-- CUSTOMER AUTOCOMPLETE: pg_trgm indexes + search RPC
-- Run this in Supabase SQL Editor
-- =====================================================================

-- 1. Enable pg_trgm extension for trigram similarity search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Create GIN trigram indexes for fast partial matching
-- These indexes dramatically speed up ILIKE / similarity() queries
CREATE INDEX IF NOT EXISTS idx_customers_name_trgm 
  ON public.customers USING gin (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_customers_phone_trgm 
  ON public.customers USING gin (phone gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_customers_id_trgm 
  ON public.customers USING gin (id gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_customers_email_trgm 
  ON public.customers USING gin (email gin_trgm_ops);

-- 3. Create the autocomplete RPC function with relevance scoring
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
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_query TEXT;
  v_query_lower TEXT;
  v_digits TEXT;
BEGIN
  -- Sanitize input
  v_query := TRIM(p_query);
  IF v_query = '' OR v_query IS NULL THEN
    RETURN;
  END IF;

  v_query_lower := LOWER(v_query);
  -- Extract digits only for phone matching
  v_digits := regexp_replace(v_query, '[^0-9]', '', 'g');
  -- Strip leading 0s and +91 prefix from digit string
  v_digits := regexp_replace(v_digits, '^(91|0+)', '');

  RETURN QUERY
  SELECT
    c.id,
    c.name,
    c.phone,
    c.email,
    c.address,
    c.status,
    c.credit_balance::TEXT,
    c.credit_limit::TEXT,
    c.total_orders,
    c.total_spent::TEXT,
    c.last_order,
    c.wallet_balance_cache::TEXT,
    c.created_at,
    c.updated_at,
    -- Relevance scoring: exact > prefix > contains > trigram
    (
      -- Exact name match
      CASE WHEN LOWER(c.name) = v_query_lower THEN 100 ELSE 0 END
      -- Exact phone match (normalized)
      + CASE
          WHEN v_digits <> '' AND regexp_replace(regexp_replace(COALESCE(c.phone,''), '[^0-9]', '', 'g'), '^(91|0+)', '') = v_digits
          THEN 100 ELSE 0
        END
      -- Exact ID match
      + CASE WHEN LOWER(c.id) = v_query_lower THEN 100 ELSE 0 END
      -- Prefix name match
      + CASE WHEN LOWER(c.name) LIKE v_query_lower || '%' THEN 80 ELSE 0 END
      -- Prefix phone match
      + CASE
          WHEN v_digits <> '' AND regexp_replace(regexp_replace(COALESCE(c.phone,''), '[^0-9]', '', 'g'), '^(91|0+)', '') LIKE v_digits || '%'
          THEN 80 ELSE 0
        END
      -- Prefix ID match
      + CASE WHEN LOWER(c.id) LIKE v_query_lower || '%' THEN 80 ELSE 0 END
      -- Contains name match
      + CASE WHEN LOWER(c.name) LIKE '%' || v_query_lower || '%' THEN 50 ELSE 0 END
      -- Contains phone match
      + CASE
          WHEN v_digits <> '' AND regexp_replace(COALESCE(c.phone,''), '[^0-9]', '', 'g') LIKE '%' || v_digits || '%'
          THEN 50 ELSE 0
        END
      -- Contains email match
      + CASE WHEN LOWER(COALESCE(c.email,'')) LIKE '%' || v_query_lower || '%' THEN 50 ELSE 0 END
      -- Contains ID match
      + CASE WHEN LOWER(c.id) LIKE '%' || v_query_lower || '%' THEN 50 ELSE 0 END
      -- Trigram similarity on name (fuzzy)
      + CASE
          WHEN LENGTH(v_query) >= 3 AND similarity(LOWER(c.name), v_query_lower) > 0.3
          THEN (similarity(LOWER(c.name), v_query_lower) * 40)::NUMERIC
          ELSE 0
        END
    )::NUMERIC AS relevance_score
  FROM public.customers c
  WHERE c.status IS DISTINCT FROM 'deleted'
    AND (
      -- Name matching
      LOWER(c.name) LIKE '%' || v_query_lower || '%'
      -- Phone matching (raw)
      OR COALESCE(c.phone, '') LIKE '%' || v_query || '%'
      -- Phone matching (digits only)
      OR (v_digits <> '' AND regexp_replace(COALESCE(c.phone,''), '[^0-9]', '', 'g') LIKE '%' || v_digits || '%')
      -- Email matching
      OR LOWER(COALESCE(c.email, '')) LIKE '%' || v_query_lower || '%'
      -- ID matching
      OR LOWER(c.id) LIKE '%' || v_query_lower || '%'
      -- Trigram similarity for fuzzy name matching (only for 3+ char queries)
      OR (LENGTH(v_query) >= 3 AND similarity(LOWER(c.name), v_query_lower) > 0.3)
    )
  ORDER BY relevance_score DESC, c.name ASC
  LIMIT p_limit;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.search_customers_autocomplete(TEXT, INT) TO anon, authenticated, service_role;

-- =====================================================================
-- DONE! Run this SQL in Supabase SQL Editor to set up the indexes and RPC.
-- The GIN trigram indexes will dramatically speed up ILIKE queries.
-- The RPC returns results ranked by relevance score.
-- =====================================================================
