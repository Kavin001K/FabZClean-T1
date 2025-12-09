-- ========================================
-- IMMEDIATE FIX: HIDE ADMIN & OTHER FRANCHISES
-- Run this NOW to fix isolation
-- ========================================

BEGIN;

-- ========================================
-- FIX 1: Ensure Admin has NO franchise_id
-- ========================================

UPDATE employees 
SET franchise_id = NULL 
WHERE role = 'admin';

-- ========================================
-- FIX 2: Verify Franchise Assignments
-- ========================================

-- Check current state
SELECT 
    '❌ BEFORE FIX' as status,
    employee_id,
    first_name || ' ' || last_name as name,
    role,
    franchise_id,
    (SELECT name FROM franchises WHERE id = employees.franchise_id) as franchise_name
FROM employees
ORDER BY franchise_id NULLS FIRST, role, employee_id;

-- ========================================
-- FIX 3: Update Employee IDs (if not done)
-- ========================================

-- Pollachi employees
UPDATE employees 
SET employee_id = 'FZC01MG01'
WHERE employee_id = 'mgr-pol' AND franchise_id = (SELECT id FROM franchises WHERE name = 'Pollachi');

UPDATE employees 
SET employee_id = 'FZC01DR01'
WHERE employee_id = 'drv-pol' AND franchise_id = (SELECT id FROM franchises WHERE name = 'Pollachi');

UPDATE employees 
SET employee_id = 'FZC01CS01'
WHERE employee_id = 'staff-pol' AND franchise_id = (SELECT id FROM franchises WHERE name = 'Pollachi');

-- Kinathukadavu employees
UPDATE employees 
SET employee_id = 'FZC02MG01'
WHERE employee_id = 'mgr-kin' AND franchise_id = (SELECT id FROM franchises WHERE name = 'Kinathukadavu');

UPDATE employees 
SET employee_id = 'FZC02DR01'
WHERE employee_id = 'drv-kin' AND franchise_id = (SELECT id FROM franchises WHERE name = 'Kinathukadavu');

UPDATE employees 
SET employee_id = 'FZC02CS01'
WHERE employee_id = 'staff-kin' AND franchise_id = (SELECT id FROM franchises WHERE name = 'Kinathukadavu');

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Check admin is isolated
SELECT 
    '✅ ADMIN CHECK' as check_name,
    employee_id,
    first_name || ' ' || last_name as name,
    role,
    franchise_id,
    CASE 
        WHEN franchise_id IS NULL THEN '✅ CORRECT - No Franchise'
        ELSE '❌ WRONG - Should be NULL'
    END as status
FROM employees
WHERE role = 'admin';

-- Check Pollachi employees (should be 3)
SELECT 
    '✅ POLLACHI EMPLOYEES' as check_name,
    employee_id,
    first_name || ' ' || last_name as name,
    role,
    position
FROM employees
WHERE franchise_id = (SELECT id FROM franchises WHERE name = 'Pollachi')
ORDER BY employee_id;

-- Check Kinathukadavu employees (should be 3)
SELECT 
    '✅ KINATHUKADAVU EMPLOYEES' as check_name,
    employee_id,
    first_name || ' ' || last_name as name,
    role,
    position
FROM employees
WHERE franchise_id = (SELECT id FROM franchises WHERE name = 'Kinathukadavu')
ORDER BY employee_id;

-- Check isolation counts
SELECT 
    '✅ ISOLATION SUMMARY' as check_name,
    f.name as franchise,
    COUNT(e.id) as employee_count,
    STRING_AGG(e.employee_id, ', ' ORDER BY e.employee_id) as employee_ids
FROM franchises f
LEFT JOIN employees e ON e.franchise_id = f.id
GROUP BY f.id, f.name
ORDER BY f.name;

-- Final verification
SELECT 
    '✅ FINAL CHECK' as status,
    employee_id,
    first_name || ' ' || last_name as name,
    role,
    franchise_id,
    (SELECT name FROM franchises WHERE id = employees.franchise_id) as franchise_name,
    CASE 
        WHEN role = 'admin' AND franchise_id IS NULL THEN '✅ Admin Isolated'
        WHEN role != 'admin' AND franchise_id IS NOT NULL THEN '✅ Franchise Assigned'
        ELSE '❌ ISSUE'
    END as isolation_status
FROM employees
ORDER BY franchise_id NULLS FIRST, role, employee_id;

COMMIT;

-- ========================================
-- EXPECTED RESULTS
-- ========================================

-- ✅ Admin: franchise_id = NULL
-- ✅ Pollachi: 3 employees (FZC01MG01, FZC01DR01, FZC01CS01)
-- ✅ Kinathukadavu: 3 employees (FZC02MG01, FZC02DR01, FZC02CS01)
-- ✅ Total: 7 employees (1 admin + 6 franchise employees)
