-- ============================================================================
-- SwiftCart: Comprehensive Product Catalog Seed
-- Run this in your Supabase SQL Editor
-- 
-- This UPSERTS product data with a curated, realistic catalog
-- featuring proper images, descriptions, categories, stock, and SKUs.
-- ============================================================================

-- Insert full catalog, updating existing SKUs
INSERT INTO products (name, description, price, category, stock, sku, image_url) VALUES

-- ── Fruits & Vegetables ─────────────────────────────────────────────────────
('Organic Bananas (1 Dozen)',   'Farm-fresh organic bananas, naturally ripened',                  49,  'Fruits & Vegetables', 120, 'FRU-BAN-001', 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&h=400&fit=crop'),
('Red Onions (1kg)',            'Premium quality red onions, handpicked',                         35,  'Fruits & Vegetables',   0, 'VEG-ONI-001', 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=400&h=400&fit=crop'),
('Fresh Potatoes (1kg)',        'Versatile potatoes, ideal for curries and fries',                35,  'Fruits & Vegetables',  85, 'VEG-POT-001', 'https://images.unsplash.com/photo-1518977676601-b53f82ber4f7?w=400&h=400&fit=crop'),
('Green Capsicum (250g)',       'Crunchy green bell peppers, great for stir-fry',                 30,  'Fruits & Vegetables',  42, 'VEG-CAP-001', 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=400&h=400&fit=crop'),
('Fresh Tomatoes (500g)',       'Vine-ripened red tomatoes, juicy and flavourful',                25,  'Fruits & Vegetables',  60, 'VEG-TOM-001', '/products/fresh_tomatoes.png'),
('Organic Spinach Bunch',       'Fresh organic baby spinach leaves',                              35,  'Fruits & Vegetables',   7, 'VEG-SPN-001', 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&h=400&fit=crop'),
('Royal Gala Apples (4 pcs)',   'Sweet and crunchy imported apples',                             149,  'Fruits & Vegetables',  35, 'FRU-APL-001', 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&h=400&fit=crop'),
('Fresh Lemons (6 pcs)',        'Zesty and juicy, perfect for drinks and cooking',                30,  'Fruits & Vegetables',  90, 'FRU-LEM-001', 'https://images.unsplash.com/photo-1590502593747-42a996133562?w=400&h=400&fit=crop'),

-- ── Dairy ───────────────────────────────────────────────────────────────────
('Amul Toned Milk (1L)',        'Pasteurized toned milk, fresh daily',                            62,  'Dairy',  80, 'DAI-MLK-001', '/products/amul_milk.png'),
('Paneer (200g)',               'Fresh cottage cheese, ideal for curries and snacks',              90,  'Dairy',  45, 'DAI-PAN-001', '/products/paneer.png'),
('Salted Butter (500g)',        'Premium salted butter, made from fresh cream',                   270,  'Dairy',  30, 'DAI-BUT-001', 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400&h=400&fit=crop'),
('Greek Yogurt (400g)',         'Thick creamy Greek yogurt with live cultures',                    80,  'Dairy',  55, 'DAI-YOG-001', '/products/greek_yogurt.png'),
('Cheddar Cheese Block',        'Aged cheddar cheese, perfect for sandwiches',                   180,  'Dairy',   5, 'DAI-CHE-001', 'https://images.unsplash.com/photo-1618164436241-4473940d1f5c?w=400&h=400&fit=crop'),
('Fresh Whole Milk (1L)',       'Farm-fresh pasteurized whole milk',                               65,  'Dairy',  70, 'DAI-WHL-001', 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&h=400&fit=crop'),

-- ── Snacks ──────────────────────────────────────────────────────────────────
('Mixed Nuts Trail Mix',        'Almonds, cashews, raisins, and dried cranberries',              250,  'Snacks',  40, 'SNK-NUT-001', '/products/trail_mix.png'),
('Dark Chocolate Bar',          '70% cocoa premium dark chocolate',                              120,  'Snacks',  65, 'SNK-CHO-001', 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=400&h=400&fit=crop'),
('Classic Salted Chips',        'Crispy golden potato chips with Himalayan salt',                  30,  'Snacks',  95, 'SNK-CHP-001', 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&h=400&fit=crop'),
('Roasted Peanuts',             'Crunchy masala roasted peanuts, a perfect snack',                 45,  'Snacks', 110, 'SNK-PNT-001', '/products/roasted_peanuts.png'),
('Butter Cookies',              'Crispy Danish-style butter cookies in a tin',                    199,  'Snacks',  25, 'SNK-COK-001', 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&h=400&fit=crop'),
('Maggi Noodles (12-Pack)',     'Family pack instant noodles, ready in 2 minutes',               168,  'Snacks',   5, 'SNK-MAG-001', 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=400&h=400&fit=crop'),

-- ── Bakery ──────────────────────────────────────────────────────────────────
('Whole Wheat Bread',           'Freshly baked whole wheat loaf, no preservatives',                45,  'Bakery',  35, 'BAK-WHT-001', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=400&fit=crop'),
('Chocolate Croissants (4 pcs)','Flaky buttery croissants with chocolate filling',               180,  'Bakery',  20, 'BAK-CRO-001', '/products/chocolate_croissants.png'),
('Multigrain Buns (6 pcs)',     'Soft multigrain burger buns, freshly baked',                      80,  'Bakery',   8, 'BAK-BUN-001', 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=400&h=400&fit=crop'),
('Garlic Breadsticks',          'Crispy herb garlic breadsticks, oven-baked',                      95,  'Bakery',  40, 'BAK-GAR-001', 'https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?w=400&h=400&fit=crop'),

-- ── Beverages ───────────────────────────────────────────────────────────────
('Tata Tea Gold (500g)',        'Premium CTC leaf tea with rich aroma',                          280,  'Beverages',  15, 'BEV-TEA-001', 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=400&fit=crop'),
('Filter Coffee Powder (250g)', 'South Indian filter coffee blend',                              195,  'Beverages',  28, 'BEV-COF-001', '/products/filter_coffee_powder.png'),
('Fresh Orange Juice (1L)',     'Cold-pressed orange juice, no added sugar',                     120,  'Beverages',  50, 'BEV-OJU-001', 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&h=400&fit=crop'),
('Coconut Water (6-Pack)',      'Natural tender coconut water, refreshing',                      210,  'Beverages',  35, 'BEV-COC-001', '/products/coconut_water.png'),

-- ── Staples ─────────────────────────────────────────────────────────────────
('Basmati Rice (5kg)',          'Premium aged basmati rice, extra long grain',                    420,  'Staples',  25, 'STA-RIC-001', 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=400&fit=crop'),
('Toor Dal (1kg)',              'Unpolished split pigeon peas, high protein',                     130,  'Staples',  60, 'STA-DAL-001', '/products/toor_dal.png'),
('Whole Wheat Atta (5kg)',      'Stone-ground whole wheat flour for rotis',                       260,  'Staples',  40, 'STA-ATT-001', 'https://images.unsplash.com/photo-1714842981153-ffeaf74e7a1a?w=400&h=400&fit=crop'),
('Refined Sugar (1kg)',         'Fine grain white sugar for everyday use',                         48,  'Staples',   3, 'STA-SUG-001', 'https://images.unsplash.com/photo-1769259362622-e8d3a13dc7ec?w=400&h=400&fit=crop'),

-- ── Household ───────────────────────────────────────────────────────────────
('Surf Excel Liquid (1L)',      'Front load washing machine liquid detergent',                    299,  'Household',  45, 'HOU-SUR-001', '/products/surf_excel.png'),
('Kitchen Paper Towels (2 rolls)','Extra absorbent premium paper towels',                        150,  'Household',  70, 'HOU-TOW-001', '/products/paper_towels.png'),
('Dish Wash Liquid (500ml)',    'Lemon-scented antibacterial dish soap',                          89,  'Household',  55, 'HOU-DIS-001', '/products/dish_wash.png'),

-- ── Personal Care ───────────────────────────────────────────────────────────
('Colgate MaxFresh (150g)',     'Cooling crystals toothpaste for fresh breath',                    95,  'Personal Care', 60, 'PER-COL-001', '/products/colgate_maxfresh.png'),
('Dove Body Wash (250ml)',      'Moisturizing body wash with shea butter',                       199,  'Personal Care', 40, 'PER-DOV-001', '/products/dove_body_wash.png'),
('Hand Sanitizer (200ml)',      '70% alcohol instant hand sanitizer',                              79,  'Personal Care',  0, 'PER-SAN-001', '/products/hand_sanitizer.png')

ON CONFLICT (sku) 
DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  category = EXCLUDED.category,
  stock = EXCLUDED.stock,
  image_url = EXCLUDED.image_url;