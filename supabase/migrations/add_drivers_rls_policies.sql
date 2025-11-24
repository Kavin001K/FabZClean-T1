-- ================================================
-- Add RLS Policies for Drivers Table
-- This fixes the 400 Bad Request error when fetching drivers
-- ================================================

-- RLS Policies for drivers table
-- Allow authenticated users to view all drivers
CREATE POLICY "Authenticated users can view drivers" ON drivers
  FOR SELECT TO authenticated USING (true);

-- Allow staff to manage drivers
CREATE POLICY "Staff can manage drivers" ON drivers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'employee', 'franchise_manager')
    )
  );

-- Allow drivers to update their own status and location
CREATE POLICY "Drivers can update their own data" ON drivers
  FOR UPDATE USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'employee', 'franchise_manager')
    )
  );
