export interface Product {
  id: string;
  name: string;
  origin: string;
  region: string;
  process: string;
  altitude: string;
  flavorNotes: string[];
  roastLevel: 'Light' | 'Medium' | 'Dark';
  description: string;
  price: number;
  image: string;
  weightOptions: string[];
  grindOptions: string[];
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