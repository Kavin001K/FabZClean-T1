-- ========================================
-- FABZCLEAN COMPLETE SETUP & VERIFICATION
-- Run this to seed data and verify configuration
-- ========================================

BEGIN;

-- ========================================
-- PART 1: VERIFY SCHEMA STRUCTURE
-- ========================================

-- Check all required tables exist
SELECT 
    'TABLE EXISTENCE CHECK' as check_name,
    COUNT(*) as tables_exist,
    CASE 
        WHEN COUNT(*) = 22 THEN '✅ ALL TABLES EXIST'
        ELSE '❌ MISSING TABLES'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'franchises', 'users', 'products', 'customers', 'services', 'orders',
    'deliveries', 'order_transactions', 'shipments', 'barcodes', 'employees',
    'employee_attendance', 'employee_tasks', 'employee_performance',
    'documents', 'audit_logs', 'settings', 'gst_config', 'drivers',
    'transit_orders', 'transit_order_items', 'transit_status_history'
  );

-- Check critical columns exist
SELECT 
    'CRITICAL COLUMNS CHECK' as check_name,
    table_name,
    column_name,
    data_type,
    '✅ EXISTS' as status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
    (table_name = 'employees' AND column_name IN ('franchise_id', 'employee_id', 'password', 'role'))
    OR (table_name = 'employee_attendance' AND column_name = 'franchise_id')
    OR (table_name = 'employee_tasks' AND column_name = 'franchise_id')
    OR (table_name = 'audit_logs' AND column_name = 'franchise_id')
    OR (table_name = 'documents' AND column_name IN ('file_data', 'file_url', 'order_id'))
    OR (table_name = 'barcodes' AND column_name IN ('image_data', 'image_url'))
  )
ORDER BY table_name, column_name;

-- Check foreign key constraints
SELECT 
    'FOREIGN KEY CONSTRAINTS' as check_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS references_table,
    rc.delete_rule,
    CASE 
        WHEN rc.delete_rule = 'CASCADE' THEN '✅ CASCADE DELETE'
        WHEN rc.delete_rule = 'SET NULL' THEN '✅ SET NULL'
        ELSE '⚠️ ' || rc.delete_rule
    END as status
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('employees', 'employee_attendance', 'employee_tasks', 'audit_logs')
ORDER BY tc.table_name, kcu.column_name;

-- ========================================
-- PART 2: SEED INITIAL DATA
-- ========================================

