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
