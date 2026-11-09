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

// Ephemeral in-memory session key for server-side cart isolation (never stores PII in browser)
let memorySessionKey = '';

export function getSecureCartSessionKey(userId?: string | null): string {
  if (userId) return `usr_${userId}`;
  if (!memorySessionKey) {
    memorySessionKey = `ses_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  }
  return memorySessionKey;
}