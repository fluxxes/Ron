// Copyright (c) 2026 (RON). Developed by (fluxes) All rights reserved.

import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sypdctilzuljuvqldjyp.supabase.co';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'sb_publishable_4d2ToWU27js6MeRvkjNVqw_e1Or1Y1c';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

let fallbackMemorySessionKey = '';

/**
 * Generates or retrieves an anonymous opaque session token so server-side carts
 * in `public.cart_items` survive page reloads without storing any customer PII or cart data locally.
 */
export function getSecureCartSessionKey(userId?: string | null): string {
  if (userId) return `usr_${userId}`;

  if (typeof window !== 'undefined') {
    try {
      let existing = window.sessionStorage.getItem('ron_cart_session_token');
      if (!existing) {
        existing = `ses_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
        window.sessionStorage.setItem('ron_cart_session_token', existing);
      }
      return existing;
    } catch {
      // Fallback if sessionStorage is restricted
    }
  }

  if (!fallbackMemorySessionKey) {
    fallbackMemorySessionKey = `ses_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  }
  return fallbackMemorySessionKey;
}