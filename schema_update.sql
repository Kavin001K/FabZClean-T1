-- =====================================================================
-- SCHEMA UPDATES FOR WALLET AND CREDIT ENGINE
-- =====================================================================

CREATE TABLE IF NOT EXISTS "wallets" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "customer_id" varchar NOT NULL UNIQUE REFERENCES "customers"("id") ON DELETE CASCADE,
  "balance" numeric(10, 2) NOT NULL DEFAULT '0',
  "status" text DEFAULT 'active',
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "wallet_transactions" (
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

CREATE TABLE IF NOT EXISTS "credit_accounts" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "customer_id" varchar NOT NULL UNIQUE REFERENCES "customers"("id") ON DELETE CASCADE,
  "total_credit" numeric(10, 2) NOT NULL DEFAULT '0',
  "credit_limit" numeric(10, 2) NOT NULL DEFAULT '500',
  "status" text DEFAULT 'active',
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "credit_ledger" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "transaction_id" varchar NOT NULL UNIQUE,
  "customer_id" varchar NOT NULL REFERENCES "customers"("id") ON DELETE CASCADE,
  "order_id" varchar REFERENCES "orders"("id") ON DELETE SET NULL,
  "type" text NOT NULL CHECK ("type" IN ('credit', 'debit')),
  "amount" numeric(10, 2) NOT NULL,
  "balance_after" numeric(10, 2) NOT NULL,
  "created_at" timestamp with time zone DEFAULT now()
);

ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "wallet_used" numeric(10, 2) DEFAULT '0';
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "credit_used" numeric(10, 2) DEFAULT '0';

ALTER TABLE "wallets" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access" ON "wallets" FOR ALL USING (true);

ALTER TABLE "wallet_transactions" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access" ON "wallet_transactions" FOR ALL USING (true);

ALTER TABLE "credit_accounts" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access" ON "credit_accounts" FOR ALL USING (true);

ALTER TABLE "credit_ledger" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access" ON "credit_ledger" FOR ALL USING (true);
