-- ================================================
-- DOCUMENTS TABLE MIGRATION
-- Run this in your Supabase SQL Editor
-- ================================================

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL DEFAULT 'invoice' CHECK (type IN ('invoice', 'receipt', 'report', 'label', 'other')),
  title TEXT NOT NULL,
  filename TEXT NOT NULL,
  filepath TEXT NOT NULL,
  file_url TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  amount DECIMAL(10, 2),
  customer_name TEXT,
  order_number TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_order_number ON documents(order_number);
CREATE INDEX IF NOT EXISTS idx_documents_customer_name ON documents(customer_name);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER documents_updated_at_trigger
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_documents_updated_at();

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL ON documents TO authenticated;
-- GRANT ALL ON documents TO service_role;

-- Verify table creation
SELECT 'Documents table created successfully!' AS status;
SELECT COUNT(*) AS document_count FROM documents;
