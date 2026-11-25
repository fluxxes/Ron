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

export interface WeightOptionConfig {
  key: string;
  label_en: string;
  label_ar: string;
  multiplier: number;
  enabled: boolean;
}

export interface GrindOptionConfig {
  key: string;
  label_en: string;
  label_ar: string;
  extra_price: number;
  enabled: boolean;
}

export interface BrewGuideItem {
  id: string;
  method: string;
  method_ar: string;
  ratio: string;
  ratio_ar: string;
  grind: string;
  grind_ar: string;
  time: string;
  time_ar: string;
  steps: string[];
  steps_ar: string[];
}

export interface SiteThemeConfig {
  brand_logo_text: string;
  brand_logo_sub: string;
  bg_color: string;
  primary_dark: string;
  accent_gold: string;
  card_bg: string;
}

export interface SiteContentConfig {
  announcement_ar: string;
  announcement_en: string;
  contact_email: string;
  contact_phone: string;
  whatsapp_number: string;
  instagram_url: string;
  banner_cta_link: string;
}

export interface CodConfig {
  max_order_amount: number;
  require_phone_validation: boolean;
  allow_mada_on_delivery: boolean;
  require_confirmation_checkbox: boolean;
  instructions_ar: string;
  instructions_en: string;
}

export interface SiteFeatureFlags {
  show_announcement_bar: boolean;
  show_roast_filters: boolean;
  show_search_bar: boolean;
  show_category_filters: boolean;
  show_roastery_banner: boolean;
  show_brew_guides: boolean;
  show_track_order: boolean;
  show_customer_accounts: boolean;
  show_footer: boolean;
  enable_cod: boolean;
  enable_card: boolean;
  enable_paypal: boolean;
  enable_apple_pay: boolean;
  enable_smsa: boolean;
  enable_saudi_post: boolean;
}

export interface SitePricingConfig {
  free_shipping_threshold: number;
  standard_shipping_cost: number;
  express_shipping_cost: number;
  cod_fee: number;
}

export interface SiteSettings {
  id: string;
  features: SiteFeatureFlags;
  pricing: SitePricingConfig;
  theme: SiteThemeConfig;
  content: SiteContentConfig;
  cod_config: CodConfig;
  weight_options: WeightOptionConfig[];
  grind_options: GrindOptionConfig[];
  brew_guides: BrewGuideItem[];
  translations_ar: Record<string, string>;
  translations_en: Record<string, string>;
  updated_at?: string;
}

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