// Copyright (c) 2026 (RON). Developed by (fluxes) All rights reserved.

export type ProductCategory = 'Crops' | 'Boxes' | 'Tools';
export type RoastLevel = 'Light' | 'Medium' | 'Dark';
export type OrderStatus =
  | 'Pending Approval'
  | 'Approved'
  | 'Processing'
  | 'Roasted & Packed'
  | 'Shipped'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Completed'
  | 'Cancelled';
export type PaymentMethodType = 'paypal' | 'apple_pay' | 'card' | 'cod';
export type PaymentStatusType = 'Paid' | 'Pending' | 'Failed' | 'Refunded';
export type CourierProviderType = 'smsa' | 'saudi_post';

export interface Product {
  id: string;
  name: string;
  name_ar?: string;
  category?: ProductCategory;
  origin: string;
  origin_ar?: string;
  region: string;
  region_ar?: string;
  process: string;
  process_ar?: string;
  altitude: string;
  flavor_notes: string[];
  flavor_notes_ar?: string[];
  roast_level: RoastLevel;
  description: string;
  description_ar?: string;
  price: number;
  stock_quantity: number;
  image: string;
  weight_options: string[];
  grind_options: string[];
  bestseller?: boolean;
  created_at?: string;
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  name_ar?: string;
  price: number;
  image: string;
  selectedWeight: string;
  selectedGrind: string;
  quantity: number;
}

export interface OrderStatusHistory {
  status: OrderStatus;
  timestamp: string;
  note?: string;
}

export interface Order {
  id: string;
  order_number?: string;
  idempotency_key?: string;
  user_id?: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  address: string;
  city: string;
  postal_code: string;
  national_address?: string;
  shipping_method?: 'standard' | 'express';
  shipping_cost?: number;
  subtotal?: number;
  total_amount: number;
  payment_method?: PaymentMethodType;
  payment_status?: PaymentStatusType;
  transaction_id?: string;
  status: OrderStatus;
  courier_provider?: CourierProviderType;
  courier_name?: string;
  tracking_number?: string;
  waybill_url?: string;
  auto_fulfilled?: boolean;
  estimated_delivery?: string;
  staff_notes?: string;
  items: CartItem[];
  status_history?: OrderStatusHistory[];
  created_at: string;
  updated_at?: string;
}

export interface TicketMessage {
  id: string;
  sender_role: 'customer' | 'staff';
  sender_name: string;
  body: string;
  created_at: string;
}

export interface SupportTicket {
  id: string;
  ticket_number: string;
  user_id?: string | null;
  order_id?: string | null;
  order_number?: string;
  customer_name: string;
  customer_email: string;
  subject: string;
  category: 'Order Issue' | 'Shipping & Courier' | 'Coffee Quality' | 'Payment & Billing' | 'Other';
  priority: 'Low' | 'Normal' | 'High' | 'Urgent';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  messages: TicketMessage[];
  created_at: string;
  updated_at: string;
}

export interface CustomerProfile {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  vat_number?: string;
  preferred_weight?: string;
  preferred_grind?: string;
  role: 'customer' | 'staff';
  preferred_lang: 'ar' | 'en';
  created_at?: string;
}

export interface CustomerAddress {
  id: string;
  user_id: string;
  label: string;
  recipient_name: string;
  phone: string;
  country: string;
  city: string;
  address_line1: string;
  address_line2?: string;
  postal_code: string;
  national_address?: string;
  is_default_shipping: boolean;
  is_default_billing: boolean;
  created_at?: string;
}

export interface SavedPaymentMethod {
  id: string;
  user_id: string;
  method_type: 'card' | 'paypal';
  card_brand?: string;
  last4?: string;
  exp_month?: string;
  exp_year?: string;
  cardholder_name?: string;
  paypal_email?: string;
  gateway_token: string;
  billing_address_id?: string | null;
  is_default: boolean;
  created_at?: string;
}