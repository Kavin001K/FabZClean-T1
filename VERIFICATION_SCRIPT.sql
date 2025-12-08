-- ========================================
-- FABZCLEAN ISOLATION VERIFICATION SCRIPT
-- Run this after setting up the database
-- ========================================

-- This script performs comprehensive checks to ensure
-- proper franchise isolation and data integrity

BEGIN;

-- ========================================
-- PART 1: FRANCHISE ISOLATION VERIFICATION
-- ========================================

-- Test 1: Verify franchise isolation in employees
SELECT 
    'EMPLOYEES BY FRANCHISE' as test_name,
    franchise_id, 
    COUNT(*) as employee_count,
    COUNT(DISTINCT role) as unique_roles
FROM employees 
GROUP BY franchise_id
ORDER BY franchise_id;

-- Test 2: Verify attendance isolation
SELECT 
    'ATTENDANCE BY FRANCHISE' as test_name,
    ea.franchise_id, 
    COUNT(*) as attendance_records,
    COUNT(DISTINCT ea.employee_id) as unique_employees,
    MIN(ea.date) as earliest_record,
    MAX(ea.date) as latest_record
FROM employee_attendance ea 
GROUP BY ea.franchise_id
ORDER BY ea.franchise_id;

-- Test 3: CRITICAL - Detect cross-franchise attendance leakage
-- This should return 0 rows if isolation is working correctly
SELECT 
    'CROSS-FRANCHISE ATTENDANCE LEAKAGE' as test_name,
    e.franchise_id as employee_franchise, 
    ea.franchise_id as attendance_franchise,
    e.employee_id,
    e.first_name || ' ' || e.last_name as employee_name,
    COUNT(*) as mismatched_records
FROM employees e 
JOIN employee_attendance ea ON e.id = ea.employee_id 
WHERE e.franchise_id != ea.franchise_id 
GROUP BY e.franchise_id, ea.franchise_id, e.employee_id, e.first_name, e.last_name;
-- ⚠️ IF THIS RETURNS ANY ROWS, ISOLATION IS BROKEN!

-- Test 4: Verify task isolation
SELECT 
    'TASKS BY FRANCHISE' as test_name,
    et.franchise_id, 
    COUNT(*) as task_count,
    COUNT(DISTINCT et.employee_id) as employees_with_tasks,
    COUNT(DISTINCT et.status) as unique_statuses
FROM employee_tasks et 
GROUP BY et.franchise_id
ORDER BY et.franchise_id;

-- Test 5: CRITICAL - Detect cross-franchise task leakage
SELECT 
    'CROSS-FRANCHISE TASK LEAKAGE' as test_name,
    e.franchise_id as employee_franchise, 
    et.franchise_id as task_franchise,
    e.employee_id,
    et.title as task_title,
    COUNT(*) as mismatched_records
FROM employees e 
JOIN employee_tasks et ON e.id = et.employee_id 
WHERE e.franchise_id != et.franchise_id 
GROUP BY e.franchise_id, et.franchise_id, e.employee_id, et.title;
-- ⚠️ IF THIS RETURNS ANY ROWS, ISOLATION IS BROKEN!

-- ========================================
-- PART 2: DATA INTEGRITY VERIFICATION
-- ========================================

-- Test 6: Verify unique constraints
SELECT 
    'DUPLICATE ATTENDANCE CHECK' as test_name,
    employee_id,
    date,
    COUNT(*) as duplicate_count
FROM employee_attendance
GROUP BY employee_id, date
HAVING COUNT(*) > 1;
-- ⚠️ IF THIS RETURNS ANY ROWS, UNIQUE CONSTRAINT IS VIOLATED!

-- Test 7: Verify order number uniqueness per franchise
SELECT 
    'DUPLICATE ORDER NUMBERS' as test_name,
    franchise_id,
    order_number,
    COUNT(*) as duplicate_count
FROM orders
GROUP BY franchise_id, order_number
HAVING COUNT(*) > 1;
-- ⚠️ IF THIS RETURNS ANY ROWS, UNIQUE CONSTRAINT IS VIOLATED!

