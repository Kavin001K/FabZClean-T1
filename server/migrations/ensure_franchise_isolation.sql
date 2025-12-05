-- Ensure franchise_id column exists on all relevant tables for data isolation

-- 1. Orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS franchise_id TEXT;
CREATE INDEX IF NOT EXISTS idx_orders_franchise_id ON orders(franchise_id);

-- 2. Employees
ALTER TABLE employees ADD COLUMN IF NOT EXISTS franchise_id TEXT;
CREATE INDEX IF NOT EXISTS idx_employees_franchise_id ON employees(franchise_id);

-- 3. Customers (Optional but good for consistency)
ALTER TABLE customers ADD COLUMN IF NOT EXISTS franchise_id TEXT;
CREATE INDEX IF NOT EXISTS idx_customers_franchise_id ON customers(franchise_id);

-- 4. Products (Inventory isolation)
ALTER TABLE products ADD COLUMN IF NOT EXISTS franchise_id TEXT;
CREATE INDEX IF NOT EXISTS idx_products_franchise_id ON products(franchise_id);

-- 5. Documents
ALTER TABLE documents ADD COLUMN IF NOT EXISTS franchise_id TEXT;
CREATE INDEX IF NOT EXISTS idx_documents_franchise_id ON documents(franchise_id);

-- 6. Reload Schema Cache
NOTIFY pgrst, 'reload config';
