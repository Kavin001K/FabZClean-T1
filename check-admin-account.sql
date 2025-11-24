-- Check if the default admin account exists
SELECT employee_id, username, role, is_active, created_at
FROM auth_employees
WHERE username = 'admin';

-- If no results, the admin account needs to be created
-- If it exists, we need to check the password hash
