-- ============================================================================
-- Analytics Dashboard: Inventory & Products Schema
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- 1. Create the products table if it doesn't already exist
-- This table powers the Inventory Management section of the Analytics Dashboard.
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric NOT NULL DEFAULT 0,
  category text NOT NULL DEFAULT 'general',
  image_url text,
  stock integer NOT NULL DEFAULT 0,
  sku text UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- 1b. Backfill: add the sku column if the table already existed without it
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku text UNIQUE;

-- 2. Enable Row-Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- 3. Anyone can view products (storefront)
CREATE POLICY "Anyone can view products"
ON products FOR SELECT
TO public
USING (true);

-- 4. Only admins can update products (inventory reconciliation)
CREATE POLICY "Admins can update products"
ON products FOR UPDATE
TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- 5. Only admins can insert products
CREATE POLICY "Admins can insert products"
ON products FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- 6. Seed some sample products (optional — remove for production)
INSERT INTO products (name, description, price, category, stock, sku) VALUES
  ('Organic Bananas',       'Fresh organic bananas, 1 dozen',              49.00,  'fruits',      120, 'FRU-BAN-001'),
  ('Whole Wheat Bread',     'Freshly baked whole wheat loaf',              45.00,  'bakery',       35, 'BAK-WHT-001'),
  ('Amul Toned Milk 1L',   'Pasteurized toned milk',                      62.00,  'dairy',        80, 'DAI-MLK-001'),
  ('Basmati Rice 5kg',     'Premium aged basmati rice',                   420.00,  'staples',      25, 'STA-RIC-001'),
  ('Red Onions 1kg',       'Farm-fresh red onions',                        35.00,  'vegetables',    0, 'VEG-ONI-001'),
  ('Tomato Ketchup 500g',  'Kissan tomato ketchup',                       110.00, 'condiments',    8, 'CON-KET-001'),
  ('Surf Excel Liquid 1L', 'Front load washing liquid',                   299.00, 'household',    45, 'HOU-SUR-001'),
  ('Colgate MaxFresh',     'Cooling crystals toothpaste 150g',             95.00, 'personal_care', 60, 'PER-COL-001'),
  ('Maggi Noodles 12-Pack','Family pack instant noodles',                 168.00, 'snacks',         5, 'SNK-MAG-001'),
  ('Tata Tea Gold 500g',   'Premium CTC leaf tea',                        280.00, 'beverages',    15, 'BEV-TEA-001')
ON CONFLICT (sku) DO NOTHING;