-- Test 8: Verify foreign key integrity
SELECT 
    'ORPHANED ATTENDANCE RECORDS' as test_name,
    ea.id as attendance_id,
    ea.employee_id,
    ea.franchise_id
FROM employee_attendance ea
LEFT JOIN employees e ON ea.employee_id = e.id
WHERE e.id IS NULL;
-- ⚠️ IF THIS RETURNS ANY ROWS, FOREIGN KEY INTEGRITY IS BROKEN!

-- Test 9: Verify orphaned tasks
SELECT 
    'ORPHANED TASK RECORDS' as test_name,
    et.id as task_id,
    et.employee_id,
    et.franchise_id
FROM employee_tasks et
LEFT JOIN employees e ON et.employee_id = e.id
WHERE e.id IS NULL;
-- ⚠️ IF THIS RETURNS ANY ROWS, FOREIGN KEY INTEGRITY IS BROKEN!

-- ========================================
-- PART 3: AUTHORIZATION VERIFICATION
-- ========================================

-- Test 10: Verify manager cannot see other franchise employees
SELECT 
    'MANAGER CROSS-FRANCHISE ACCESS' as test_name,
    e1.employee_id as manager_id,
    e1.franchise_id as manager_franchise,
    e2.employee_id as employee_id,
    e2.franchise_id as employee_franchise,
    'VIOLATION: Manager can see employee from different franchise' as issue
FROM employees e1
CROSS JOIN employees e2
WHERE e1.role = 'franchise_manager'
  AND e2.franchise_id != e1.franchise_id
  AND e1.id != e2.id
LIMIT 5;
-- ⚠️ This shows potential cross-franchise visibility issues

-- Test 11: Verify admin accounts
SELECT 
    'ADMIN ACCOUNTS' as test_name,
    employee_id,
    first_name || ' ' || last_name as full_name,
    email,
    franchise_id,
    status
FROM employees
WHERE role = 'admin'
ORDER BY created_at;

-- Test 12: Verify manager accounts per franchise
SELECT 
    'MANAGERS BY FRANCHISE' as test_name,
    franchise_id,
    COUNT(*) as manager_count,
    STRING_AGG(employee_id, ', ') as manager_ids
FROM employees
WHERE role IN ('franchise_manager', 'manager')
GROUP BY franchise_id
ORDER BY franchise_id;

-- ========================================
-- PART 4: AUDIT LOG VERIFICATION
-- ========================================

-- Test 13: Verify audit logs are franchise-scoped
SELECT 
    'AUDIT LOGS BY FRANCHISE' as test_name,
    al.franchise_id,
    COUNT(*) as total_logs,
    COUNT(DISTINCT al.action) as unique_actions,
    COUNT(DISTINCT al.employee_id) as unique_employees
FROM audit_logs al
GROUP BY al.franchise_id
ORDER BY al.franchise_id;

-- Test 14: Verify password reset logs
SELECT 
    'PASSWORD RESET AUDIT' as test_name,
    al.franchise_id,
    al.action,
    al.details->>'target_employee' as target_employee,
    al.details->>'reset_by' as reset_by,
    al.created_at
FROM audit_logs al
WHERE al.action = 'reset_employee_password'
ORDER BY al.created_at DESC
LIMIT 10;

-- Test 15: Verify employee deletion logs
SELECT 
    'EMPLOYEE DELETION AUDIT' as test_name,
    al.franchise_id,
    al.action,
    al.details->>'target_employee' as target_employee,
    al.details->>'deleted_by' as deleted_by,
    al.details->>'deactivated_by' as deactivated_by,
    al.created_at
FROM audit_logs al
WHERE al.action IN ('delete_employee_hard', 'deactivate_employee')
ORDER BY al.created_at DESC
LIMIT 10;

-- ========================================
-- PART 5: DOCUMENT & BARCODE VERIFICATION
-- ========================================

-- Test 16: Verify documents are stored
SELECT 
    'DOCUMENTS BY TYPE' as test_name,
    type,
    COUNT(*) as document_count,
    COUNT(DISTINCT franchise_id) as franchises,
    SUM(CASE WHEN file_data IS NOT NULL THEN 1 ELSE 0 END) as with_base64,
    SUM(CASE WHEN file_url IS NOT NULL THEN 1 ELSE 0 END) as with_url
