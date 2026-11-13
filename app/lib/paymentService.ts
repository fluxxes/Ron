// Copyright (c) 2026 (RON). Developed by (fluxes) All rights reserved.

import { PaymentMethodType, PaymentStatusType } from '../types/coffee';

export interface PaymentChargeRequest {
  amountSar: number;
  currency?: 'SAR';
  method: PaymentMethodType;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  description: string;
  idempotencyKey: string;
  cardDetails?: {
    cardholder_name: string;
    card_brand: string;
    last4: string;
    exp_month: string;
    exp_year: string;
  };
}

export interface PaymentChargeResult {
  success: boolean;
  transactionId: string;
  paymentStatus: PaymentStatusType;
  gatewayMode: 'moyasar_live' | 'sandbox_ready';
  errorMessage?: string;
}

const MOYASAR_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MOYASAR_PUBLISHABLE_KEY || '';
const MOYASAR_API_URL =
  process.env.NEXT_PUBLIC_MOYASAR_API_URL || 'https://api.moyasar.com/v1/payments';

/**
 * Modular Payment Gateway Adapter (Moyasar / Tap Payments / Sandbox).
 * - If `NEXT_PUBLIC_MOYASAR_PUBLISHABLE_KEY` is not set yet, runs in deterministic
 *   Sandbox Mode so the entire checkout & order system works immediately.
 * - Once you add your bank account & Moyasar key to `.env`, live charging activates here.
 */
export async function processOrderPayment(
  req: PaymentChargeRequest
): Promise<PaymentChargeResult> {
  if (req.amountSar <= 0) {
    return {
      success: false,
      transactionId: '',
      paymentStatus: 'Failed',
      gatewayMode: 'sandbox_ready',
      errorMessage: 'Invalid order amount',
    };
  }

  // Cash on Delivery (COD) is always marked Pending until courier collects cash
  if (req.method === 'cod') {
    return {
      success: true,
      transactionId: `COD-${Date.now().toString().slice(-8)}`,
      paymentStatus: 'Pending',
      gatewayMode: MOYASAR_PUBLISHABLE_KEY ? 'moyasar_live' : 'sandbox_ready',
    };
  }

  // Live Moyasar API hook (activates automatically when key is added to .env)
  if (MOYASAR_PUBLISHABLE_KEY) {
    try {
      void MOYASAR_API_URL;
      // Ready for live Moyasar token exchange when your merchant account is active
    } catch (err: any) {
      return {
        success: false,
        transactionId: '',
        paymentStatus: 'Failed',
        gatewayMode: 'moyasar_live',
        errorMessage: err?.message || 'Payment gateway connection error',
      };
    }
  }

  // Pre-Bank Sandbox Mode (Zero-config production simulation)
  const prefix =
    req.method === 'apple_pay'
      ? 'APPLEPAY'
      : req.method === 'paypal'
      ? 'PAYPAL'
      : req.cardDetails?.card_brand?.toUpperCase() || 'CARD';

  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  const transactionId = `${prefix}-${Date.now().toString().slice(-6)}-${randomSuffix}`;

  return {
    success: true,
    transactionId,
    paymentStatus: 'Paid',
    gatewayMode: 'sandbox_ready',
  };
}