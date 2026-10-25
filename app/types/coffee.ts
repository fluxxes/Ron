export interface Product {
  id: string;
  name: string;
  origin: string;
  region: string;
  process: string;
  altitude: string;
  flavor_notes: string[];
  roast_level: 'Light' | 'Medium' | 'Dark';
  description: string;
  price: number;
  stock_quantity: number;
  image: string;
  weight_options: string[];
  grind_options: string[];
  bestseller?: boolean;
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  image: string;
  selectedWeight: string;
  selectedGrind: string;
  quantity: number;
}

export interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  address: string;
  city: string;
  postal_code: string;
  total_amount: number;
  status: 'Processing' | 'Roasted & Packed' | 'Shipped' | 'Completed' | 'Cancelled';
  items: CartItem[];
  created_at: string;
}