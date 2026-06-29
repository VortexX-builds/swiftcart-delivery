export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  image_url: string | null;
  stock: number;
  created_at: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  avatar_url: string | null;
  wallet_balance: number;
  role?: 'customer' | 'admin' | 'manager';
  is_banned?: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Flat snapshot of a cart item as stored in the `orders.cart_items` JSONB column.
 * This is distinct from `CartItem` (which holds a full `Product` object) — the
 * checkout process serialises only the fields needed for order history display.
 */
export interface OrderCartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url: string | null;
}

export interface Order {
  id: string;
  user_id: string;
  total_amount: number;
  status: 'pending' | 'processing' | 'delivered' | 'cancelled';
  cart_items: OrderCartItem[];
  payment_method?: 'upi' | 'card' | 'cod' | null;
  created_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

