-- =====================================================================
-- FINAL FRESH START FOR WALLET & CREDIT TABLES
-- (Drops old corrupted tables + triggers and starts fresh)
-- =====================================================================

-- 1. Drop the corrupted tables and their rogue triggers
DROP TABLE IF EXISTS "wallet_transactions" CASCADE;
DROP TABLE IF EXISTS "credit_ledger" CASCADE;
DROP TABLE IF EXISTS "credit_accounts" CASCADE;
DROP TABLE IF EXISTS "wallets" CASCADE;

-- 2. Recreate them cleanly
CREATE TABLE "wallets" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "customer_id" varchar NOT NULL UNIQUE REFERENCES "customers"("id") ON DELETE CASCADE,
  "balance" numeric(10, 2) NOT NULL DEFAULT '0',
  "status" text DEFAULT 'active',
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE "wallet_transactions" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "transaction_id" varchar NOT NULL UNIQUE,
  "customer_id" varchar NOT NULL REFERENCES "customers"("id") ON DELETE CASCADE,
  "type" text NOT NULL CHECK ("type" IN ('credit', 'debit')),
  "amount" numeric(10, 2) NOT NULL,
  "balance_before" numeric(10, 2) NOT NULL,
  "balance_after" numeric(10, 2) NOT NULL,
  "reference_order_id" varchar REFERENCES "orders"("id") ON DELETE SET NULL,
  "verified_by_staff" varchar REFERENCES "employees"("id") ON DELETE SET NULL,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE "credit_accounts" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "customer_id" varchar NOT NULL UNIQUE REFERENCES "customers"("id") ON DELETE CASCADE,
  "total_credit" numeric(10, 2) NOT NULL DEFAULT '0',
  "credit_limit" numeric(10, 2) NOT NULL DEFAULT '500',
  "status" text DEFAULT 'active',
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE "credit_ledger" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "transaction_id" varchar NOT NULL UNIQUE,
  "customer_id" varchar NOT NULL REFERENCES "customers"("id") ON DELETE CASCADE,
  "order_id" varchar REFERENCES "orders"("id") ON DELETE SET NULL,
  "type" text NOT NULL CHECK ("type" IN ('credit', 'debit')),
  "amount" numeric(10, 2) NOT NULL,
  "balance_after" numeric(10, 2) NOT NULL,
  "created_at" timestamp with time zone DEFAULT now()
);

-- Note: The orders table already has the safe columns from previous fixes.

ALTER TABLE "wallets" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access" ON "wallets" FOR ALL USING (true);

ALTER TABLE "wallet_transactions" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access" ON "wallet_transactions" FOR ALL USING (true);

ALTER TABLE "credit_accounts" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access" ON "credit_accounts" FOR ALL USING (true);

ALTER TABLE "credit_ledger" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access" ON "credit_ledger" FOR ALL USING (true);
