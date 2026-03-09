-- =====================================================================
-- FORCE ADD MISSING COLUMNS TO NEW TABLES
-- (Run this in Supabase SQL Editor to fix missing column errors)
-- =====================================================================

DO $$ 
BEGIN

    -- Wallet Transactions
    BEGIN ALTER TABLE "wallet_transactions" ADD COLUMN "transaction_id" varchar; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE "wallet_transactions" ADD COLUMN "balance_before" numeric(10, 2) DEFAULT 0; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE "wallet_transactions" ADD COLUMN "balance_after" numeric(10, 2) DEFAULT 0; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE "wallet_transactions" ADD COLUMN "reference_order_id" varchar; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE "wallet_transactions" ADD COLUMN "verified_by_staff" varchar; EXCEPTION WHEN duplicate_column THEN END;

    -- Credit Accounts
    BEGIN ALTER TABLE "credit_accounts" ADD COLUMN "total_credit" numeric(10, 2) DEFAULT 0; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE "credit_accounts" ADD COLUMN "credit_limit" numeric(10, 2) DEFAULT 500; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE "credit_accounts" ADD COLUMN "status" varchar DEFAULT 'active'; EXCEPTION WHEN duplicate_column THEN END;

    -- Credit Ledger
    BEGIN ALTER TABLE "credit_ledger" ADD COLUMN "transaction_id" varchar; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE "credit_ledger" ADD COLUMN "balance_after" numeric(10, 2) DEFAULT 0; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE "credit_ledger" ADD COLUMN "order_id" varchar; EXCEPTION WHEN duplicate_column THEN END;

    -- Orders Table (Ensure these exist too)
    BEGIN ALTER TABLE "orders" ADD COLUMN "wallet_used" numeric(10, 2) DEFAULT 0; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE "orders" ADD COLUMN "credit_used" numeric(10, 2) DEFAULT 0; EXCEPTION WHEN duplicate_column THEN END;

END $$;
