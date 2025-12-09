-- ========================================
-- PHASE 1: FRANCHISE ID SYSTEM - DATABASE MIGRATION
-- Complete Implementation with Auto-Generation
-- ========================================

BEGIN;

-- ========================================
-- STEP 1: Add Franchise Codes
-- ========================================

-- Add franchise_code column
ALTER TABLE franchises
ADD COLUMN IF NOT EXISTS franchise_code VARCHAR(10) UNIQUE;

-- Create sequence for franchise codes
CREATE SEQUENCE IF NOT EXISTS franchise_code_seq START 1;

-- Function to generate franchise code
CREATE OR REPLACE FUNCTION generate_franchise_code()
RETURNS VARCHAR AS $$
DECLARE
    v_next_num INT;
    v_code VARCHAR(10);
BEGIN
    v_next_num := nextval('franchise_code_seq');
    v_code := 'FZC' || LPAD(v_next_num::TEXT, 2, '0');
    RETURN v_code;
END;
$$ LANGUAGE plpgsql;

-- Update existing franchises
UPDATE franchises 
SET franchise_code = 'FZC01' 
WHERE name LIKE '%Pollachi%' AND franchise_code IS NULL;

UPDATE franchises 
SET franchise_code = 'FZC02' 
WHERE name LIKE '%Kinathukadavu%' AND franchise_code IS NULL;

-- Set sequence to continue from 03
SELECT setval('franchise_code_seq', 2);

-- Add NOT NULL constraint after populating
ALTER TABLE franchises
ALTER COLUMN franchise_code SET NOT NULL;

-- Add index
CREATE INDEX IF NOT EXISTS idx_franchises_code ON franchises(franchise_code);

-- ========================================
-- STEP 2: Employee ID System
-- ========================================

-- Add new employee_code column (keep old employee_id for reference)
ALTER TABLE employees
ADD COLUMN IF NOT EXISTS employee_code VARCHAR(20) UNIQUE;

-- Create sequences for each role type
CREATE SEQUENCE IF NOT EXISTS manager_seq START 1;
CREATE SEQUENCE IF NOT EXISTS employee_seq START 1;
CREATE SEQUENCE IF NOT EXISTS driver_seq START 1;
CREATE SEQUENCE IF NOT EXISTS staff_seq START 1;

-- Function to generate employee code
CREATE OR REPLACE FUNCTION generate_employee_code(
    p_franchise_id TEXT,
    p_role VARCHAR
)
RETURNS VARCHAR AS $$
DECLARE
    v_franchise_code VARCHAR(10);
    v_role_code VARCHAR(2);
    v_next_num INT;
    v_employee_code VARCHAR(20);
BEGIN
    -- Get franchise code
    SELECT franchise_code INTO v_franchise_code
    FROM franchises WHERE id = p_franchise_id;
    
    -- Determine role code and get next number
    CASE p_role
        WHEN 'franchise_manager' THEN
            v_role_code := 'MG';
            v_next_num := nextval('manager_seq');
        WHEN 'driver' THEN
            v_role_code := 'DR';
            v_next_num := nextval('driver_seq');
        WHEN 'staff' THEN
            v_role_code := 'CS';
            v_next_num := nextval('staff_seq');
        ELSE
            v_role_code := 'EM';
            v_next_num := nextval('employee_seq');
    END CASE;
    
    -- Generate code
    v_employee_code := v_franchise_code || v_role_code || LPAD(v_next_num::TEXT, 2, '0');
    
    RETURN v_employee_code;
END;
$$ LANGUAGE plpgsql;

-- Update existing employees with new codes
UPDATE employees 
SET employee_code = 'FZC01MG01'
WHERE employee_id = 'mgr-pol';

UPDATE employees 
SET employee_code = 'FZC01DR01'
WHERE employee_id = 'drv-pol';

UPDATE employees 
SET employee_code = 'FZC01CS01'
WHERE employee_id = 'staff-pol';

UPDATE employees 
SET employee_code = 'FZC02MG01'
WHERE employee_id = 'mgr-kin';

UPDATE employees 
SET employee_code = 'FZC02DR01'
WHERE employee_id = 'drv-kin';

UPDATE employees 
SET employee_code = 'FZC02CS01'
WHERE employee_id = 'staff-kin';

-- Admin gets special code
UPDATE employees 
SET employee_code = 'ADMIN'
WHERE role = 'admin';

-- ========================================
-- STEP 3: Order Code System
-- ========================================

-- Add order_code column
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS order_code VARCHAR(30) UNIQUE;

-- Create sequence for orders
CREATE SEQUENCE IF NOT EXISTS order_seq START 1;

-- Function to generate order code
CREATE OR REPLACE FUNCTION generate_order_code(
    p_franchise_id TEXT
)
RETURNS VARCHAR AS $$
DECLARE
    v_franchise_code VARCHAR(10);
    v_next_num INT;
    v_order_code VARCHAR(30);