FROM documents
GROUP BY type
ORDER BY type;

-- Test 17: Verify barcodes are stored with images
SELECT 
    'BARCODES WITH IMAGES' as test_name,
    franchise_id,
    COUNT(*) as total_barcodes,
    SUM(CASE WHEN image_data IS NOT NULL THEN 1 ELSE 0 END) as with_base64,
    SUM(CASE WHEN image_url IS NOT NULL THEN 1 ELSE 0 END) as with_url,
    SUM(CASE WHEN is_active THEN 1 ELSE 0 END) as active_barcodes
FROM barcodes
GROUP BY franchise_id
ORDER BY franchise_id;

-- Test 18: Verify order-document linkage
SELECT 
    'ORDER DOCUMENT LINKAGE' as test_name,
    o.franchise_id,
    COUNT(DISTINCT o.id) as orders_with_documents,
    COUNT(d.id) as total_documents,
    STRING_AGG(DISTINCT d.type, ', ') as document_types
FROM orders o
JOIN documents d ON o.id = d.order_id
GROUP BY o.franchise_id
ORDER BY o.franchise_id;

-- ========================================
-- PART 6: PERFORMANCE VERIFICATION
-- ========================================

-- Test 19: Verify indexes exist
SELECT 
    'DATABASE INDEXES' as test_name,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'employees', 'employee_attendance', 'employee_tasks',
    'orders', 'customers', 'documents', 'barcodes', 'audit_logs'
  )
ORDER BY tablename, indexname;

-- Test 20: Verify foreign key constraints
SELECT 
    'FOREIGN KEY CONSTRAINTS' as test_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- ========================================
-- PART 7: SUMMARY REPORT
-- ========================================

-- Test 21: Overall system health
SELECT 
    'SYSTEM HEALTH SUMMARY' as report_name,
    (SELECT COUNT(*) FROM franchises) as total_franchises,
    (SELECT COUNT(*) FROM employees WHERE status = 'active') as active_employees,
    (SELECT COUNT(*) FROM employee_attendance) as total_attendance_records,
    (SELECT COUNT(*) FROM employee_tasks) as total_tasks,
    (SELECT COUNT(*) FROM orders) as total_orders,
    (SELECT COUNT(*) FROM documents) as total_documents,
    (SELECT COUNT(*) FROM barcodes) as total_barcodes,
    (SELECT COUNT(*) FROM audit_logs) as total_audit_logs;

-- Test 22: Franchise-wise summary
SELECT 
    'FRANCHISE SUMMARY' as report_name,
    f.franchise_id,
    f.name as franchise_name,
    f.status,
    (SELECT COUNT(*) FROM employees e WHERE e.franchise_id = f.id AND e.status = 'active') as active_employees,
    (SELECT COUNT(*) FROM employee_attendance ea WHERE ea.franchise_id = f.id) as attendance_records,
    (SELECT COUNT(*) FROM employee_tasks et WHERE et.franchise_id = f.id) as tasks,
    (SELECT COUNT(*) FROM orders o WHERE o.franchise_id = f.id) as orders,
    (SELECT COUNT(*) FROM customers c WHERE c.franchise_id = f.id) as customers
FROM franchises f
ORDER BY f.franchise_id;

COMMIT;

-- ========================================
-- EXPECTED RESULTS
-- ========================================

-- ✅ Tests 3 and 5 should return 0 rows (no cross-franchise leakage)
-- ✅ Tests 6 and 7 should return 0 rows (no duplicates)
-- ✅ Tests 8 and 9 should return 0 rows (no orphaned records)
-- ✅ All other tests should return data showing proper isolation

-- ========================================
-- TROUBLESHOOTING
-- ========================================

-- If any critical tests fail:
-- 1. Check the specific test output
-- 2. Review the data that caused the failure
-- 3. Fix the data or schema issue
-- 4. Re-run this verification script

-- For support, contact: admin@fabzclean.com
