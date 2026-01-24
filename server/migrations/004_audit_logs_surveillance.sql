-- Migration: Audit Logs Surveillance Upgrade
-- Description: Adds delta capture columns for immutable change tracking
-- Version: 004

-- Add oldValue and newValue columns for delta capture
ALTER TABLE audit_logs ADD COLUMN oldValue TEXT;
ALTER TABLE audit_logs ADD COLUMN newValue TEXT;

-- Add severity level for filtering high-risk actions
ALTER TABLE audit_logs ADD COLUMN severity TEXT DEFAULT 'info';

-- Add category for action grouping (financial, logistics, security, lifecycle)
ALTER TABLE audit_logs ADD COLUMN category TEXT;

-- Add session fingerprint fields (may already exist, so use IF NOT EXISTS pattern)
-- Note: SQLite doesn't support IF NOT EXISTS for ALTER TABLE, so these may error if already present
-- ALTER TABLE audit_logs ADD COLUMN userAgent TEXT; -- Already exists
-- ALTER TABLE audit_logs ADD COLUMN ipAddress TEXT; -- Already exists

-- Create index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_category ON audit_logs(category);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(createdAt);
CREATE INDEX IF NOT EXISTS idx_audit_logs_franchise_id ON audit_logs(franchiseId);
CREATE INDEX IF NOT EXISTS idx_audit_logs_employee_id ON audit_logs(employeeId);

-- Create composite index for cursor-based pagination
CREATE INDEX IF NOT EXISTS idx_audit_logs_cursor ON audit_logs(createdAt DESC, id);
