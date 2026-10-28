'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Order } from '../types/coffee';
import { useTranslation } from '../lib/useTranslation';
import {
  Search,
  CheckCircle2,
  Clock,
  Coffee,
  Truck,
  PackageCheck,
  ArrowLeft,
  Globe,
  MapPin,
} from 'lucide-react';
import Link from 'next/link';

export default function TrackOrderPage() {
  const { lang, t, toggleLanguage } = useTranslation();
  const [orderLookup, setOrderLookup] = useState('');
  const [contactInput, setContactInput] = useState('');
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const searchOrder = useCallback(async (lookupValue: string, contactValue = '') => {
    if (!lookupValue.trim()) return;
    setLoading(true);
    setNotFound(false);

    try {
      const { data: rpcResult, error: rpcErr } = await supabase.rpc('get_order_tracking', {
        p_order_lookup: lookupValue.trim(),
        p_contact: contactValue.trim(),
      });

      if (!rpcErr && rpcResult) {
        setTrackedOrder(rpcResult as Order);
        return;
      }

      const { data: directOrders } = await supabase
        .from('orders')
        .select('*')
        .or(`order_number.ilike.${lookupValue.trim()},id.eq.${lookupValue.trim()}`)
        .limit(1);

      if (directOrders && directOrders.length > 0) {
        setTrackedOrder(directOrders[0]);
      } else {
        setTrackedOrder(null);
        setNotFound(true);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const initialOrder = params.get('order');
      if (initialOrder) {
        setOrderLookup(initialOrder);
        searchOrder(initialOrder);
      }
    }

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const { data } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })
          .limit(5);
        if (data) setRecentOrders(data);
      }
    });
  }, [searchOrder]);

  // Real-time subscription for live order status changes
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
          if (payload.new) {
            setTrackedOrder(payload.new as Order);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [trackedOrder?.id]);

  const stages = [
    { key: 'Confirmed', label: t('step_confirmed'), icon: CheckCircle2 },
    { key: 'Processing', label: t('step_processing'), icon: Clock },
    { key: 'Roasted & Packed', label: t('step_roasted'), icon: Coffee },
    { key: 'Shipped', label: t('step_shipped'), icon: Truck },
    { key: 'Completed', label: t('step_completed'), icon: PackageCheck },
  ];

  const getActiveStepIndex = (status: Order['status']) => {
    if (status === 'Processing') return 1;
    if (status === 'Roasted & Packed') return 2;
    if (status === 'Shipped') return 3;
    if (status === 'Completed') return 4;
    return 0;
  };

  const currentStep = trackedOrder ? getActiveStepIndex(trackedOrder.status) : 0;

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#2C2825] font-sans">
      <header className="bg-white border-b border-[#EDE6DD] h-20 flex items-center">
        <div className="max-w-5xl mx-auto px-6 w-full flex items-center justify-between">
          <Link
            href="/"
            className="bg-[#FAF7F2] border border-[#EDE6DD] px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-[#EAE2D7]/50"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('back_to_store')}</span>
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleLanguage}
              className="bg-[#FAF7F2] border border-[#EDE6DD] px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <Globe className="w-3.5 h-3.5 text-[#C4A484]" />
              {lang === 'ar' ? 'EN' : 'عربي'}
            </button>
            <div className="w-10 h-10 rounded-xl bg-[#EAE2D7] border border-[#DDD2C4] flex items-center justify-center">
              <span className="font-serif font-extrabold text-[#5A4D41] text-xs">RŌN</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
        <div className="text-center max-w-xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-widest text-[#C4A484] block mb-2">
            LIVE ROASTERY TRACKER
          </span>
          <h1 className="text-3xl font-extrabold text-[#2C2825] mb-2">{t('track_page_title')}</h1>
          <p className="text-xs sm:text-sm text-stone-500">{t('track_page_subtitle')}</p>
        </div>

        {/* Lookup Form */}
        <form
          onSubmit={e => {
            e.preventDefault();
            searchOrder(orderLookup, contactInput);
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
            className="flex-1 bg-[#FAF7F2] border border-[#EDE6DD] rounded-2xl px-4 py-3 text-xs"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-[#2C2825] text-white px-6 py-3 rounded-2xl text-xs font-bold hover:bg-[#3E3834] flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" />
            <span>{loading ? '...' : t('track_btn')}</span>
          </button>
        </form>

        {/* Quick pills for logged-in customer's recent orders */}
        {recentOrders.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <span className="text-xs font-bold text-stone-500">Your Recent Orders:</span>
            {recentOrders.map(ro => (
              <button
                key={ro.id}
                onClick={() => {
                  const code = ro.order_number || ro.id;
                  setOrderLookup(code);
                  searchOrder(code);
                }}
                className="text-xs bg-white border border-[#EDE6DD] px-3 py-1.5 rounded-full font-bold hover:border-[#2C2825]"
              >
                {ro.order_number || ro.id.slice(0, 8)} ({ro.status})
              </button>
            ))}
          </div>
        )}

        {notFound && (
          <div className="bg-white p-8 rounded-3xl border border-red-200 text-center text-xs text-red-700 font-bold">
            Order not found. Please check your Order Number (e.g. RON-2026-XXXXXX) and try again.
          </div>
        )}

        {/* Live 5-Stage Visual Stepper */}
        {trackedOrder && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#EDE6DD] shadow-sm space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-stone-100 pb-6">
              <div>
                <span className="text-xs font-bold text-[#C4A484] uppercase">
                  {t('order_number_label')}{' '}
                  {trackedOrder.order_number || trackedOrder.id.slice(0, 8)}
                </span>
                <h2 className="text-xl font-extrabold text-[#2C2825] mt-0.5">
                  {trackedOrder.customer_name}
                </h2>
                <p className="text-xs text-stone-500 flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-[#C4A484]" />
                  {trackedOrder.address}, {trackedOrder.city} ({trackedOrder.postal_code})
                </p>
              </div>
              <div className="text-end">
                <span className="px-4 py-1.5 rounded-full text-xs font-extrabold bg-[#2C2825] text-[#EAE2D7]">
                  {trackedOrder.status}
                </span>
                {trackedOrder.tracking_number && (
                  <p className="text-xs font-bold text-amber-800 mt-2">
                    {trackedOrder.courier_name || 'Courier'} Tracking: #{trackedOrder.tracking_number}
                  </p>
                )}
              </div>
            </div>

            {/* 5-Stage Stepper */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
              {stages.map((st, idx) => {
                const Icon = st.icon;
                const isDone = idx <= currentStep && trackedOrder.status !== 'Cancelled';
                return (
                  <div
                    key={st.key}
                    className={`p-4 rounded-2xl border text-center transition-all ${
                      isDone
                        ? 'bg-[#FAF7F2] border-[#2C2825] text-[#2C2825] shadow-sm'
                        : 'bg-stone-50 border-stone-200 text-stone-400'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center ${
                        isDone ? 'bg-[#2C2825] text-[#EAE2D7]' : 'bg-stone-200 text-stone-500'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-extrabold">{st.label}</p>
                  </div>
                );
              })}
            </div>

            {/* Order Items Breakdown */}
            <div className="bg-[#FAF7F2] p-5 rounded-2xl border border-[#EDE6DD] space-y-2">
              <h4 className="text-xs font-extrabold uppercase text-stone-500 mb-2">
                Roastery Items
              </h4>
              {trackedOrder.items?.map((item, i) => (
                <div key={i} className="flex justify-between text-xs font-bold">
                  <span>
                    {item.quantity}x {item.name} ({item.selectedWeight} • {item.selectedGrind})
                  </span>
                  <span>
                    {(item.price * item.quantity).toFixed(2)} {t('currency')}
                  </span>
                </div>
              ))}
              <div className="flex justify-between text-sm font-extrabold pt-2 border-t border-[#EDE6DD]">
                <span>{t('total')}</span>
                <span>
                  {trackedOrder.total_amount.toFixed(2)} {t('currency')}
                </span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}