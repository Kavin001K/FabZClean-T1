ALTER TABLE orders
ADD COLUMN IF NOT EXISTS store_code TEXT;

ALTER TABLE orders
ALTER COLUMN store_code SET DEFAULT 'POL';

UPDATE orders
SET store_code = CASE
  WHEN store_code IS NOT NULL AND btrim(store_code) <> '' THEN upper(store_code)
  WHEN franchise_id ILIKE '%pollachi%' OR franchise_id ILIKE '%pol%' THEN 'POL'
  WHEN franchise_id ILIKE '%kinathukadavu%' OR franchise_id ILIKE '%kin%' THEN 'KIN'
  WHEN franchise_id ILIKE '%mcet%' THEN 'MCET'
  WHEN franchise_id ILIKE '%udm%' OR franchise_id ILIKE '%udumalpet%' THEN 'UDM'
  ELSE 'POL'
END
WHERE store_code IS NULL OR btrim(store_code) = '';

CREATE INDEX IF NOT EXISTS idx_orders_store_code ON orders(store_code);
