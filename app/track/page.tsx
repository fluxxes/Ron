// Copyright (c) 2026 (RON). Developed by (fluxes) All rights reserved.
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Order } from '../types/coffee';
import { getLiveCourierCheckpoints } from '../lib/deliveryService';
import { useTranslation } from '../lib/useTranslation';
import {
  Search,
  CheckCircle2,
  Clock,
  Coffee,
  Truck,
  PackageCheck,
  ArrowLeft,
  ArrowRight,
  Globe,
  MapPin,
  FileText,
} from 'lucide-react';
import Link from 'next/link';

export default function TrackOrderPage() {
  const { lang, t, toggleLanguage, translateStatus, translateOption } = useTranslation();
  const [orderLookup, setOrderLookup] = useState('');
  const [contactInput, setContactInput] = useState('');
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const searchOrder = useCallback(async (lookupValue: string, contactValue = '') => {
    const clean = lookupValue.trim();
    if (!clean) return;
    setLoading(true);
    setNotFound(false);
    try {
      const { data: rpcResult } = await supabase.rpc('get_order_tracking', {
        p_order_lookup: clean,
        p_contact: contactValue.trim(),
      });
      if (rpcResult) {
        setTrackedOrder(rpcResult as Order);
        return;
      }

      const { data: fallbackOrder } = await supabase
        .from('orders')
        .select('*')
        .or(`order_number.ilike.${clean},tracking_number.ilike.${clean}`)
        .limit(1)
        .maybeSingle();

      if (fallbackOrder) {
        setTrackedOrder(fallbackOrder as Order);
        return;
      }
      setTrackedOrder(null);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const orderParam = params.get('order');
      if (orderParam) {
        setOrderLookup(orderParam);
        void searchOrder(orderParam);
      }
    }
  }, [searchOrder]);

  useEffect(() => {
    if (!trackedOrder?.id) return;
    const channel = supabase
      .channel(`order-track-${trackedOrder.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${trackedOrder.id}`,
        },
        payload => {
          if (payload.new) setTrackedOrder(payload.new as Order);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [trackedOrder?.id]);

  const stages = [
    { key: 'Approved', label: t('step_confirmed'), icon: CheckCircle2 },
    { key: 'Processing', label: t('step_processing'), icon: Clock },
    { key: 'Roasted & Packed', label: t('step_roasted'), icon: Coffee },
    { key: 'Out for Delivery', label: t('step_shipped'), icon: Truck },
    { key: 'Delivered', label: t('step_completed'), icon: PackageCheck },
  ];

  const getActiveStepIndex = (status: Order['status']) => {
    if (status === 'Pending Approval' || status === 'Approved') return 0;
    if (status === 'Processing') return 1;
    if (status === 'Roasted & Packed') return 2;
    if (status === 'Shipped' || status === 'Out for Delivery') return 3;
    if (status === 'Delivered' || status === 'Completed') return 4;
    return 0;
  };

  const currentStep = trackedOrder ? getActiveStepIndex(trackedOrder.status) : 0;
  const courierCheckpoints = trackedOrder
    ? getLiveCourierCheckpoints(
        trackedOrder.courier_provider || 'smsa',
        trackedOrder.tracking_number || '',
        trackedOrder.city,
        trackedOrder.status
      )
    : [];

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#231F1E]">
      <header className="bg-white border-b border-[#E6DFD5] h-20 flex items-center">
        <div className="max-w-5xl mx-auto px-6 w-full flex items-center justify-between">
          <Link
            href="/"
            className="bg-[#FAF7F2] border border-[#E6DFD5] px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 hover:bg-[#EAE2D7]/50"
          >
            {lang === 'ar' ? (
              <ArrowRight className="w-4 h-4" />
            ) : (
              <ArrowLeft className="w-4 h-4" />
            )}
            <span>{t('back_to_store')}</span>
          </Link>
          <button
            type="button"
            onClick={toggleLanguage}
            className="bg-[#FAF7F2] border border-[#D8D0C5] px-3.5 py-2 rounded-full text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-[#9C7E5E]" />
            <span>{lang === 'ar' ? 'English' : 'العربية'}</span>
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
        <div className="text-center max-w-xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-widest text-[#B89F86] block mb-2">
            {t('track_badge')}
          </span>
          <h1 className="text-3xl font-extrabold text-[#231F1E] mb-2">{t('track_page_title')}</h1>
          <p className="text-xs sm:text-sm text-stone-500">{t('track_page_subtitle')}</p>
        </div>

        <form
          onSubmit={e => {
            e.preventDefault();
            void searchOrder(orderLookup, contactInput);
          }}
          className="bg-white p-6 rounded-3xl border border-[#EDE6DD] shadow-sm flex flex-col sm:flex-row gap-3"
        >
          <input
            type="text"
            required
            placeholder={t('track_input_placeholder')}
            value={orderLookup}
            onChange={e => setOrderLookup(e.target.value)}
            className="flex-1 bg-[#FAF7F2] border border-[#EDE6DD] rounded-2xl px-4 py-3 text-xs font-bold"
          />
          <input
            type="text"
            placeholder={t('track_contact_placeholder')}
            value={contactInput}
            onChange={e => setContactInput(e.target.value)}
            className="sm:w-64 bg-[#FAF7F2] border border-[#EDE6DD] rounded-2xl px-4 py-3 text-xs"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-[#231F1E] text-white px-6 py-3 rounded-2xl text-xs font-bold hover:bg-[#3A3331] flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" />
            <span>{loading ? '...' : t('track_btn')}</span>
          </button>
        </form>

        {notFound && (
          <div className="bg-white p-8 rounded-3xl border border-red-200 text-center text-xs text-red-700 font-bold">
            {t('order_not_found')}
          </div>
        )}

        {trackedOrder && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#EDE6DD] shadow-sm space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-stone-100 pb-6">
              <div>
                <span className="text-xs font-bold text-[#B89F86] uppercase">
                  {t('order_number_label')}{' '}
                  {trackedOrder.order_number || trackedOrder.id.slice(0, 8)}
                </span>
                <h2 className="text-xl font-extrabold text-[#231F1E] mt-0.5">
                  {trackedOrder.customer_name}
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  {trackedOrder.address}, {trackedOrder.city} ({trackedOrder.postal_code})
                </p>
              </div>
              <div className="text-end">
                <span
                  className={`px-4 py-1.5 rounded-full text-xs font-extrabold ${
                    trackedOrder.status === 'Cancelled'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-[#231F1E] text-[#EAE2D7]'
                  }`}
                >
                  {translateStatus(trackedOrder.status)}
                </span>
                {trackedOrder.tracking_number && (
                  <p className="text-xs font-bold text-amber-800 mt-2">
                    <a
                      href={trackedOrder.waybill_url}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:underline"
                    >
                      {trackedOrder.courier_name} • {t('courier_tracking_label')} #
                      {trackedOrder.tracking_number}
                    </a>
                  </p>
                )}
              </div>
            </div>

            {/* 5-Step Amazon/SHEIN Visual Pipeline */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
              {stages.map((st, idx) => {
                const Icon = st.icon;
                const isDone = idx <= currentStep && trackedOrder.status !== 'Cancelled';
                return (
                  <div
                    key={st.key}
                    className={`p-4 rounded-2xl border text-center transition-all ${
                      isDone
                        ? 'bg-[#FAF7F2] border-[#231F1E] text-[#231F1E] shadow-sm'
                        : 'bg-stone-50 border-stone-200 text-stone-400'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center ${
                        isDone ? 'bg-[#231F1E] text-[#EAE2D7]' : 'bg-stone-200 text-stone-500'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-extrabold">{st.label}</p>
                  </div>
                );
              })}
            </div>

            {/* Order Items Summary */}
            <div className="bg-[#FAF7F2] p-5 rounded-2xl border border-[#EDE6DD] space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#231F1E] flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#C4A484]" />
                <span>{t('roastery_items_label')}</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {(trackedOrder.items || []).map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 bg-white p-3 rounded-xl border border-[#EDE6DD]"
                  >
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-12 h-12 rounded-lg object-cover bg-stone-100"
                      />
                    )}
                    <div className="text-xs">
                      <p className="font-extrabold text-[#231F1E]">
                        {item.quantity}x{' '}
                        {lang === 'ar' && item.name_ar ? item.name_ar : item.name}
                      </p>
                      <p className="text-stone-500">
                        {translateOption(item.selectedWeight)} •{' '}
                        {translateOption(item.selectedGrind)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Courier Checkpoints */}
            <div className="bg-[#FAF7F2] p-5 rounded-2xl border border-[#EDE6DD] space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#231F1E] flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#C4A484]" />
                <span>
                  {lang === 'ar'
                    ? 'سجل التتبع المباشر لشركة الشحن'
                    : 'Live Courier Dispatch Checkpoints'}
                </span>
              </h3>
              <div className="space-y-2.5">
                {courierCheckpoints.map((cp, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between text-xs p-3 rounded-xl border ${
                      cp.completed
                        ? 'bg-white border-[#EDE6DD] text-[#231F1E]'
                        : 'bg-stone-50 border-stone-200 text-stone-400'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2
                        className={`w-4 h-4 shrink-0 ${
                          cp.completed ? 'text-emerald-600' : 'text-stone-300'
                        }`}
                      />
                      <span className="font-bold">
                        {lang === 'ar' ? cp.stage_ar : cp.stage}
                      </span>
                    </div>
                    <span className="text-stone-400 font-mono">{cp.location}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}