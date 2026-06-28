-- Run this in your Supabase SQL Editor

-- 1. Add the role column to the existing profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role text DEFAULT 'customer'::text;

-- Enforce valid roles (optional but recommended)
ALTER TABLE profiles
ADD CONSTRAINT valid_role CHECK (role IN ('customer', 'admin', 'manager'));

-- 2. Assign Admin Role to Specific User
-- NOTE: Replace 'YOUR-USER-UUID-HERE' with the actual user ID from the auth.users table
UPDATE profiles 
SET role = 'admin' 
WHERE id = 'YOUR-USER-UUID-HERE';

-- 3. Setup Row-Level Security (RLS) on orders Table
-- Ensure RLS is enabled on the orders table
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Customer Policy: Users can only SELECT, INSERT, and UPDATE their own orders.
CREATE POLICY "Customers can manage their own orders" 
ON orders 
FOR ALL 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Admin Policy: Admins can SELECT all orders.
CREATE POLICY "Admins can view all orders" 
ON orders 
FOR SELECT 
TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- Admin Policy: Admins can UPDATE all orders.
CREATE POLICY "Admins can update all orders" 
ON orders 
FOR UPDATE 
TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- 4. Setup Global Store Settings Table
CREATE TABLE IF NOT EXISTS store_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  maintenance_mode boolean DEFAULT false,
  tax_rate numeric DEFAULT 0.0,
  support_email text DEFAULT 'support@swiftcart.com'
);

-- Insert a default row if the table is empty
INSERT INTO store_settings (maintenance_mode, tax_rate, support_email)
SELECT false, 18.0, 'support@swiftcart.com'
WHERE NOT EXISTS (SELECT 1 FROM store_settings);

-- Enable RLS
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read store settings
CREATE POLICY "Anyone can view store settings"
ON store_settings FOR SELECT
TO public
USING (true);

-- Only admins can update store settings
CREATE POLICY "Admins can update store settings"
ON store_settings FOR UPDATE
TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);
