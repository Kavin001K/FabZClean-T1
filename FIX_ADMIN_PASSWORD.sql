-- Insert or Update admin user with password 'admin123'
INSERT INTO public.auth_employees (
    username,
    password_hash,
    role,
    is_active,
    full_name
) VALUES (
    'admin',
    '$2b$10$SjdH3l5yG.cjnRyWv.SXKO7FBe3qGmv3sREQMUijuFzZ45wSH6tpu', -- admin123
    'admin',
    true,
    'System Administrator'
)
ON CONFLICT (username) DO UPDATE
SET
    password_hash = EXCLUDED.password_hash,
    is_active = true;
