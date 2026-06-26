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
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  total_amount: number;
  status: 'pending' | 'processing' | 'delivered' | 'cancelled';
  cart_items: CartItem[];
  payment_method?: 'upi' | 'card' | 'cod' | null;
  created_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
