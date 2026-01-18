-- ==========================================
-- FABZCLEAN POSTGRESQL INITIALIZATION
-- Run automatically on first Docker startup
-- ==========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create application user with limited privileges (optional)
-- DO $$
-- BEGIN
--     IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'fabzclean_app') THEN
--         CREATE ROLE fabzclean_app WITH LOGIN PASSWORD 'app_password';
--     END IF;
-- END
-- $$;

-- Set timezone
SET timezone = 'Asia/Kolkata';

-- Log successful initialization
DO $$
BEGIN
    RAISE NOTICE 'FabZClean PostgreSQL initialized successfully at %', NOW();
END
$$;
