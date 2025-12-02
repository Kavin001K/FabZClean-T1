-- Reset admin password to 'admin123'
UPDATE auth_employees
SET password_hash = '$2b$10$JObJUBUESMdzkQ3plpXBteSCrmThGZ4nN2hlwDsLeZyz2BnXAsR/q'
WHERE username = 'admin';