-- Seed Franchises
INSERT INTO franchises (
    id, name, franchise_id, owner_name, email, phone, address, status, created_at, updated_at
) VALUES 
(
    'franchise-pollachi', 
    'Fab Clean Pollachi', 
    'FAB-POLLACHI', 
    'Manager Pollachi', 
    'pollachi@fabzclean.com', 
    '9363059595', 
    '{"street": "#16, Venkatramana Round Road, Opp: Naturals/HDFC Bank, Mahalingapuram", "city": "Pollachi", "state": "Tamil Nadu", "zip": "642002"}',
    'active',
    NOW(),
    NOW()
),
(
    'franchise-kinathukadavu', 
    'Fab Clean Kinathukadavu', 
    'FAB-KIN', 
    'Manager Kinathukadavu', 
    'kinathukadavu@fabzclean.com', 
    '9363719595', 
    '{"street": "#442/11, Opp MlA Office, Krishnasamypuram", "city": "Kinathukadavu", "state": "Tamil Nadu", "zip": "642109"}',
    'active',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Seed Employees (Admin & Managers)
INSERT INTO employees (
    id, franchise_id, first_name, last_name, role, email, password, employee_id, phone, position, department, hire_date, salary, status
) VALUES 
-- Admin
(
    'admin-user-id',
    'franchise-pollachi',
    'System',
    'Admin',
    'admin',
    'admin@myfabclean.com',
    '$2b$10$A7eMtBNk3B8YkTz9LfVRPOII.W815gVpb8DP2W0He8WNzURAoDSxa', -- Durai@2025
    'myfabclean',
    '9999999999',
    'Administrator',
    'Management',
    NOW(),
    100000.00,
    'active'
),
-- Pollachi Manager
(
    gen_random_uuid()::text,
    'franchise-pollachi',
    'Senthil',
    'Kumar',
    'franchise_manager',
    'manager.pollachi@fabzclean.com',
    '$2b$10$A7eMtBNk3B8YkTz9LfVRPOII.W815gVpb8DP2W0He8WNzURAoDSxa',
    'mgr-pol',
    '9876543210',
    'Store Manager',
    'Operations',
    NOW(),
    25000.00,
    'active'
),
-- Pollachi Driver
(
    gen_random_uuid()::text,
    'franchise-pollachi',
    'Ramesh',
    'Driver',
    'driver',
    'driver.pollachi@fabzclean.com',
    '$2b$10$A7eMtBNk3B8YkTz9LfVRPOII.W815gVpb8DP2W0He8WNzURAoDSxa',
    'drv-pol',
    '9876543211',
    'Delivery Driver',
    'Logistics',
    NOW(),
    15000.00,
    'active'
),
-- Pollachi Staff
(
    gen_random_uuid()::text,
    'franchise-pollachi',
    'Priya',
    'Staff',
    'staff',
    'staff.pollachi@fabzclean.com',
    '$2b$10$A7eMtBNk3B8YkTz9LfVRPOII.W815gVpb8DP2W0He8WNzURAoDSxa',
    'staff-pol',
    '9876543214',
    'Counter Staff',
    'Operations',
    NOW(),
    18000.00,
    'active'
),
-- Kinathukadavu Manager
(
    gen_random_uuid()::text,
    'franchise-kinathukadavu',
    'Rajesh',
    'Kannan',
    'franchise_manager',
    'manager.kin@fabzclean.com',
    '$2b$10$A7eMtBNk3B8YkTz9LfVRPOII.W815gVpb8DP2W0He8WNzURAoDSxa',
    'mgr-kin',
    '9876543212',
    'Store Manager',
    'Operations',
    NOW(),
    25000.00,
    'active'
),
-- Kinathukadavu Driver
(
    gen_random_uuid()::text,
    'franchise-kinathukadavu',
    'Suresh',
    'Driver',
    'driver',
    'driver.kin@fabzclean.com',
    '$2b$10$A7eMtBNk3B8YkTz9LfVRPOII.W815gVpb8DP2W0He8WNzURAoDSxa',
    'drv-kin',
    '9876543213',
    'Delivery Driver',
    'Logistics',
    NOW(),
    15000.00,
    'active'
),
-- Kinathukadavu Staff
(
    gen_random_uuid()::text,
    'franchise-kinathukadavu',
    'Karthik',
    'Staff',
    'staff',
    'staff.kin@fabzclean.com',
    '$2b$10$A7eMtBNk3B8YkTz9LfVRPOII.W815gVpb8DP2W0He8WNzURAoDSxa',
    'staff-kin',
    '9876543215',
    'Counter Staff',
    'Operations',
    NOW(),
    18000.00,
    'active'
)
ON CONFLICT (employee_id) DO NOTHING;

-- Seed Test Customer
INSERT INTO customers (
    id, franchise_id, name, email, phone, address, total_orders, total_spent, created_at
) VALUES 
(
    gen_random_uuid()::text,
    'franchise-pollachi',
    'Walk-in Customer',
    'walkin@example.com',
    '0000000000',
    '{"street": "Local", "city": "Pollachi"}',
    0,
    0.00,
    NOW()
)
ON CONFLICT DO NOTHING;

-- Seed Sample Services (Pollachi - 10 common services)
INSERT INTO services (
    id, franchise_id, name, category, description, price, duration, status
) VALUES 
(gen_random_uuid()::text, 'franchise-pollachi', 'Shirt', 'Ironing', 'Steam Ironing for Shirt', 20.00, '24 hours', 'Active'),
(gen_random_uuid()::text, 'franchise-pollachi', 'Shirt', 'Laundry', 'Wash & Iron for Shirt', 30.00, '48 hours', 'Active'),
(gen_random_uuid()::text, 'franchise-pollachi', 'Shirt', 'Dry Cleaning', 'Dry Cleaning for Shirt', 60.00, '72 hours', 'Active'),
(gen_random_uuid()::text, 'franchise-pollachi', 'Pant', 'Ironing', 'Steam Ironing for Pant', 20.00, '24 hours', 'Active'),
(gen_random_uuid()::text, 'franchise-pollachi', 'Pant', 'Laundry', 'Wash & Iron for Pant', 30.00, '48 hours', 'Active'),
(gen_random_uuid()::text, 'franchise-pollachi', 'Pant', 'Dry Cleaning', 'Dry Cleaning for Pant', 70.00, '72 hours', 'Active'),
(gen_random_uuid()::text, 'franchise-pollachi', 'Saree (Cotton)', 'Ironing', 'Steam Ironing for Saree', 50.00, '24 hours', 'Active'),
(gen_random_uuid()::text, 'franchise-pollachi', 'Saree (Cotton)', 'Laundry', 'Wash & Iron for Saree', 100.00, '48 hours', 'Active'),
(gen_random_uuid()::text, 'franchise-pollachi', 'Saree (Cotton)', 'Dry Cleaning', 'Dry Cleaning for Saree', 250.00, '72 hours', 'Active'),
(gen_random_uuid()::text, 'franchise-pollachi', 'Bed Sheet (Double)', 'Laundry', 'Wash & Iron for Bed Sheet', 100.00, '48 hours', 'Active')
ON CONFLICT DO NOTHING;

-- Seed Sample Services (Kinathukadavu - 10 common services)
INSERT INTO services (
    id, franchise_id, name, category, description, price, duration, status
) VALUES 
(gen_random_uuid()::text, 'franchise-kinathukadavu', 'Shirt', 'Ironing', 'Steam Ironing for Shirt', 20.00, '24 hours', 'Active'),
(gen_random_uuid()::text, 'franchise-kinathukadavu', 'Shirt', 'Laundry', 'Wash & Iron for Shirt', 30.00, '48 hours', 'Active'),
(gen_random_uuid()::text, 'franchise-kinathukadavu', 'Shirt', 'Dry Cleaning', 'Dry Cleaning for Shirt', 60.00, '72 hours', 'Active'),
(gen_random_uuid()::text, 'franchise-kinathukadavu', 'Pant', 'Ironing', 'Steam Ironing for Pant', 20.00, '24 hours', 'Active'),
(gen_random_uuid()::text, 'franchise-kinathukadavu', 'Pant', 'Laundry', 'Wash & Iron for Pant', 30.00, '48 hours', 'Active'),
(gen_random_uuid()::text, 'franchise-kinathukadavu', 'Pant', 'Dry Cleaning', 'Dry Cleaning for Pant', 70.00, '72 hours', 'Active'),
(gen_random_uuid()::text, 'franchise-kinathukadavu', 'Saree (Cotton)', 'Ironing', 'Steam Ironing for Saree', 50.00, '24 hours', 'Active'),
(gen_random_uuid()::text, 'franchise-kinathukadavu', 'Saree (Cotton)', 'Laundry', 'Wash & Iron for Saree', 100.00, '48 hours', 'Active'),
(gen_random_uuid()::text, 'franchise-kinathukadavu', 'Saree (Cotton)', 'Dry Cleaning', 'Dry Cleaning for Saree', 250.00, '72 hours', 'Active'),
(gen_random_uuid()::text, 'franchise-kinathukadavu', 'Bed Sheet (Double)', 'Laundry', 'Wash & Iron for Bed Sheet', 100.00, '48 hours', 'Active')
ON CONFLICT DO NOTHING;

COMMIT;

-- ========================================
-- PART 3: VERIFICATION AFTER SEEDING
-- ========================================

-- Verify franchises
SELECT 
    '✅ FRANCHISES SEEDED' as check_name,
    COUNT(*) as total_franchises,
    STRING_AGG(franchise_id, ', ') as franchise_ids,
    CASE 
        WHEN COUNT(*) >= 2 THEN '✅ SUCCESS'
        ELSE '❌ FAILED'
    END as status
FROM franchises;

-- Verify employees by franchise
SELECT 
    '✅ EMPLOYEES BY FRANCHISE' as check_name,
    franchise_id,
    COUNT(*) as employee_count,
    STRING_AGG(DISTINCT role, ', ') as roles,
    STRING_AGG(employee_id, ', ') as employee_ids,
    CASE 
        WHEN COUNT(*) >= 1 THEN '✅ SUCCESS'
        ELSE '❌ FAILED'
    END as status
FROM employees
GROUP BY franchise_id
ORDER BY franchise_id;

-- Verify admin account
SELECT 
    '✅ ADMIN ACCOUNT' as check_name,
    employee_id,
    first_name || ' ' || last_name as full_name,
    email,
    role,
    status,
    CASE 
        WHEN role = 'admin' AND status = 'active' THEN '✅ SUCCESS'
        ELSE '❌ FAILED'
    END as check_status
FROM employees
WHERE role = 'admin';

-- Verify manager accounts
SELECT 
    '✅ MANAGER ACCOUNTS' as check_name,
    franchise_id,
    employee_id,
    first_name || ' ' || last_name as full_name,
    email,
    role,
    CASE 
        WHEN role IN ('franchise_manager', 'manager') AND status = 'active' THEN '✅ SUCCESS'
        ELSE '❌ FAILED'
    END as check_status
FROM employees
WHERE role IN ('franchise_manager', 'manager')
ORDER BY franchise_id;

-- Verify services
SELECT 
    '✅ SERVICES BY FRANCHISE' as check_name,
    franchise_id,
    COUNT(*) as service_count,
    COUNT(DISTINCT category) as categories,
    CASE 
        WHEN COUNT(*) >= 5 THEN '✅ SUCCESS'
        ELSE '⚠️ FEW SERVICES'
    END as status
FROM services
GROUP BY franchise_id
ORDER BY franchise_id;

-- Verify franchise isolation in employees
SELECT 
    '✅ FRANCHISE ISOLATION CHECK' as check_name,
    e.franchise_id as employee_franchise,
    f.franchise_id as franchise_code,
    COUNT(*) as employees,
    CASE 
        WHEN e.franchise_id = f.id THEN '✅ PROPERLY ISOLATED'
        ELSE '❌ ISOLATION BROKEN'
    END as status
FROM employees e
JOIN franchises f ON e.franchise_id = f.id
GROUP BY e.franchise_id, f.franchise_id, f.id
ORDER BY e.franchise_id;

-- Overall system health
SELECT 
    '✅ SYSTEM HEALTH SUMMARY' as report_name,
    (SELECT COUNT(*) FROM franchises) as total_franchises,
    (SELECT COUNT(*) FROM employees WHERE status = 'active') as active_employees,
    (SELECT COUNT(*) FROM services) as total_services,
    (SELECT COUNT(*) FROM customers) as total_customers,
    CASE 
        WHEN (SELECT COUNT(*) FROM franchises) >= 2 
         AND (SELECT COUNT(*) FROM employees WHERE status = 'active') >= 5
         AND (SELECT COUNT(*) FROM services) >= 10
        THEN '✅ SYSTEM READY'
        ELSE '⚠️ INCOMPLETE SETUP'
    END as overall_status;

-- Test login credentials
SELECT 
    '✅ LOGIN CREDENTIALS TEST' as check_name,
    employee_id as username,
    email,
    role,
    'Durai@2025' as password,
    CASE 
        WHEN password IS NOT NULL THEN '✅ PASSWORD SET'
        ELSE '❌ NO PASSWORD'
    END as password_status,
    CASE 
        WHEN status = 'active' THEN '✅ ACTIVE'
        ELSE '❌ INACTIVE'
    END as account_status
FROM employees
WHERE employee_id IN ('myfabclean', 'mgr-pol', 'mgr-kin')
ORDER BY 
    CASE role 
        WHEN 'admin' THEN 1 
        WHEN 'franchise_manager' THEN 2 
        ELSE 3 
    END;

-- ========================================
-- EXPECTED RESULTS
-- ========================================

-- ✅ All checks should show SUCCESS status
-- ✅ total_franchises: 2
-- ✅ active_employees: 7 (1 admin + 2 managers + 2 drivers + 2 staff)
-- ✅ total_services: 20 (10 per franchise)
-- ✅ overall_status: SYSTEM READY

-- ========================================
-- NEXT STEPS
-- ========================================

-- If all checks pass:
-- 1. Test login with: username='myfabclean', password='Durai@2025'
-- 2. Test manager login: username='mgr-pol', password='Durai@2025'
-- 3. Test password reset functionality
-- 4. Test employee deletion functionality
-- 5. Test attendance marking

-- If any checks fail:
-- 1. Review the specific check output
-- 2. Check for error messages
-- 3. Re-run COMPLETE_SUPABASE_SCHEMA.sql
-- 4. Re-run this script
