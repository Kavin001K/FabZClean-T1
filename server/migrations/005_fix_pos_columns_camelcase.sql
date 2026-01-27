-- Add missing columns in CamelCase to match existing DB structure
ALTER TABLE orders ADD COLUMN garmentCount INTEGER DEFAULT 0;
ALTER TABLE orders ADD COLUMN rackLocation TEXT;
ALTER TABLE orders ADD COLUMN handoverOtp TEXT;
ALTER TABLE orders ADD COLUMN itemVerificationStatus TEXT DEFAULT 'unverified';
ALTER TABLE orders ADD COLUMN orderNotes TEXT;
ALTER TABLE orders ADD COLUMN customerInstructions TEXT;
ALTER TABLE orders ADD COLUMN photoUrls TEXT;
ALTER TABLE orders ADD COLUMN amountPaid TEXT DEFAULT '0.00';
ALTER TABLE orders ADD COLUMN lastPaymentMethod TEXT;
