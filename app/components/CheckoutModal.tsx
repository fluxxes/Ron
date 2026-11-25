// Copyright (c) 2026 (RON). Developed by (fluxes) All rights reserved.
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  CheckCircle2,
  CreditCard,
  Lock,
  Truck,
  MapPin,
  Printer,
  Banknote,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import {
  CartItem,
  CustomerAddress,
  SavedPaymentMethod,
  PaymentMethodType,
  Order,
  CourierProviderType,
} from '../types/coffee';
import { useTranslation } from '../lib/useTranslation';
import { useSiteSettings } from '../lib/siteSettings';
import Link from 'next/link';

export interface CheckoutSubmissionPayload {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  nationalAddress: string;
  shippingMethod: 'standard' | 'express';
  shippingCost: number;
  paymentMethod: PaymentMethodType;
  transactionId: string;
  courierProvider: CourierProviderType;
  idempotencyKey: string;
  saveAddress: boolean;
  saveCard: boolean;
  newCardDetails?: {
    cardholder_name: string;
    card_brand: string;
    last4: string;
    exp_month: string;
    exp_year: string;
  };
}

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  subtotal: number;
  orderComplete: boolean;
  completedOrder?: Order | null;
  savedAddresses?: CustomerAddress[];
  savedPaymentMethods?: SavedPaymentMethod[];
  user?: any;
  onCheckoutSubmit: (payload: CheckoutSubmissionPayload) => Promise<void> | void;
  onResetCheckout: () => void;
  lang?: 'ar' | 'en';
  t: (key: string) => string;
}

