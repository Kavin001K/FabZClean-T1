-- Update admin account with correct credentials
-- Username: admin@fabclean.com
-- Password: fabZclean

UPDATE auth_employees 
SET 
  username = 'admin@fabclean.com',
  password_hash = '$2b$10$A/jr8XXzU6rg8YPmEBTbjebNBsAgr4tWWX7Zcu5tBKs021dNH.Jgm',
  email = 'admin@fabclean.com'
WHERE employee_id = 'EMP001';

-- Verify the update
SELECT employee_id, username, email, role, is_active, full_name
FROM auth_employees 
WHERE employee_id = 'EMP001';
