ALTER TABLE customers ADD COLUMN IF NOT EXISTS credit_balance DECIMAL(10, 2) DEFAULT 0;

DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_payment_status_check') THEN 
        ALTER TABLE orders DROP CONSTRAINT orders_payment_status_check; 
    END IF; 
END $$;

ALTER TABLE orders ADD CONSTRAINT orders_payment_status_check CHECK (payment_status IN ('pending', 'paid', 'failed', 'credit'));