export default function CheckoutModal({
  isOpen,
  onClose,
  subtotal,
  orderComplete,
  completedOrder,
  savedAddresses = [],
  savedPaymentMethods = [],
  user,
  onCheckoutSubmit,
  onResetCheckout,
}: CheckoutModalProps) {
  const { lang, t } = useTranslation();
  const { settings } = useSiteSettings();

  const enabledPaymentMethods = useMemo(() => {
    const list: { key: PaymentMethodType; label: string }[] = [];
    if (settings.features.enable_cod) list.push({ key: 'cod', label: t('pay_cod') });
    if (settings.features.enable_card) list.push({ key: 'card', label: t('pay_card') });
    if (settings.features.enable_paypal) list.push({ key: 'paypal', label: t('pay_paypal') });
    if (settings.features.enable_apple_pay) list.push({ key: 'apple_pay', label: t('pay_apple') });
    if (list.length === 0) list.push({ key: 'cod', label: t('pay_cod') });
    return list;
  }, [settings.features, t]);

  const enabledCouriers = useMemo(() => {
    const list: { key: CourierProviderType; label: string; badge: string }[] = [];
    if (settings.features.enable_smsa)
      list.push({ key: 'smsa', label: t('courier_smsa'), badge: 'AWB Auto' });
    if (settings.features.enable_saudi_post)
      list.push({ key: 'saudi_post', label: t('courier_spl'), badge: 'SPL Auto' });
    if (list.length === 0)
      list.push({ key: 'smsa', label: t('courier_smsa'), badge: 'AWB Auto' });
    return list;
  }, [settings.features.enable_smsa, settings.features.enable_saudi_post, t]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: 'الرياض',
    postalCode: '',
    nationalAddress: '',
  });

  const [selectedAddressId, setSelectedAddressId] = useState<string>('new');
  const [saveAddress, setSaveAddress] = useState<boolean>(true);
  const [courierProvider, setCourierProvider] = useState<CourierProviderType>('smsa');
  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express'>('standard');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('cod');
  const [codConfirmed, setCodConfirmed] = useState<boolean>(false);

  const [selectedCardId, setSelectedCardId] = useState<string>('new');
  const [saveCard, setSaveCard] = useState<boolean>(true);
  const [cardForm, setCardForm] = useState({
    holder: '',
    number: '',
    expiry: '',
    cvv: '',
  });
  const [paymentError, setPaymentError] = useState<string>('');
  const [processingPayment, setProcessingPayment] = useState<boolean>(false);

  useEffect(() => {
    if (!enabledPaymentMethods.some(m => m.key === paymentMethod)) {
      setPaymentMethod(enabledPaymentMethods[0].key);
    }
  }, [enabledPaymentMethods, paymentMethod]);

  useEffect(() => {
    if (!enabledCouriers.some(c => c.key === courierProvider)) {
      setCourierProvider(enabledCouriers[0].key);
    }
  }, [enabledCouriers, courierProvider]);

  useEffect(() => {
    if (savedAddresses.length > 0) {
      const def = savedAddresses.find(a => a.is_default_shipping) || savedAddresses[0];
      setSelectedAddressId(def.id);
      setFormData({
        name: def.recipient_name,
        email: user?.email || '',
        phone: def.phone,
        address: def.address_line1,
        city: def.city,
        postalCode: def.postal_code,
        nationalAddress: def.national_address || '',
      });
    } else if (user?.email) {
      setFormData(prev => ({ ...prev, email: user.email }));
    }
  }, [savedAddresses, user]);

  useEffect(() => {
    const cards = savedPaymentMethods.filter(p => p.method_type === 'card');
    if (cards.length > 0) {
      setSelectedCardId(cards[0].id);
    } else {
      setSelectedCardId('new');
    }
  }, [savedPaymentMethods]);

  if (!isOpen) return null;

  const freeThreshold = Number(settings.pricing.free_shipping_threshold ?? 200);
  const stdShipCost = Number(settings.pricing.standard_shipping_cost ?? 25);
  const expShipCost = Number(settings.pricing.express_shipping_cost ?? 45);
  const codFeeCfg = Number(settings.pricing.cod_fee ?? 0);
  const codMaxAmount = Number(settings.cod_config.max_order_amount ?? 1500);

  const baseShippingCost =
    shippingMethod === 'express' ? expShipCost : subtotal >= freeThreshold ? 0 : stdShipCost;
  const codFee = paymentMethod === 'cod' ? codFeeCfg : 0;
  const finalTotal = subtotal + baseShippingCost + codFee;
  const exceedsCodMax = paymentMethod === 'cod' && codMaxAmount > 0 && finalTotal > codMaxAmount;

  const handleSelectSavedAddress = (addrId: string) => {
    setSelectedAddressId(addrId);
    if (addrId === 'new') {
      setFormData({
        name: '',
        email: user?.email || '',
        phone: '',
        address: '',
        city: '',
        postalCode: '',
        nationalAddress: '',
      });
    } else {
      const found = savedAddresses.find(a => a.id === addrId);
      if (found) {
        setFormData({
          name: found.recipient_name,
          email: user?.email || '',
          phone: found.phone,
          address: found.address_line1,
          city: found.city,
          postalCode: found.postal_code,
          nationalAddress: found.national_address || '',
        });
      }
    }
  };

  const formatCardNumber = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
    return digits;
  };

  const validateAndSubmit = async (e: React.FormEvent, overrideMethod?: PaymentMethodType) => {
    e.preventDefault();
    setPaymentError('');
    const activeMethod = overrideMethod || paymentMethod;

    if (!formData.name.trim() || !formData.email.trim() || !formData.address.trim() || !formData.city.trim()) {
      setPaymentError(
        lang === 'ar'
          ? 'يرجى تعبئة جميع حقول عنوان الشحن المطلوبة.'
          : 'Please complete all required shipping address fields.'
      );
      return;
    }

    // Proper Pay on Delivery Validation
    if (activeMethod === 'cod') {
      const phoneDigits = formData.phone.replace(/\D/g, '');
      if (settings.cod_config.require_phone_validation && phoneDigits.length < 9) {
        setPaymentError(
          lang === 'ar'
            ? 'يرجى إدخال رقم جوال صحيح (مثال: 05XXXXXXXX) لتأكيد طلب الدفع عند الاستلام.'
            : 'Please enter a valid mobile number (e.g. 05XXXXXXXX) for Pay on Delivery.'
        );
        return;
      }

      if (codMaxAmount > 0 && finalTotal > codMaxAmount) {
        setPaymentError(
          lang === 'ar'
            ? `الحد الأقصى لطلبات الدفع عند الاستلام هو ${codMaxAmount} ريال.`
            : `Maximum order amount for Pay on Delivery is ${codMaxAmount} SAR.`
        );
        return;
      }

      if (settings.cod_config.require_confirmation_checkbox && !codConfirmed) {
        setPaymentError(
          lang === 'ar'
            ? 'يرجى تأكيد الموافقة على الدفع لمندوب التوصيل عند الاستلام.'
            : 'Please check the Pay on Delivery confirmation box before submitting.'
        );
        return;
      }
    }

    let newCardDetails: CheckoutSubmissionPayload['newCardDetails'] = undefined;

    if (activeMethod === 'card') {
      if (selectedCardId === 'new') {
        const rawDigits = cardForm.number.replace(/\D/g, '');
        if (rawDigits.length < 15) {
          setPaymentError(
            lang === 'ar'
              ? 'يرجى إدخال رقم بطاقة صحيح مكون من 16 رقم.'
              : 'Please enter a valid 16-digit card number.'
          );
          return;
        }
        if (cardForm.cvv.length < 3) {
          setPaymentError(
            lang === 'ar'
              ? 'يرجى إدخال رمز الأمان (CVV) الصحيح.'
              : 'Please enter a valid 3-digit CVV security code.'
          );
          return;
        }
        const [exp_month = '12', exp_year = '28'] = cardForm.expiry.split('/');
        const brand = rawDigits.startsWith('4')
          ? 'Visa'
          : rawDigits.startsWith('5')
          ? 'Mastercard'
          : 'Mada';
        newCardDetails = {
          cardholder_name: cardForm.holder || formData.name,
          card_brand: brand,
          last4: rawDigits.slice(-4),
          exp_month,
          exp_year,
        };
      } else if (cardForm.cvv.length < 3) {
        setPaymentError(
          lang === 'ar'
            ? 'يرجى تأكيد رمز الأمان (CVV) لبطاقتك المحفوظة.'
            : 'Please confirm the 3-digit CVV for your saved card.'
        );
        return;
      }
    }

    setProcessingPayment(true);
    try {
      const idempotencyKey = `idem_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const txPrefix =
        activeMethod === 'paypal'
          ? 'PAYPAL'
          : activeMethod === 'apple_pay'
          ? 'APPLEPAY'
          : activeMethod === 'cod'
          ? 'COD'
          : 'CARD';
      const transactionId = `${txPrefix}-${Date.now().toString().slice(-8)}`;

      await onCheckoutSubmit({
        ...formData,
        shippingMethod,
        shippingCost: baseShippingCost + codFee,
        paymentMethod: activeMethod,
        transactionId,
        courierProvider,
        idempotencyKey,
        saveAddress: Boolean(user && selectedAddressId === 'new' && saveAddress),
        saveCard: Boolean(user && activeMethod === 'card' && selectedCardId === 'new' && saveCard),
        newCardDetails,
      });
    } finally {
      setProcessingPayment(false);
    }
  };

  const savedCards = savedPaymentMethods.filter(p => p.method_type === 'card');
  const isCodOnly = enabledPaymentMethods.length === 1 && enabledPaymentMethods[0].key === 'cod';
  const codInstructions =
    lang === 'ar'
      ? settings.cod_config.instructions_ar || t('cod_only_desc')
      : settings.cod_config.instructions_en || t('cod_only_desc');

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[92vh] overflow-y-auto border border-[#EDE6DD]">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-6 end-6 p-2 rounded-full hover:bg-stone-100 text-stone-500"
        >
          <X className="w-5 h-5" />
        </button>

        {orderComplete ? (
          <div className="text-center py-10 space-y-5">
            <div className="w-20 h-20 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-12 h-12 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-2xl font-extrabold text-[#231F1E] mb-1">{t('order_placed')}</h3>
              <p className="text-stone-500 text-xs">{t('order_success_desc')}</p>
            </div>

            {completedOrder && (
              <div className="bg-[#FAF7F2] p-5 rounded-2xl border border-[#EDE6DD] max-w-md mx-auto text-xs space-y-2">
                <div className="flex justify-between font-bold">
                  <span className="text-stone-500">{t('order_number_label')}</span>
                  <span className="text-[#231F1E] font-extrabold">
                    {completedOrder.order_number || completedOrder.id.slice(0, 8)}
                  </span>
                </div>
                {completedOrder.tracking_number && (
                  <div className="flex justify-between font-bold">
                    <span className="text-stone-500">{t('courier_tracking_label')}</span>
                    <span className="text-amber-800 font-mono">
                      {completedOrder.courier_name} ({completedOrder.tracking_number})
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-stone-500">{t('payment_method_title')}:</span>
                  <span className="font-bold text-[#231F1E]">
                    {completedOrder.payment_method === 'cod'
                      ? t('pay_cod')
                      : completedOrder.payment_method?.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">{t('total')}:</span>
                  <span className="font-extrabold text-[#231F1E]">
                    {completedOrder.total_amount.toFixed(2)} {t('currency')}
                  </span>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {completedOrder && settings.features.show_track_order && (
                <Link
                  href={`/track?order=${encodeURIComponent(
                    completedOrder.order_number || completedOrder.id
                  )}`}
                  className="bg-[#231F1E] text-white px-6 py-3.5 rounded-xl text-xs font-bold hover:bg-[#3A3331] flex items-center gap-2"
                >
                  <Truck className="w-4 h-4" />
                  <span>{t('track_your_order')}</span>
                </Link>
              )}
              <button
                type="button"
                onClick={() => window.print()}
                className="bg-[#EAE2D7] text-[#231F1E] px-5 py-3.5 rounded-xl text-xs font-bold flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>{t('print_invoice')}</span>
              </button>
              <button
                type="button"
                onClick={onResetCheckout}
                className="border border-stone-300 text-stone-700 px-6 py-3.5 rounded-xl text-xs font-bold hover:bg-stone-50"
              >
                {t('back_to_store')}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={e => validateAndSubmit(e)} className="space-y-6">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#C4A484]">
                {t('checkout_badge')}
              </span>
              <h3 className="text-2xl font-extrabold text-[#231F1E]">{t('checkout_title')}</h3>
            </div>

            {paymentError && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{paymentError}</span>
              </div>
            )}

            {/* Courier Partner Selection */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-[#C4A484]" />
                <span>{t('courier_select_title')}</span>
              </h4>
              <div
                className={`grid grid-cols-1 ${
                  enabledCouriers.length > 1 ? 'sm:grid-cols-2' : ''
                } gap-3`}
              >
                {enabledCouriers.map(c => (
                  <button
                    type="button"
                    key={c.key}
                    onClick={() => setCourierProvider(c.key)}
                    className={`p-3.5 rounded-2xl border text-start flex justify-between items-center transition-all ${
                      courierProvider === c.key
                        ? 'border-[#231F1E] bg-[#FAF7F2] shadow-sm'
                        : 'border-stone-200'
                    }`}
                  >
                    <span className="text-xs font-bold text-[#231F1E]">{c.label}</span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#EAE2D7] text-[#231F1E]">
                      {c.badge}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Shipping Address Section */}
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#C4A484]" />
                <span>{t('saved_addresses_title')}</span>
              </h4>

              {savedAddresses.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-3">
                  {savedAddresses.map(addr => (
                    <button
                      type="button"
                      key={addr.id}
                      onClick={() => handleSelectSavedAddress(addr.id)}
                      className={`p-3.5 rounded-2xl border text-start transition-all ${
                        selectedAddressId === addr.id
                          ? 'border-[#231F1E] bg-[#FAF7F2] shadow-sm'
                          : 'border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <div className="font-extrabold text-xs text-[#231F1E]">
                        {addr.label} • {addr.recipient_name}
                      </div>
                      <div className="text-[11px] text-stone-500 truncate mt-0.5">
                        {addr.address_line1}, {addr.city}
                      </div>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleSelectSavedAddress('new')}
                    className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-center ${
                      selectedAddressId === 'new'
                        ? 'border-[#231F1E] bg-[#FAF7F2] text-[#231F1E]'
                        : 'border-stone-200 text-stone-600'
                    }`}
                  >
                    + {t('use_new_address')}
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  required
                  placeholder={t('full_name')}
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3.5 py-2.5 text-xs"
                />
                <input
                  type="email"
                  required
                  placeholder={t('email_address')}
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3.5 py-2.5 text-xs"
                />
                <input
                  type="tel"
                  required
                  placeholder={t('phone_label')}
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3.5 py-2.5 text-xs"
                />
              </div>

              <input
                type="text"
                required
                placeholder={t('shipping_address')}
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3.5 py-2.5 text-xs"
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  required
                  placeholder={t('city')}
                  value={formData.city}
                  onChange={e => setFormData({ ...formData, city: e.target.value })}
                  className="w-full bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3.5 py-2.5 text-xs"
                />
                <input
                  type="text"
                  required
                  placeholder={t('postal_code')}
                  value={formData.postalCode}
                  onChange={e => setFormData({ ...formData, postalCode: e.target.value })}
                  className="w-full bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3.5 py-2.5 text-xs"
                />
                <input
                  type="text"
                  placeholder={t('national_address')}
                  value={formData.nationalAddress}
                  onChange={e => setFormData({ ...formData, nationalAddress: e.target.value })}
                  className="w-full bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3.5 py-2.5 text-xs"
                />
              </div>

              {user && selectedAddressId === 'new' && (
                <label className="flex items-center gap-2 text-xs text-stone-600 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={saveAddress}
                    onChange={e => setSaveAddress(e.target.checked)}
                    className="rounded text-[#231F1E]"
                  />
                  <span>{t('save_address_Future')}</span>
                </label>
              )}
            </div>

            {/* Shipping Speed */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-[#C4A484]" />
                <span>{t('shipping_method_title')}</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setShippingMethod('standard')}
                  className={`p-3.5 rounded-2xl border text-start flex justify-between items-center ${
                    shippingMethod === 'standard'
                      ? 'border-[#231F1E] bg-[#FAF7F2]'
                      : 'border-stone-200'
                  }`}
                >
                  <span className="text-xs font-bold text-[#231F1E]">{t('shipping_standard')}</span>
                  <span className="text-xs font-extrabold text-emerald-700">
                    {subtotal >= freeThreshold
                      ? t('free_label')
                      : `${stdShipCost.toFixed(2)} ${t('currency')}`}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setShippingMethod('express')}
                  className={`p-3.5 rounded-2xl border text-start flex justify-between items-center ${
                    shippingMethod === 'express'
                      ? 'border-[#231F1E] bg-[#FAF7F2]'
                      : 'border-stone-200'
                  }`}
                >
                  <span className="text-xs font-bold text-[#231F1E]">{t('shipping_express')}</span>
                  <span className="text-xs font-extrabold text-[#231F1E]">
                    {expShipCost.toFixed(2)} {t('currency')}
                  </span>
                </button>
              </div>
            </div>

            {/* Proper Pay on Delivery & Dynamic Payment Section */}
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                {isCodOnly ? (
                  <Banknote className="w-4 h-4 text-[#C4A484]" />
                ) : (
                  <CreditCard className="w-4 h-4 text-[#C4A484]" />
                )}
                <span>{t('payment_method_title')}</span>
              </h4>

              {!isCodOnly && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {enabledPaymentMethods.map(pm => (
                    <button
                      type="button"
                      key={pm.key}
                      onClick={() => setPaymentMethod(pm.key)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                        paymentMethod === pm.key
                          ? 'bg-[#231F1E] text-white border-[#231F1E]'
                          : 'bg-[#FAF7F2] text-stone-700 border-[#EDE6DD]'
                      }`}
                    >
                      {pm.label}
                    </button>
                  ))}
                </div>
              )}

              {paymentMethod === 'cod' && (
                <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF7F2] border-2 border-[#231F1E] space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#231F1E] text-[#EAE2D7] flex items-center justify-center shrink-0">
                      <Banknote className="w-5 h-5" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xs font-extrabold text-[#231F1E]">{t('pay_cod')}</p>
                        {settings.cod_config.allow_mada_on_delivery && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            {lang === 'ar' ? 'نقداً أو شبكة مدى' : 'Cash or Mada POS'}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-600 leading-relaxed">
                        {codInstructions}
                      </p>
                      {codMaxAmount > 0 && (
                        <p className="text-[10px] font-bold text-stone-400">
                          {lang === 'ar'
                            ? `الحد الأقصى للطلب: ${codMaxAmount} ريال`
                            : `Max COD order limit: ${codMaxAmount} SAR`}
                        </p>
                      )}
                    </div>
                  </div>

                  {exceedsCodMax && (
                    <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-[11px] text-red-700 font-bold">
                      {lang === 'ar'
                        ? `قيمة الطلب تتجاوز الحد الأقصى للدفع عند الاستلام (${codMaxAmount} ريال).`
                        : `Order total exceeds the ${codMaxAmount} SAR Pay on Delivery limit.`}
                    </div>
                  )}

                  {settings.cod_config.require_confirmation_checkbox && (
                    <label className="flex items-start gap-2.5 pt-2 border-t border-[#EDE6DD] text-xs text-[#231F1E] font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={codConfirmed}
                        onChange={e => setCodConfirmed(e.target.checked)}
                        className="mt-0.5 rounded text-[#231F1E]"
                      />
                      <span>
                        {lang === 'ar'
                          ? `أؤكد استلام الطلب ودفع مبلغ ${finalTotal.toFixed(2)} ريال لمندوب التوصيل عند الوصول.`
                          : `I confirm I will receive this order and pay ${finalTotal.toFixed(2)} SAR to the courier upon delivery.`}
                      </span>
                    </label>
                  )}
                </div>
              )}

              {paymentMethod === 'card' && (
                <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EDE6DD] space-y-3">
                  {savedCards.length > 0 && (
                    <div className="space-y-2">
                      <label className="block text-[11px] font-bold text-stone-500">
                        {t('saved_cards_title')}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {savedCards.map(sc => (
                          <button
                            type="button"
                            key={sc.id}
                            onClick={() => setSelectedCardId(sc.id)}
                            className={`px-3 py-2 rounded-xl border text-xs font-bold ${
                              selectedCardId === sc.id
                                ? 'bg-[#231F1E] text-white border-[#231F1E]'
                                : 'bg-white text-stone-700 border-stone-200'
                            }`}
                          >
                            {sc.card_brand} •••• {sc.last4}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setSelectedCardId('new')}
                          className={`px-3 py-2 rounded-xl border text-xs font-bold ${
                            selectedCardId === 'new'
                              ? 'bg-[#231F1E] text-white border-[#231F1E]'
                              : 'bg-white text-stone-700 border-stone-200'
                          }`}
                        >
                          + {t('use_new_card')}
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedCardId === 'new' ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder={t('card_holder')}
                          value={cardForm.holder}
                          onChange={e => setCardForm({ ...cardForm, holder: e.target.value })}
                          className="bg-white border border-[#EDE6DD] rounded-xl px-3.5 py-2.5 text-xs"
                        />
                        <input
                          type="text"
                          placeholder={t('card_number')}
                          value={cardForm.number}
                          onChange={e =>
                            setCardForm({
                              ...cardForm,
                              number: formatCardNumber(e.target.value),
                            })
                          }
                          className="bg-white border border-[#EDE6DD] rounded-xl px-3.5 py-2.5 text-xs font-mono"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder={t('card_expiry')}
                          value={cardForm.expiry}
                          onChange={e =>
                            setCardForm({ ...cardForm, expiry: formatExpiry(e.target.value) })
                          }
                          className="bg-white border border-[#EDE6DD] rounded-xl px-3.5 py-2.5 text-xs font-mono"
                        />
                        <input
                          type="password"
                          maxLength={4}
                          placeholder={t('card_cvv')}
                          value={cardForm.cvv}
                          onChange={e =>
                            setCardForm({ ...cardForm, cvv: e.target.value.replace(/\D/g, '') })
                          }
                          className="bg-white border border-[#EDE6DD] rounded-xl px-3.5 py-2.5 text-xs font-mono"
                        />
                      </div>
                      {user && (
                        <label className="flex items-center gap-2 text-xs text-stone-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={saveCard}
                            onChange={e => setSaveCard(e.target.checked)}
                          />
                          <span>{t('save_card_future')}</span>
                        </label>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-xs text-stone-600 font-medium">
                        {t('confirm_cvv_saved')}
                      </span>
                      <input
                        type="password"
                        maxLength={4}
                        placeholder="CVV"
                        value={cardForm.cvv}
                        onChange={e =>
                          setCardForm({ ...cardForm, cvv: e.target.value.replace(/\D/g, '') })
                        }
                        className="w-28 bg-white border border-[#EDE6DD] rounded-xl px-3.5 py-2 text-xs font-mono"
                      />
                    </div>
                  )}
                </div>
              )}

              {paymentMethod === 'paypal' && (
                <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#EDE6DD] text-center space-y-3">
                  <p className="text-xs text-stone-600">{t('paypal_desc')}</p>
                  <button
                    type="button"
                    disabled={processingPayment}
                    onClick={e => validateAndSubmit(e as any, 'paypal')}
                    className="w-full bg-[#FFC439] hover:bg-[#F4B400] text-[#003087] font-black py-3.5 rounded-xl text-sm tracking-wide shadow transition-all"
                  >
                    {processingPayment
                      ? t('processing_payment')
                      : `${t('paypal_btn')} • ${finalTotal.toFixed(2)} ${t('currency')}`}
                  </button>
                </div>
              )}

              {paymentMethod === 'apple_pay' && (
                <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#EDE6DD] text-center space-y-3">
                  <button
                    type="button"
                    disabled={processingPayment}
                    onClick={e => validateAndSubmit(e as any, 'apple_pay')}
                    className="w-full bg-black hover:bg-stone-900 text-white font-bold py-3.5 rounded-xl text-sm tracking-wide shadow transition-all flex items-center justify-center gap-2"
                  >
                    <span> Pay</span>
                    <span>
                      • {finalTotal.toFixed(2)} {t('currency')}
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* Totals Breakdown */}
            <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#EDE6DD] space-y-1.5 text-xs">
              <div className="flex justify-between text-stone-600">
                <span>{t('subtotal')}</span>
                <span>
                  {subtotal.toFixed(2)} {t('currency')}
                </span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>{t('shipping')}</span>
                <span>
                  {baseShippingCost === 0
                    ? t('free_label')
                    : `${baseShippingCost.toFixed(2)} ${t('currency')}`}
                </span>
              </div>
              {codFee > 0 && (
                <div className="flex justify-between text-stone-600">
                  <span>{t('cod_fee_label')}</span>
                  <span>
                    {codFee.toFixed(2)} {t('currency')}
                  </span>
                </div>
              )}
              <div className="flex justify-between font-extrabold text-base text-[#231F1E] pt-2 border-t border-[#EDE6DD]">
                <span>{t('total')}</span>
                <span>
                  {finalTotal.toFixed(2)} {t('currency')}
                </span>
              </div>
            </div>

            {(paymentMethod === 'card' || paymentMethod === 'cod') && (
              <button
                type="submit"
                disabled={processingPayment || exceedsCodMax}
                className="w-full bg-[#231F1E] disabled:opacity-50 text-white py-4 rounded-2xl font-bold hover:bg-[#3A3331] transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                {paymentMethod === 'cod' ? (
                  <ShieldCheck className="w-4 h-4 text-[#C4A484]" />
                ) : (
                  <Lock className="w-4 h-4 text-[#C4A484]" />
                )}
                <span>
                  {processingPayment
                    ? t('processing_payment')
                    : `${t('complete_order')} (${finalTotal.toFixed(2)} ${t('currency')})`}
                </span>
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  );
}