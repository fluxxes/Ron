// Copyright (c) 2026 (RON). Developed by (fluxes) All rights reserved.
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Product, Order, OrderStatus, SupportTicket } from '../types/coffee';
import { localizeProduct } from '../data/products';
import {
  Package,
  ShoppingBag,
  MessageSquare,
  Plus,
  Edit2,
  Trash2,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Globe,
  Search,
  Download,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '../lib/useTranslation';

export default function StaffPage() {
  const router = useRouter();
  const { lang, t, toggleLanguage, translateStatus } = useTranslation();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'tickets'>('orders');

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Product Modal State
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    const { data: prodData } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    if (prodData) setProducts(prodData.map(p => localizeProduct(p)));

    const { data: ordData } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    if (ordData) setOrders(ordData);

    const { data: tktData } = await supabase
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false });
    if (tktData) setTickets(tktData as SupportTicket[]);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) return router.push('/');
      supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()
        .then(({ data }) => {
          if (data?.role === 'staff') {
            setUser(session.user);
            setLoading(false);
            void fetchData();
          } else {
            router.push('/');
          }
        });
    });
  }, [router, fetchData]);

  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', orderId);
    void fetchData();
  };

  const handleUpdateCourierInfo = async (
    orderId: string,
    courier_provider: 'smsa' | 'saudi_post',
    tracking_number: string
  ) => {
    const courier_name = courier_provider === 'saudi_post' ? 'Saudi Post (SPL)' : 'SMSA Express';
    const waybill_url =
      courier_provider === 'saudi_post'
        ? `https://splonline.com.sa/ar/tracking/?awb=${tracking_number}`
        : `https://www.smsaexpress.com/sa/ar/trackingdetails?tracknumbers=${tracking_number}`;
    await supabase
      .from('orders')
      .update({
        courier_provider,
        courier_name,
        tracking_number,
        waybill_url,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);
    void fetchData();
  };

  const handleQuickStockAdjust = async (product: Product, delta: number) => {
    const nextStock = Math.max(0, product.stock_quantity + delta);
    await supabase.from('products').update({ stock_quantity: nextStock }).eq('id', product.id);
    void fetchData();
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    const payload = {
      name: editingProduct.name || 'RON Specialty Coffee',
      name_ar: editingProduct.name_ar || editingProduct.name || 'قهوة رون المختصة',
      category: editingProduct.category || 'Crops',
      origin: editingProduct.origin || 'Ethiopia',
      origin_ar: editingProduct.origin_ar || 'إثيوبيا',
      region: editingProduct.region || '',
      region_ar: editingProduct.region_ar || '',
      process: editingProduct.process || 'Washed',
      process_ar: editingProduct.process_ar || 'مغسولة',
      altitude: editingProduct.altitude || '1,800m',
      roast_level: editingProduct.roast_level || 'Medium',
      description: editingProduct.description || '',
      description_ar: editingProduct.description_ar || '',
      price: Number(editingProduct.price) || 50,
      stock_quantity: Number(editingProduct.stock_quantity) || 0,
      image:
        editingProduct.image ||
        'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=800&auto=format&fit=crop',
      bestseller: Boolean(editingProduct.bestseller),
    };

    if (editingProduct.id) {
      await supabase.from('products').update(payload).eq('id', editingProduct.id);
    } else {
      await supabase.from('products').insert([payload]);
    }
    setIsProductModalOpen(false);
    setEditingProduct(null);
    void fetchData();
  };

  const handleDeleteProduct = async (id: string) => {
    await supabase.from('products').delete().eq('id', id);
    void fetchData();
  };

  const handleTicketReply = async (ticket: SupportTicket, replyBody: string) => {
    if (!replyBody.trim()) return;
    const nextMsgs = [
      ...(ticket.messages || []),
      {
        id: Date.now().toString(),
        sender_role: 'staff' as const,
        sender_name: user.email,
        body: replyBody.trim(),
        created_at: new Date().toISOString(),
      },
    ];
    await supabase
      .from('support_tickets')
      .update({
        messages: nextMsgs,
        status: 'In Progress',
        updated_at: new Date().toISOString(),
      })
      .eq('id', ticket.id);
    void fetchData();
  };

  const exportOrdersCsv = () => {
    const headers = [
      'OrderNumber',
      'Customer',
      'Email',
      'Phone',
      'City',
      'TotalSAR',
      'Status',
      'Courier',
      'AWB',
      'CreatedAt',
    ];
    const rows = orders.map(o => [
      o.order_number || o.id,
      `"${o.customer_name}"`,
      o.customer_email,
      o.customer_phone || '',
      `"${o.city}"`,
      o.total_amount,
      o.status,
      o.courier_name || 'SMSA Express',
      o.tracking_number || '',
      o.created_at,
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ron-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const filteredOrders = useMemo(
    () =>
      orders.filter(
        o =>
          !searchQuery ||
          o.order_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          o.tracking_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          o.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          o.customer_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          o.city.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [orders, searchQuery]
  );

  const totalRevenue = orders
    .filter(o => o.status !== 'Cancelled')
    .reduce((s, o) => s + Number(o.total_amount || 0), 0);
  const lowStockCount = products.filter(p => p.stock_quantity <= 10).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center text-xs font-bold">
        {t('staff_verifying')}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#231F1E]">
      <header className="bg-[#231F1E] text-white shadow-md h-16 sm:h-20 flex items-center px-4 sm:px-6 justify-between">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="bg-stone-800 p-2.5 rounded-xl hover:bg-stone-700 font-bold text-xs flex items-center gap-1.5"
          >
            {lang === 'ar' ? (
              <ArrowRight className="w-4 h-4" />
            ) : (
              <ArrowLeft className="w-4 h-4" />
            )}
            <span>{t('back_to_store')}</span>
          </button>
          <div className="flex items-center gap-2 text-[#C4A484] font-extrabold">
            <ShieldCheck className="w-6 h-6" />
            <span className="text-white text-sm sm:text-base">{t('staff_title')}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={toggleLanguage}
          className="bg-stone-800 text-stone-200 px-3.5 py-2 rounded-full text-xs font-bold hover:bg-stone-700 flex items-center gap-1.5"
        >
          <Globe className="w-3.5 h-3.5" />
          <span>{lang === 'ar' ? 'English' : 'العربية'}</span>
        </button>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-[#EDE6DD] shadow-sm">
            <span className="text-xs font-bold text-stone-400 uppercase">
              {t('kpi_total_orders')}
            </span>
            <p className="text-3xl font-extrabold mt-1">{orders.length}</p>
          </div>
          <div className="bg-white p-5 rounded-3xl border border-[#EDE6DD] shadow-sm">
            <span className="text-xs font-bold text-stone-400 uppercase">{t('kpi_revenue')}</span>
            <p className="text-2xl font-extrabold text-emerald-700 mt-1">
              {totalRevenue.toFixed(2)} {t('currency')}
            </p>
          </div>
          <div className="bg-white p-5 rounded-3xl border border-[#EDE6DD] shadow-sm">
            <span className="text-xs font-bold text-stone-400 uppercase">
              {t('kpi_open_tickets')}
            </span>
            <p className="text-3xl font-extrabold text-amber-700 mt-1">
              {tickets.filter(tk => tk.status !== 'Closed').length}
            </p>
          </div>
          <div className="bg-white p-5 rounded-3xl border border-[#EDE6DD] shadow-sm">
            <span className="text-xs font-bold text-stone-400 uppercase">
              {t('kpi_low_stock')}
            </span>
            <p className="text-3xl font-extrabold text-red-600 mt-1">{lowStockCount}</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 border-b border-[#EDE6DD] pb-3 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`px-5 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 ${
              activeTab === 'orders' ? 'bg-[#231F1E] text-white' : 'bg-white text-stone-700 border'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>
              {t('tab_orders')} ({orders.length})
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('products')}
            className={`px-5 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 ${
              activeTab === 'products'
                ? 'bg-[#231F1E] text-white'
                : 'bg-white text-stone-700 border'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>
              {t('tab_products')} ({products.length})
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tickets')}
            className={`px-5 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 ${
              activeTab === 'tickets' ? 'bg-[#231F1E] text-white' : 'bg-white text-stone-700 border'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>
              {t('tab_tickets')} ({tickets.length})
            </span>
          </button>
        </div>

        {/* TAB 1: ORDERS & AUTO-FULFILLMENT */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="bg-white p-3.5 rounded-3xl border border-[#EDE6DD] flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-4 h-4 text-stone-400 absolute top-1/2 -translate-y-1/2 start-3.5" />
                <input
                  type="text"
                  placeholder={t('staff_search_orders')}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-[#FAF7F2] border rounded-xl ps-9 pe-4 py-2.5 text-xs"
                />
              </div>
              <button
                type="button"
                onClick={exportOrdersCsv}
                className="bg-[#231F1E] text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>{t('export_csv')}</span>
              </button>
            </div>

            {filteredOrders.map(o => (
              <div
                key={o.id}
                className="bg-white p-6 rounded-3xl border border-[#EDE6DD] shadow-sm space-y-4"
              >
                <div className="flex flex-col lg:flex-row justify-between gap-4 border-b border-stone-100 pb-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="font-extrabold text-sm">
                        {o.order_number || o.id.slice(0, 8)}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#EAE2D7] text-[#5A4D41]">
                        {translateStatus(o.status)}
                      </span>
                      {o.auto_fulfilled && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Zero-Touch Auto
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-stone-700">
                      {o.customer_name} • {o.customer_email} • {o.customer_phone}
                    </p>
                    <p className="text-xs text-stone-500">
                      {o.address}, {o.city} ({o.postal_code}){' '}
                      {o.national_address ? `• ${o.national_address}` : ''}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-extrabold text-base text-[#231F1E]">
                      {Number(o.total_amount).toFixed(2)} {t('currency')}
                    </span>
                    <select
                      value={o.status}
                      onChange={e =>
                        handleUpdateOrderStatus(o.id, e.target.value as OrderStatus)
                      }
                      className="bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3 py-2 text-xs font-bold"
                    >
                      <option value="Processing">Processing</option>
                      <option value="Roasted & Packed">Roasted & Packed</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div className="flex flex-wrap gap-2">
                    {(o.items || []).map((item, idx) => (
                      <span
                        key={idx}
                        className="bg-[#FAF7F2] border border-[#EDE6DD] px-3 py-1.5 rounded-xl font-bold"
                      >
                        {item.quantity}x {lang === 'ar' && item.name_ar ? item.name_ar : item.name}{' '}
                        ({item.selectedWeight} / {item.selectedGrind})
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={o.courier_provider || 'smsa'}
                      onChange={e =>
                        handleUpdateCourierInfo(
                          o.id,
                          e.target.value as 'smsa' | 'saudi_post',
                          o.tracking_number || ''
                        )
                      }
                      className="bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-2.5 py-1.5 text-xs font-bold"
                    >
                      <option value="smsa">SMSA Express</option>
                      <option value="saudi_post">Saudi Post (SPL)</option>
                    </select>
                    <input
                      type="text"
                      defaultValue={o.tracking_number || ''}
                      placeholder={t('courier_input_placeholder')}
                      onBlur={e =>
                        handleUpdateCourierInfo(
                          o.id,
                          (o.courier_provider as any) || 'smsa',
                          e.target.value
                        )
                      }
                      className="bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3 py-1.5 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 2: SUPABASE PRODUCTS & STOCK */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setEditingProduct({
                    name: '',
                    name_ar: '',
                    category: 'Crops',
                    origin: 'Ethiopia',
                    origin_ar: 'إثيوبيا',
                    roast_level: 'Medium',
                    price: 55,
                    stock_quantity: 50,
                    image: '',
                    description: '',
                    description_ar: '',
                    bestseller: false,
                  });
                  setIsProductModalOpen(true);
                }}
                className="bg-[#231F1E] text-white px-5 py-3 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>{t('add_product_btn')}</span>
              </button>
            </div>

            <div className="bg-white rounded-3xl border border-[#EDE6DD] overflow-hidden shadow-sm">
              <table className="w-full text-start text-xs">
                <thead className="bg-[#FAF7F2] border-b border-[#EDE6DD] font-extrabold">
                  <tr>
                    <th className="p-4 text-start">{t('col_product')}</th>
                    <th className="p-4 text-start">{t('col_category')}</th>
                    <th className="p-4 text-start">{t('col_price')}</th>
                    <th className="p-4 text-start">{t('col_stock')}</th>
                    <th className="p-4 text-end">{t('col_actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {products.map(p => (
                    <tr key={p.id} className="hover:bg-[#FAF7F2]/50">
                      <td className="p-4 flex items-center gap-3">
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-11 h-11 rounded-xl object-cover bg-stone-100"
                        />
                        <div>
                          <p className="font-extrabold text-[#231F1E]">{p.name_ar || p.name}</p>
                          <p className="text-stone-400">{p.name}</p>
                        </div>
                      </td>
                      <td className="p-4 font-bold">
                        {p.category} • {p.roast_level}
                      </td>
                      <td className="p-4 font-extrabold">
                        {p.price.toFixed(2)} {t('currency')}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleQuickStockAdjust(p, -5)}
                            className="px-2 py-1 rounded-lg bg-stone-100 font-bold"
                          >
                            -5
                          </button>
                          <span
                            className={`font-extrabold ${
                              p.stock_quantity <= 10 ? 'text-red-600' : 'text-emerald-700'
                            }`}
                          >
                            {p.stock_quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleQuickStockAdjust(p, 5)}
                            className="px-2 py-1 rounded-lg bg-stone-100 font-bold"
                          >
                            +5
                          </button>
                        </div>
                      </td>
                      <td className="p-4 text-end space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingProduct(p);
                            setIsProductModalOpen(true);
                          }}
                          className="p-2 text-stone-600 hover:text-[#231F1E]"
                        >
                          <Edit2 className="w-4 h-4 inline" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(p.id)}
                          className="p-2 text-stone-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: CUSTOMER SUPPORT TICKETS */}
        {activeTab === 'tickets' && (
          <div className="space-y-4">
            {tickets.map(tk => (
              <div
                key={tk.id}
                className="bg-white p-6 rounded-3xl border border-[#EDE6DD] shadow-sm"
              >
                <div className="flex justify-between items-start border-b pb-4 mb-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-stone-400">
                      {tk.category} • {tk.priority} Priority
                    </span>
                    <h4 className="font-extrabold text-lg text-[#231F1E]">
                      {tk.ticket_number} - {tk.subject}
                    </h4>
                    <p className="text-xs font-bold text-stone-600 mt-1">
                      {tk.customer_name} ({tk.customer_email})
                    </p>
                  </div>
                  <select
                    value={tk.status}
                    onChange={async e => {
                      await supabase
                        .from('support_tickets')
                        .update({ status: e.target.value })
                        .eq('id', tk.id);
                      void fetchData();
                    }}
                    className="bg-[#FAF7F2] border rounded-xl px-3 py-1.5 text-xs font-bold"
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>

                <div className="space-y-3 mb-4">
                  {(tk.messages || []).map((m, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-xl text-xs ${
                        m.sender_role === 'staff' ? 'bg-[#FAF7F2] ms-8' : 'bg-white border me-8'
                      }`}
                    >
                      <strong className="block mb-1 text-[#C4A484]">{m.sender_name}</strong>
                      {m.body}
                    </div>
                  ))}
                </div>

                <form
                  onSubmit={e => {
                    e.preventDefault();
                    const tForm = e.target as any;
                    void handleTicketReply(tk, tForm.reply.value);
                    tForm.reset();
                  }}
                  className="flex gap-2"
                >
                  <input
                    name="reply"
                    type="text"
                    placeholder={t('ticket_reply_placeholder')}
                    required
                    className="flex-1 bg-[#FAF7F2] border rounded-xl px-4 py-2 text-xs"
                  />
                  <button
                    type="submit"
                    className="bg-[#231F1E] text-white px-4 py-2 rounded-xl text-xs font-bold"
                  >
                    {t('ticket_send_reply')}
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}

        {/* Add / Edit Product Modal */}
        {isProductModalOpen && editingProduct && (
          <div className="fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative border border-[#EDE6DD] max-h-[90vh] overflow-y-auto">
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="absolute top-5 end-5 text-stone-400 hover:text-stone-800"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="font-extrabold text-lg text-[#231F1E] mb-4">
                {editingProduct.id ? t('edit_product_title') : t('new_product_title')}
              </h3>
              <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    placeholder={t('arabic_name_label')}
                    value={editingProduct.name_ar || ''}
                    onChange={e =>
                      setEditingProduct({ ...editingProduct, name_ar: e.target.value })
                    }
                    className="bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3.5 py-2.5"
                  />
                  <input
                    type="text"
                    required
                    placeholder={t('english_name_label')}
                    value={editingProduct.name || ''}
                    onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    className="bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3.5 py-2.5"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={editingProduct.category || 'Crops'}
                    onChange={e =>
                      setEditingProduct({ ...editingProduct, category: e.target.value as any })
                    }
                    className="bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3 py-2.5 font-bold"
                  >
                    <option value="Crops">Crops</option>
                    <option value="Boxes">Boxes</option>
                    <option value="Tools">Tools</option>
                  </select>
                  <select
                    value={editingProduct.roast_level || 'Medium'}
                    onChange={e =>
                      setEditingProduct({ ...editingProduct, roast_level: e.target.value as any })
                    }
                    className="bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3 py-2.5 font-bold"
                  >
                    <option value="Light">Light</option>
                    <option value="Medium">Medium</option>
                    <option value="Dark">Dark</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Origin"
                    value={editingProduct.origin || ''}
                    onChange={e =>
                      setEditingProduct({ ...editingProduct, origin: e.target.value })
                    }
                    className="bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3 py-2.5"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    step="0.5"
                    required
                    placeholder={t('col_price')}
                    value={editingProduct.price ?? 50}
                    onChange={e =>
                      setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) })
                    }
                    className="bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3.5 py-2.5"
                  />
                  <input
                    type="number"
                    required
                    placeholder={t('col_stock')}
                    value={editingProduct.stock_quantity ?? 25}
                    onChange={e =>
                      setEditingProduct({
                        ...editingProduct,
                        stock_quantity: parseInt(e.target.value, 10),
                      })
                    }
                    className="bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3.5 py-2.5"
                  />
                </div>

                <input
                  type="text"
                  placeholder={t('image_url_label')}
                  value={editingProduct.image || ''}
                  onChange={e => setEditingProduct({ ...editingProduct, image: e.target.value })}
                  className="w-full bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3.5 py-2.5"
                />

                <textarea
                  rows={2}
                  placeholder={t('arabic_desc_label')}
                  value={editingProduct.description_ar || ''}
                  onChange={e =>
                    setEditingProduct({ ...editingProduct, description_ar: e.target.value })
                  }
                  className="w-full bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3.5 py-2.5"
                />

                <textarea
                  rows={2}
                  placeholder={t('english_desc_label')}
                  value={editingProduct.description || ''}
                  onChange={e =>
                    setEditingProduct({ ...editingProduct, description: e.target.value })
                  }
                  className="w-full bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3.5 py-2.5"
                />

                <button
                  type="submit"
                  className="w-full bg-[#231F1E] text-white py-3.5 rounded-xl font-bold"
                >
                  {t('save_product_btn')}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}