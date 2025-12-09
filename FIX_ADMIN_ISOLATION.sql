-- ========================================
-- FIX ATTENDANCE ISOLATION ISSUES
-- Run this in Supabase SQL Editor
-- ========================================

BEGIN;

-- ========================================
-- FIX 1: Remove Admin from Franchise Scope
-- ========================================

-- Set admin's franchise_id to NULL (global access)
UPDATE employees 
SET franchise_id = NULL 
WHERE role = 'admin';

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Check admin is no longer tied to a franchise
SELECT 
    '✅ ADMIN ISOLATION CHECK' as check_name,
    employee_id,
    first_name || ' ' || last_name as name,
    role,
    franchise_id,
    CASE 
        WHEN franchise_id IS NULL THEN '✅ CORRECT - Global Access'
        ELSE '❌ WRONG - Should be NULL'
    END as status
FROM employees
WHERE role = 'admin';

-- Check Pollachi employees (should NOT include admin)
SELECT 
    '✅ POLLACHI EMPLOYEES' as check_name,
    employee_id,
    first_name || ' ' || last_name as name,
    role,
    position
FROM employees
WHERE franchise_id = 'franchise-pollachi'
ORDER BY role, employee_id;

-- Check Kinathukadavu employees (should NOT include admin)
SELECT 
    '✅ KINATHUKADAVU EMPLOYEES' as check_name,
    employee_id,
    first_name || ' ' || last_name as name,
    role,
    position
FROM employees
WHERE franchise_id = 'franchise-kinathukadavu'
ORDER BY role, employee_id;

-- Check attendance isolation
SELECT 
    '✅ ATTENDANCE ISOLATION' as check_name,
    e.franchise_id,
    COUNT(*) as employee_count,
    STRING_AGG(e.employee_id, ', ') as employee_ids
FROM employees e
WHERE e.franchise_id IS NOT NULL
GROUP BY e.franchise_id
ORDER BY e.franchise_id;

COMMIT;

-- ========================================
-- EXPECTED RESULTS
-- ========================================

-- ✅ Admin franchise_id: NULL
-- ✅ Pollachi employees: 3 (mgr-pol, drv-pol, staff-pol)
-- ✅ Kinathukadavu employees: 3 (mgr-kin, drv-kin, staff-kin)
-- ✅ Admin NOT in either list
