/**
 * Seed script for populating the Supabase `products` table.
 *
 * Usage:
 *   1. Copy `.env.local` values into this file (or export them)
 *   2. Run: npx tsx scripts/seed-products.ts
 *
 * This only needs to be run once.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Manually parse .env.local since tsx doesn't load it by default
try {
  const envPath = resolve(process.cwd(), '.env.local');
  const envContent = readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach((line) => {
    const [key, ...values] = line.split('=');
    if (key && values.length > 0) {
      process.env[key.trim()] = values.join('=').trim();
    }
  });
} catch (e) {
  // Ignore if file doesn't exist
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_URL.startsWith('http')) {
  console.error('❌ Error: VITE_SUPABASE_URL is missing or invalid in .env.local');
  console.error('Make sure you have updated .env.local with your real Supabase project URL.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const products = [
  // ── Snacks ───────────────────────────────────────
  {
    name: 'Classic Salted Chips',
    description: 'Crispy, golden potato chips with the perfect amount of salt',
    price: 30,
    category: 'Snacks',
    image_url: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&q=80',
    stock: 50,
  },
  {
    name: 'Roasted Peanuts',
    description: 'Crunchy masala roasted peanuts, a perfect evening snack',
    price: 45,
    category: 'Snacks',
    image_url: 'https://images.unsplash.com/photo-1582284540020-8acbe03f4924?w=400&q=80',
    stock: 40,
  },
  {
    name: 'Dark Chocolate Bar',
    description: '70% cocoa premium dark chocolate, rich and smooth',
    price: 120,
    category: 'Snacks',
    image_url: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=400&q=80',
    stock: 30,
  },
  {
    name: 'Butter Cookies',
    description: 'Crispy Danish-style butter cookies in a tin',
    price: 199,
    category: 'Snacks',
    image_url: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&q=80',
    stock: 25,
  },
  {
    name: 'Mixed Nuts Trail Mix',
    description: 'Almonds, cashews, raisins, and dried cranberries',
    price: 250,
    category: 'Snacks',
    image_url: 'https://images.unsplash.com/photo-1599599810694-b5b37304c041?w=400&q=80',
    stock: 35,
  },

  // ── Dairy ───────────────────────────────────────
  {
    name: 'Fresh Whole Milk (1L)',
    description: 'Farm-fresh pasteurized whole milk, rich in calcium',
    price: 65,
    category: 'Dairy',
    image_url: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&q=80',
    stock: 60,
  },
  {
    name: 'Greek Yogurt (400g)',
    description: 'Thick, creamy Greek yogurt with live cultures',
    price: 80,
    category: 'Dairy',
    image_url: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&q=80',
    stock: 45,
  },
  {
    name: 'Cheddar Cheese Block',
    description: 'Aged cheddar cheese, perfect for sandwiches and cooking',
    price: 180,
    category: 'Dairy',
    image_url: 'https://images.unsplash.com/photo-1618164436241-4473940d1f5c?w=400&q=80',
    stock: 20,
  },
  {
    name: 'Salted Butter (500g)',
    description: 'Premium salted butter, made from fresh cream',
    price: 270,
    category: 'Dairy',
    image_url: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400&q=80',
    stock: 30,
  },
  {
    name: 'Paneer (200g)',
    description: 'Fresh cottage cheese, ideal for curries and snacks',
    price: 90,
    category: 'Dairy',
    image_url: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&q=80',
    stock: 40,
  },

  // ── Vegetables ────────────────────────────────────
  {
    name: 'Fresh Tomatoes (500g)',
    description: 'Vine-ripened red tomatoes, juicy and flavourful',
    price: 25,
    category: 'Vegetables',
    image_url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&q=80',
    stock: 100,
  },
  {
    name: 'Organic Spinach Bunch',
    description: 'Fresh organic baby spinach leaves, washed and ready',
    price: 35,
    category: 'Vegetables',
    image_url: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&q=80',
    stock: 50,
  },
  {
    name: 'Onions (1kg)',
    description: 'Premium quality onions, a kitchen essential',
    price: 40,
    category: 'Vegetables',
    image_url: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=400&q=80',
    stock: 80,
  },
  {
    name: 'Green Capsicum (250g)',
    description: 'Crunchy green bell peppers, great in salads and stir-fries',
    price: 30,
    category: 'Vegetables',
    image_url: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=400&q=80',
    stock: 60,
  },
  {
    name: 'Fresh Potatoes (1kg)',
    description: 'Versatile potatoes, ideal for curries, fries, and more',
    price: 35,
    category: 'Vegetables',
    image_url: 'https://images.unsplash.com/photo-1518977676601-b28d2a90b5a7?w=400&q=80',
    stock: 90,
  },
];

async function seed() {
  console.log('🌱 Seeding products...');

  const { data, error } = await supabase.from('products').insert(products).select();

  if (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }

  console.log(`✅ Successfully seeded ${data.length} products!`);
}

seed();