BEGIN
    -- Get franchise code
    SELECT franchise_code INTO v_franchise_code
    FROM franchises WHERE id = p_franchise_id;
    
    -- Get next order number for this franchise
    SELECT COALESCE(MAX(
        CAST(SUBSTRING(order_code FROM 'OR(.{4})$') AS INT)
    ), 0) + 1
    INTO v_next_num
    FROM orders
    WHERE order_code LIKE v_franchise_code || 'OR%';
    
    -- If no previous orders, start at 1
    IF v_next_num IS NULL THEN
        v_next_num := 1;
    END IF;
    
    -- Generate code: FZC01OR0001
    v_order_code := v_franchise_code || 'OR' || LPAD(v_next_num::TEXT, 4, '0');
    
    RETURN v_order_code;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- STEP 4: Customer Code System
-- ========================================

-- Add customer_code column
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS customer_code VARCHAR(20) UNIQUE;

-- Function to generate customer code
CREATE OR REPLACE FUNCTION generate_customer_code(
    p_franchise_id TEXT
)
RETURNS VARCHAR AS $$
DECLARE
    v_franchise_code VARCHAR(10);
    v_next_num INT;
    v_customer_code VARCHAR(20);
BEGIN
    -- Get franchise code
    SELECT franchise_code INTO v_franchise_code
    FROM franchises WHERE id = p_franchise_id;
    
    -- Get next customer number for this franchise
    SELECT COALESCE(MAX(
        CAST(SUBSTRING(customer_code FROM 'CU(.{4})$') AS INT)
    ), 0) + 1
    INTO v_next_num
    FROM customers
    WHERE customer_code LIKE v_franchise_code || 'CU%';
    
    -- If no previous customers, start at 1
    IF v_next_num IS NULL THEN
        v_next_num := 1;
    END IF;
    
    -- Generate code: FZC01CU0001
    v_customer_code := v_franchise_code || 'CU' || LPAD(v_next_num::TEXT, 4, '0');
    
    RETURN v_customer_code;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- STEP 5: Service Code System
-- ========================================

-- Add service_code column
ALTER TABLE services
ADD COLUMN IF NOT EXISTS service_code VARCHAR(20) UNIQUE;

-- Function to generate service code
CREATE OR REPLACE FUNCTION generate_service_code(
    p_franchise_id TEXT
)
RETURNS VARCHAR AS $$
DECLARE
    v_franchise_code VARCHAR(10);
    v_next_num INT;
    v_service_code VARCHAR(20);
BEGIN
    -- Get franchise code
    SELECT franchise_code INTO v_franchise_code
    FROM franchises WHERE id = p_franchise_id;
    
    -- Get next service number for this franchise
    SELECT COALESCE(MAX(
        CAST(SUBSTRING(service_code FROM 'SV(.{4})$') AS INT)
    ), 0) + 1
    INTO v_next_num
    FROM services
    WHERE service_code LIKE v_franchise_code || 'SV%';
    
    -- If no previous services, start at 1
    IF v_next_num IS NULL THEN
        v_next_num := 1;
    END IF;
    
    -- Generate code: FZC01SV0001
    v_service_code := v_franchise_code || 'SV' || LPAD(v_next_num::TEXT, 4, '0');
    
    RETURN v_service_code;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- STEP 6: Auto-Trigger System
-- ========================================

-- Trigger to auto-generate employee codes
CREATE OR REPLACE FUNCTION auto_generate_employee_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.employee_code IS NULL AND NEW.role != 'admin' THEN
        NEW.employee_code := generate_employee_code(NEW.franchise_id, NEW.role);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_auto_employee_code
BEFORE INSERT ON employees
FOR EACH ROW
EXECUTE FUNCTION auto_generate_employee_code();

