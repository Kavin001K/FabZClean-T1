-- ========================================
-- CREATE TWO FRANCHISES WITH COMPLETE DATA
-- Pollachi & Kinathukadavu Stores
-- ========================================

BEGIN;

-- ========================================
-- PART 1: CREATE FRANCHISES
-- ========================================

INSERT INTO franchises (
    id, 
    name, 
    franchise_id, 
    owner_name, 
    email, 
    phone, 
    address, 
    status, 
    created_at, 
    updated_at
) VALUES 
-- Pollachi Franchise
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
-- Kinathukadavu Franchise
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
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    owner_name = EXCLUDED.owner_name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    updated_at = NOW();

-- ========================================
-- PART 2: CREATE EMPLOYEES FOR BOTH FRANCHISES
-- ========================================

-- Admin (Global - assigned to Pollachi)
INSERT INTO employees (
    id, 
    franchise_id, 
    first_name, 
    last_name, 
    role, 
    email, 
    password, 
    employee_id, 
    phone, 
    position, 
    department, 
    hire_date, 
    salary, 
    status
) VALUES 
(
    'admin-user-id',
    'franchise-pollachi',
    'System',
    'Admin',
    'admin',
    'admin@myfabclean.com',
    '$2b$10$A7eMtBNk3B8YkTz9LfVRPOII.W815gVpb8DP2W0He8WNzURAoDSxa', -- Password: Durai@2025
    'myfabclean',
    '9999999999',
    'Administrator',
    'Management',
    NOW(),
    100000.00,
    'active'
)
ON CONFLICT (employee_id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    email = EXCLUDED.email,
    updated_at = NOW();

-- Pollachi Employees
INSERT INTO employees (
    id, 
    franchise_id, 
    first_name, 
    last_name, 
    role, 
    email, 
    password, 
    employee_id, 
    phone, 
    position, 
    department, 
    hire_date, 
    salary, 
    status
) VALUES 
-- Pollachi Manager
(
    gen_random_uuid()::text,
    'franchise-pollachi',
    'Senthil',
    'Kumar',
    'franchise_manager',
    'manager.pollachi@fabzclean.com',
    '$2b$10$A7eMtBNk3B8YkTz9LfVRPOII.W815gVpb8DP2W0He8WNzURAoDSxa', -- Password: Durai@2025
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
    '$2b$10$A7eMtBNk3B8YkTz9LfVRPOII.W815gVpb8DP2W0He8WNzURAoDSxa', -- Password: Durai@2025
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
    '$2b$10$A7eMtBNk3B8YkTz9LfVRPOII.W815gVpb8DP2W0He8WNzURAoDSxa', -- Password: Durai@2025
    'staff-pol',
    '9876543214',
    'Counter Staff',
    'Operations',
    NOW(),
    18000.00,
    'active'
)
ON CONFLICT (employee_id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    email = EXCLUDED.email,
    updated_at = NOW();

-- Kinathukadavu Employees
INSERT INTO employees (
    id, 
    franchise_id, 
    first_name, 
    last_name, 
    role, 
    email, 
    password, 
    employee_id, 
    phone, 
    position, 
    department, 
    hire_date, 
    salary, 
    status
) VALUES 
-- Kinathukadavu Manager
(
    gen_random_uuid()::text,
    'franchise-kinathukadavu',
    'Rajesh',
    'Kannan',
    'franchise_manager',
    'manager.kin@fabzclean.com',
    '$2b$10$A7eMtBNk3B8YkTz9LfVRPOII.W815gVpb8DP2W0He8WNzURAoDSxa', -- Password: Durai@2025
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
    '$2b$10$A7eMtBNk3B8YkTz9LfVRPOII.W815gVpb8DP2W0He8WNzURAoDSxa', -- Password: Durai@2025
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
    '$2b$10$A7eMtBNk3B8YkTz9LfVRPOII.W815gVpb8DP2W0He8WNzURAoDSxa', -- Password: Durai@2025
    'staff-kin',
    '9876543215',
    'Counter Staff',
    'Operations',
    NOW(),
    18000.00,
    'active'
)
ON CONFLICT (employee_id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    email = EXCLUDED.email,
    updated_at = NOW();

COMMIT;

-- ========================================
-- VERIFICATION
-- ========================================

-- Check franchises created
SELECT 
    '✅ FRANCHISES CREATED' as status,
    franchise_id,
    name,
    owner_name,
    phone,
    email
FROM franchises
ORDER BY franchise_id;

-- Check employees by franchise
SELECT 
    '✅ EMPLOYEES BY FRANCHISE' as status,
    f.franchise_id,
    f.name as franchise_name,
    e.employee_id,
    e.first_name || ' ' || e.last_name as employee_name,
    e.role,
    e.position,
    e.status
FROM employees e
JOIN franchises f ON e.franchise_id = f.id
ORDER BY f.franchise_id, e.role, e.employee_id;

-- Summary
SELECT 
    '✅ SUMMARY' as status,
    (SELECT COUNT(*) FROM franchises) as total_franchises,
    (SELECT COUNT(*) FROM employees WHERE status = 'active') as active_employees,
    (SELECT COUNT(*) FROM employees WHERE role = 'admin') as admins,
    (SELECT COUNT(*) FROM employees WHERE role = 'franchise_manager') as managers,
    (SELECT COUNT(*) FROM employees WHERE role = 'driver') as drivers,
    (SELECT COUNT(*) FROM employees WHERE role = 'staff') as staff;

-- ========================================
-- LOGIN CREDENTIALS
-- ========================================

SELECT 
    '🔑 LOGIN CREDENTIALS' as info,
    employee_id as username,
    'Durai@2025' as password,
    role,
    email,
    first_name || ' ' || last_name as full_name
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

-- ✅ 2 Franchises:
--    - FAB-POLLACHI (Pollachi)
--    - FAB-KIN (Kinathukadavu)

-- ✅ 7 Employees:
--    - 1 Admin (myfabclean)
--    - 2 Managers (mgr-pol, mgr-kin)
--    - 2 Drivers (drv-pol, drv-kin)
--    - 2 Staff (staff-pol, staff-kin)

-- ✅ All passwords: Durai@2025
