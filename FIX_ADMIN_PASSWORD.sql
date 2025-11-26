-- Update admin password to 'admin123'
UPDATE public.auth_employees
SET password_hash = '$2b$10$SjdH3l5yG.cjnRyWv.SXKO7FBe3qGmv3sREQMUijuFzZ45wSH6tpu'
WHERE username = 'admin';

-- Ensure admin is active
UPDATE public.auth_employees
SET is_active = true
WHERE username = 'admin';