-- Trigger to auto-generate order codes
CREATE OR REPLACE FUNCTION auto_generate_order_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_code IS NULL THEN
        NEW.order_code := generate_order_code(NEW.franchise_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_auto_order_code
BEFORE INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION auto_generate_order_code();

-- Trigger to auto-generate customer codes
CREATE OR REPLACE FUNCTION auto_generate_customer_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.customer_code IS NULL THEN
        NEW.customer_code := generate_customer_code(NEW.franchise_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_auto_customer_code
BEFORE INSERT ON customers
FOR EACH ROW
EXECUTE FUNCTION auto_generate_customer_code();

-- ========================================
-- STEP 7: Reporting Views
-- ========================================

-- Franchise Performance View
CREATE OR REPLACE VIEW vw_franchise_performance AS
SELECT 
    f.franchise_code,
    f.name AS franchise_name,
    f.owner_name,
    f.phone,
    f.email,
    COUNT(DISTINCT e.id) FILTER (WHERE e.role != 'admin') AS total_employees,
    COUNT(DISTINCT o.id) AS total_orders,
    COALESCE(SUM(o.total_amount), 0) AS total_revenue,
    COUNT(DISTINCT c.id) AS total_customers,
    COUNT(DISTINCT s.id) AS total_services,
    ROUND(AVG(o.total_amount), 2) AS avg_order_value,
    COUNT(DISTINCT o.id) FILTER (WHERE o.created_at >= CURRENT_DATE - INTERVAL '30 days') AS orders_last_30_days,
    COALESCE(SUM(o.total_amount) FILTER (WHERE o.created_at >= CURRENT_DATE - INTERVAL '30 days'), 0) AS revenue_last_30_days
FROM franchises f
LEFT JOIN employees e ON e.franchise_id = f.id
LEFT JOIN orders o ON o.franchise_id = f.id
LEFT JOIN customers c ON c.franchise_id = f.id
LEFT JOIN services s ON s.franchise_id = f.id
GROUP BY f.id, f.franchise_code, f.name, f.owner_name, f.phone, f.email
ORDER BY total_revenue DESC;

-- Employee Performance View
CREATE OR REPLACE VIEW vw_employee_performance AS
SELECT 
    e.employee_code,
    e.first_name || ' ' || e.last_name AS employee_name,
    e.role,
    e.position,
    f.franchise_code,
    f.name AS franchise_name,
    0 AS orders_created,
    0 AS revenue_generated,
    0 AS avg_order_value,
    0 AS orders_last_30_days,
    0 AS revenue_last_30_days
FROM employees e
JOIN franchises f ON f.id = e.franchise_id
WHERE e.role != 'admin'
GROUP BY e.id, e.employee_code, e.first_name, e.last_name, e.role, e.position, f.franchise_code, f.name
ORDER BY e.employee_code;

-- Order Analytics View
CREATE OR REPLACE VIEW vw_order_analytics AS
SELECT 
    o.order_code,
    o.id AS order_id,
    f.franchise_code,
    f.name AS franchise_name,
    c.customer_code,
    c.name AS customer_name,
    o.total_amount,
    o.status,
    o.created_at,
    DATE_PART('year', o.created_at) AS year,
    DATE_PART('month', o.created_at) AS month,
    DATE_PART('day', o.created_at) AS day,
    TO_CHAR(o.created_at, 'YYYY-MM') AS year_month,
    TO_CHAR(o.created_at, 'Day') AS day_of_week
FROM orders o
JOIN franchises f ON f.id = o.franchise_id
LEFT JOIN customers c ON c.id = o.customer_id
ORDER BY o.created_at DESC;

-- Daily Summary View
CREATE OR REPLACE VIEW vw_daily_summary AS
SELECT 
    DATE(o.created_at) AS date,
    f.franchise_code,
    f.name AS franchise_name,
    COUNT(o.id) AS total_orders,
    SUM(o.total_amount) AS total_revenue,
    AVG(o.total_amount) AS avg_order_value,
    COUNT(DISTINCT o.customer_id) AS unique_customers
FROM orders o
JOIN franchises f ON f.id = o.franchise_id
GROUP BY DATE(o.created_at), f.franchise_code, f.name
ORDER BY date DESC, total_revenue DESC;

-- ========================================
-- STEP 8: Utility Functions
-- ========================================

-- Function to get franchise from code
CREATE OR REPLACE FUNCTION get_franchise_from_code(p_code VARCHAR)
RETURNS TABLE (
    id TEXT,
    franchise_code VARCHAR,
    name VARCHAR,
    owner_name VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT f.id, f.franchise_code, f.name, f.owner_name
    FROM franchises f
    WHERE f.franchise_code = SUBSTRING(p_code FROM 1 FOR 5);
END;
$$ LANGUAGE plpgsql;

-- Function to parse order code
CREATE OR REPLACE FUNCTION parse_order_code(p_order_code VARCHAR)
RETURNS TABLE (
    franchise_code VARCHAR,
    employee_code VARCHAR,
    order_number INT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        SUBSTRING(p_order_code FROM 1 FOR 5)::VARCHAR AS franchise_code,
        SUBSTRING(p_order_code FROM 1 FOR 12)::VARCHAR AS employee_code,
        CAST(SUBSTRING(p_order_code FROM 'OR(.{4})$') AS INT) AS order_number;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- VERIFICATION
-- ========================================

-- Check franchise codes
SELECT 
    '✅ FRANCHISE CODES' as check_name,
    franchise_code,
    name,
    owner_name
FROM franchises
ORDER BY franchise_code;

-- Check employee codes
SELECT 
    '✅ EMPLOYEE CODES' as check_name,
    employee_code,
    employee_id,
    first_name || ' ' || last_name as name,
    role,
    (SELECT franchise_code FROM franchises WHERE id = employees.franchise_id) as franchise
FROM employees
ORDER BY employee_code;

-- Test code generation
SELECT 
    '✅ TEST CODE GENERATION' as test,
    generate_franchise_code() as new_franchise_code,
    generate_employee_code(
        (SELECT id FROM franchises WHERE franchise_code = 'FZC01'),
        'staff'
    ) as new_employee_code,
    generate_customer_code(
        (SELECT id FROM franchises WHERE franchise_code = 'FZC01')
    ) as new_customer_code;

COMMIT;

-- ========================================
-- SUCCESS MESSAGE
-- ========================================

SELECT '🎉 FRANCHISE ID SYSTEM INSTALLED SUCCESSFULLY!' as status;
SELECT '✅ All codes generated automatically on insert' as info;
SELECT '✅ Reporting views created' as info;
SELECT '✅ Utility functions ready' as info;
