// Copyright (c) 2026 (RON). Developed by (fluxes) All rights reserved.
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  User,
  MapPin,
  CreditCard,
  Package,
  MessageSquare,
  Plus,
  Trash2,
  Printer,
  RefreshCw,
  Truck,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  CustomerAddress,
  SavedPaymentMethod,
  Order,
  CartItem,
  SupportTicket,
} from '../types/coffee';
import Link from 'next/link';

interface CustomerAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  addresses: CustomerAddress[];
  paymentMethods: SavedPaymentMethod[];
  customerOrders: Order[];
  onRefreshAccountData: () => void;
  onReorder: (items: CartItem[]) => void;
  onNotify: (msg: string, type?: 'success' | 'error') => void;
  lang: 'ar' | 'en';
  t: (key: string) => string;
}

export default function CustomerAccountModal({
  isOpen,
  onClose,
  user,
  addresses,
  paymentMethods,
  customerOrders,
  onRefreshAccountData,
  onReorder,
  onNotify,
  lang,
  t,
}: CustomerAccountModalProps) {
  const [activeTab, setActiveTab] = useState<
    'profile' | 'addresses' | 'payments' | 'orders' | 'tickets'
  >('profile');

  // Profile State
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    phone: '',
    preferred_weight: '250g',
    preferred_grind: 'Whole Bean',
  });

  // New Address State
  const [addrForm, setAddrForm] = useState({
    label: lang === 'ar' ? 'المنزل' : 'Home',
    recipient_name: '',
    phone: '',
    city: lang === 'ar' ? 'الرياض' : 'Riyadh',
    address_line1: '',
    postal_code: '',
    national_address: '',
  });

  // New Card State
  const [cardForm, setCardForm] = useState({
    cardholder_name: '',
    card_number: '',
    expiry: '',
  });

  // Support Tickets State
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [newTicket, setNewTicket] = useState({
    subject: '',
    category: 'Order Issue' as SupportTicket['category'],
    order_number: '',
    body: '',
  });
  const [replyMap, setReplyMap] = useState<Record<string, string>>({});

  const fetchTickets = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setTickets(data as SupportTicket[]);
  }, [user]);

  useEffect(() => {
    if (user && isOpen) {
      supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setProfileForm({
              full_name: data.full_name || '',
              phone: data.phone || '',
              preferred_weight: data.preferred_weight || '250g',
              preferred_grind: data.preferred_grind || 'Whole Bean',
            });
          }
        });
      fetchTickets();
    }
  }, [user, isOpen, fetchTickets]);

  if (!isOpen || !user) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('profiles').upsert([
      {
        id: user.id,
        email: user.email,
        ...profileForm,
        updated_at: new Date().toISOString(),
      },
    ]);
    if (!error) {
      onNotify(lang === 'ar' ? 'تم حفظ الملف الشخصي بنجاح' : 'Profile saved', 'success');
      onRefreshAccountData();
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('customer_addresses').insert([
      {
        user_id: user.id,
        ...addrForm,
        country: 'Saudi Arabia',
        is_default_shipping: addresses.length === 0,
        is_default_billing: addresses.length === 0,
      },
    ]);
    if (!error) {
      setAddrForm({
        label: lang === 'ar' ? 'المنزل' : 'Home',
        recipient_name: '',
        phone: '',
        city: lang === 'ar' ? 'الرياض' : 'Riyadh',
        address_line1: '',
        postal_code: '',
        national_address: '',
      });
      onRefreshAccountData();
      onNotify(lang === 'ar' ? 'تمت إضافة العنوان بنجاح' : 'Address saved', 'success');
    }
  };

  const handleDeleteAddress = async (id: string) => {
    await supabase.from('customer_addresses').delete().eq('id', id);
    onRefreshAccountData();
  };

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = cardForm.card_number.replace(/\D/g, '');
    if (digits.length < 15) return;
    const [exp_month = '12', exp_year = '28'] = cardForm.expiry.split('/');
    const brand = digits.startsWith('4') ? 'Visa' : digits.startsWith('5') ? 'Mastercard' : 'Mada';

    const { error } = await supabase.from('saved_payment_methods').insert([
      {
        user_id: user.id,
        method_type: 'card',
        cardholder_name: cardForm.cardholder_name,
        card_brand: brand,
        last4: digits.slice(-4),
        exp_month,
        exp_year,
        gateway_token: `tok_${Date.now()}`,
        is_default: paymentMethods.length === 0,
      },
    ]);
    if (!error) {
      setCardForm({ cardholder_name: '', card_number: '', expiry: '' });
      onRefreshAccountData();
      onNotify(lang === 'ar' ? 'تم حفظ البطاقة بنجاح' : 'Card saved securely', 'success');
    }
  };

  const handleDeleteCard = async (id: string) => {
    await supabase.from('saved_payment_methods').delete().eq('id', id);
    onRefreshAccountData();
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    const words = newTicket.body.trim().split(/\s+/);
    if (words.length > 300) {
      onNotify(
        lang === 'ar'
          ? 'الحد الأقصى للرسالة هو 300 كلمة'
          : 'Maximum message length is 300 words',
        'error'
      );
      return;
    }

    const { error } = await supabase.from('support_tickets').insert([
      {
        user_id: user.id,
        customer_name: profileForm.full_name || user.email,
        customer_email: user.email,
        order_number: newTicket.order_number,
        subject: newTicket.subject,
        category: newTicket.category,
        messages: [
          {
            id: Date.now().toString(),
            sender_role: 'customer',
            sender_name: profileForm.full_name || user.email,
            body: newTicket.body.trim(),
            created_at: new Date().toISOString(),
          },
        ],
      },
    ]);
    if (!error) {
      onNotify(lang === 'ar' ? 'تم فتح تذكرة الدعم بنجاح' : 'Support ticket created', 'success');
      setNewTicket({ subject: '', category: 'Order Issue', order_number: '', body: '' });
      fetchTickets();
    }
  };

  const handleCustomerReply = async (ticket: SupportTicket) => {
    const text = (replyMap[ticket.id] || '').trim();
    if (!text) return;
    const nextMessages = [
      ...(ticket.messages || []),
      {
        id: Date.now().toString(),
        sender_role: 'customer' as const,
        sender_name: profileForm.full_name || user.email,
        body: text,
        created_at: new Date().toISOString(),
      },
    ];
    await supabase
      .from('support_tickets')
      .update({ messages: nextMessages, updated_at: new Date().toISOString() })
      .eq('id', ticket.id);
    setReplyMap(prev => ({ ...prev, [ticket.id]: '' }));
    fetchTickets();
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#FAF7F2] rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-[#EDE6DD] flex flex-col">
        <div className="p-6 bg-white border-b border-[#EDE6DD] flex items-center justify-between">
          <div>
            <h3 className="text-xl font-extrabold text-[#231F1E]">{t('my_account')}</h3>
            <p className="text-xs text-stone-500">{user.email}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-stone-100 text-stone-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex overflow-x-auto bg-white px-6 border-b border-[#EDE6DD] gap-2 no-scrollbar">
          {[
            { id: 'profile', label: t('account_tab_profile'), icon: User },
            { id: 'addresses', label: t('account_tab_addresses'), icon: MapPin },
            { id: 'payments', label: t('account_tab_payments'), icon: CreditCard },
            { id: 'orders', label: t('account_tab_orders'), icon: Package },
            { id: 'tickets', label: t('account_tab_tickets'), icon: MessageSquare },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3.5 px-4 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'border-[#231F1E] text-[#231F1E]'
                  : 'border-transparent text-stone-500 hover:text-[#231F1E]'
              }`}
            >
              <tab.icon className="w-4 h-4 text-[#C4A484]" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB 1: PROFILE */}
          {activeTab === 'profile' && (
            <form
              onSubmit={handleSaveProfile}
              className="bg-white p-6 rounded-2xl border border-[#EDE6DD] space-y-4 max-w-xl"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1">
                    {t('full_name')}
                  </label>
                  <input
                    type="text"
                    value={profileForm.full_name}
                    onChange={e => setProfileForm({ ...profileForm, full_name: e.target.value })}
                    className="w-full bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3.5 py-2.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1">
                    {t('phone_label')}
                  </label>
                  <input
                    type="tel"
                    value={profileForm.phone}
                    onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="w-full bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3.5 py-2.5 text-xs"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="bg-[#231F1E] text-white px-6 py-3 rounded-xl text-xs font-bold hover:bg-[#3A3331]"
              >
                {t('save_changes')}
              </button>
            </form>
          )}

          {/* TAB 2: SAVED ADDRESSES */}
          {activeTab === 'addresses' && (
            <div className="space-y-6">
              <form
                onSubmit={handleAddAddress}
                className="bg-white p-5 rounded-2xl border border-[#EDE6DD] space-y-3"
              >
                <h4 className="font-bold text-sm text-[#231F1E] flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-[#C4A484]" />
                  <span>{t('add_new_address')}</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    required
                    placeholder={t('address_label_placeholder')}
                    value={addrForm.label}
                    onChange={e => setAddrForm({ ...addrForm, label: e.target.value })}
                    className="bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3.5 py-2 text-xs"
                  />
                  <input
                    type="text"
                    required
                    placeholder={t('full_name')}
                    value={addrForm.recipient_name}
                    onChange={e => setAddrForm({ ...addrForm, recipient_name: e.target.value })}
                    className="bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3.5 py-2 text-xs"
                  />
                  <input
                    type="tel"
                    required
                    placeholder={t('phone_label')}
                    value={addrForm.phone}
                    onChange={e => setAddrForm({ ...addrForm, phone: e.target.value })}
                    className="bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3.5 py-2 text-xs"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    required
                    placeholder={t('shipping_address')}
                    value={addrForm.address_line1}
                    onChange={e => setAddrForm({ ...addrForm, address_line1: e.target.value })}
                    className="bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3.5 py-2 text-xs"
                  />
                  <input
                    type="text"
                    required
                    placeholder={t('city')}
                    value={addrForm.city}
                    onChange={e => setAddrForm({ ...addrForm, city: e.target.value })}
                    className="bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3.5 py-2 text-xs"
                  />
                  <input
                    type="text"
                    required
                    placeholder={t('postal_code')}
                    value={addrForm.postal_code}
                    onChange={e => setAddrForm({ ...addrForm, postal_code: e.target.value })}
                    className="bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3.5 py-2 text-xs"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-[#231F1E] text-white px-5 py-2.5 rounded-xl text-xs font-bold"
                >
                  {t('add_new_address')}
                </button>
              </form>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {addresses.map(a => (
                  <div
                    key={a.id}
                    className="bg-white p-4 rounded-2xl border border-[#EDE6DD] flex justify-between items-start"
                  >
                    <div className="text-xs space-y-1">
                      <span className="font-extrabold text-[#231F1E]">
                        {a.label} • {a.recipient_name}
                      </span>
                      <p className="text-stone-600">
                        {a.address_line1}, {a.city} ({a.postal_code})
                      </p>
                      <p className="text-stone-400">{a.phone}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteAddress(a.id)}
                      className="text-stone-400 hover:text-red-600 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: SAVED PAYMENTS */}
          {activeTab === 'payments' && (
            <div className="space-y-6">
              <form
                onSubmit={handleAddCard}
                className="bg-white p-5 rounded-2xl border border-[#EDE6DD] space-y-3"
              >
                <h4 className="font-bold text-sm text-[#231F1E]">{t('add_new_card')}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    required
                    placeholder={t('card_holder')}
                    value={cardForm.cardholder_name}
                    onChange={e => setCardForm({ ...cardForm, cardholder_name: e.target.value })}
                    className="bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3.5 py-2 text-xs"
                  />
                  <input
                    type="text"
                    required
                    placeholder={t('card_number')}
                    value={cardForm.card_number}
                    onChange={e => setCardForm({ ...cardForm, card_number: e.target.value })}
                    className="bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3.5 py-2 text-xs font-mono"
                  />
                  <input
                    type="text"
                    required
                    placeholder={t('card_expiry')}
                    value={cardForm.expiry}
                    onChange={e => setCardForm({ ...cardForm, expiry: e.target.value })}
                    className="bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3.5 py-2 text-xs font-mono"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-[#231F1E] text-white px-5 py-2.5 rounded-xl text-xs font-bold"
                >
                  {t('save_changes')}
                </button>
              </form>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {paymentMethods.map(pm => (
                  <div
                    key={pm.id}
                    className="bg-white p-4 rounded-2xl border border-[#EDE6DD] flex justify-between items-center"
                  >
                    <div className="text-xs">
                      <p className="font-extrabold text-[#231F1E]">
                        {pm.card_brand} •••• {pm.last4}
                      </p>
                      <p className="text-stone-500">
                        {pm.cardholder_name} ({pm.exp_month}/{pm.exp_year})
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteCard(pm.id)}
                      className="text-stone-400 hover:text-red-600 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: CUSTOMER ORDERS */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              {customerOrders.length === 0 ? (
                <p className="text-center py-12 text-stone-400 text-xs font-bold">
                  {t('no_orders_yet')}
                </p>
              ) : (
                customerOrders.map(ord => (
                  <div
                    key={ord.id}
                    className="bg-white p-5 rounded-2xl border border-[#EDE6DD] space-y-3"
                  >
                    <div className="flex flex-wrap justify-between items-center gap-2 border-b pb-3">
                      <div>
                        <span className="font-extrabold text-sm text-[#231F1E]">
                          {ord.order_number || ord.id.slice(0, 8)}
                        </span>
                        <span className="text-xs text-stone-400 ms-2">
                          {new Date(ord.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#EAE2D7] text-[#231F1E]">
                          {ord.status}
                        </span>
                        <span className="font-extrabold text-sm text-[#231F1E]">
                          {ord.total_amount.toFixed(2)} {t('currency')}
                        </span>
                      </div>
                    </div>

                    {ord.tracking_number && (
                      <div className="text-xs text-amber-800 font-bold flex items-center justify-between bg-[#FAF7F2] px-3.5 py-2 rounded-xl">
                        <span>
                          {ord.courier_name} — AWB: #{ord.tracking_number}
                        </span>
                        <Link
                          href={`/track?order=${encodeURIComponent(ord.order_number || ord.id)}`}
                          onClick={onClose}
                          className="underline flex items-center gap-1"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>{t('track_your_order')}</span>
                        </Link>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => onReorder(ord.items || [])}
                        className="bg-[#231F1E] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>{t('reorder_btn')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="bg-[#FAF7F2] border border-[#EDE6DD] text-[#231F1E] px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>{t('print_invoice')}</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 5: SUPPORT TICKETS */}
          {activeTab === 'tickets' && (
            <div className="space-y-6">
              <form
                onSubmit={handleCreateTicket}
                className="bg-white p-5 rounded-2xl border border-[#EDE6DD] space-y-3"
              >
                <h4 className="font-bold text-sm text-[#231F1E]">{t('new_ticket_btn')}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    required
                    placeholder={t('ticket_subject_placeholder')}
                    value={newTicket.subject}
                    onChange={e => setNewTicket({ ...newTicket, subject: e.target.value })}
                    className="sm:col-span-2 bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3.5 py-2 text-xs"
                  />
                  <select
                    value={newTicket.category}
                    onChange={e => setNewTicket({ ...newTicket, category: e.target.value as any })}
                    className="bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3.5 py-2 text-xs font-bold"
                  >
                    <option value="Order Issue">Order Issue</option>
                    <option value="Shipping & Courier">Shipping & Courier</option>
                    <option value="Coffee Quality">Coffee Quality</option>
                    <option value="Payment & Billing">Payment & Billing</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <textarea
                  required
                  placeholder={t('ticket_message_placeholder')}
                  rows={3}
                  value={newTicket.body}
                  onChange={e => setNewTicket({ ...newTicket, body: e.target.value })}
                  className="w-full bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3.5 py-2 text-xs"
                />
                <button
                  type="submit"
                  className="bg-[#231F1E] text-white px-5 py-2.5 rounded-xl text-xs font-bold"
                >
                  {t('ticket_submit_btn')}
                </button>
              </form>

              <div className="space-y-4">
                {tickets.map(tk => (
                  <div key={tk.id} className="bg-white p-5 rounded-2xl border border-[#EDE6DD]">
                    <div className="flex justify-between items-center mb-2">
                      <h5 className="font-bold text-[#231F1E] text-sm">
                        {tk.ticket_number} — {tk.subject}
                      </h5>
                      <span className="text-[10px] px-2.5 py-1 rounded-full bg-[#EAE2D7] text-[#231F1E] font-bold">
                        {tk.status}
                      </span>
                    </div>
                    <div className="space-y-3 mt-4 border-t pt-4">
                      {(tk.messages || []).map((m, i) => (
                        <div
                          key={i}
                          className={`p-3 rounded-xl text-xs ${
                            m.sender_role === 'staff'
                              ? 'bg-[#FAF7F2] border border-[#C4A484]/40 ms-6'
                              : 'bg-white border me-6'
                          }`}
                        >
                          <strong className="block mb-1 text-[#C4A484]">
                            {m.sender_name} ({m.sender_role})
                          </strong>
                          {m.body}
                        </div>
                      ))}
                    </div>

                    {tk.status !== 'Closed' && (
                      <div className="flex gap-2 mt-4 pt-3 border-t border-stone-100">
                        <input
                          type="text"
                          placeholder={t('ticket_reply_placeholder')}
                          value={replyMap[tk.id] || ''}
                          onChange={e =>
                            setReplyMap(prev => ({ ...prev, [tk.id]: e.target.value }))
                          }
                          className="flex-1 bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3.5 py-2 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => handleCustomerReply(tk)}
                          className="bg-[#231F1E] text-white px-4 py-2 rounded-xl text-xs font-bold"
                        >
                          {t('ticket_send_reply')}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}