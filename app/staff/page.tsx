'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Product, Order, OrderStatus } from '../types/coffee';
import { PRODUCTS, localizeProduct } from '../data/products';
import {
  Package,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  Edit2,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Globe,
  CheckCircle2,
  Search,
  Download,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '../lib/useTranslation';

export default function StaffPage() {
  const router = useRouter();
  const { lang, t, toggleLanguage, translateOption, translateStatus } = useTranslation();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'products'>('orders');

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  const [banner, setBanner] = useState<string | null>(null);
  const notify = (msg: string) => {
    setBanner(msg);
    setTimeout(() => setBanner(null), 3500);
  };

  const [orderFilter, setOrderFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const { data: prodData } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    if (prodData && prodData.length > 0) {
      setProducts(prodData.map(p => localizeProduct(p)));
    } else {
      setProducts(PRODUCTS);
    }

    const { data: ordData } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    if (ordData) setOrders(ordData);
  }, []);

  const checkStaffAuth = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) {
      router.push('/');
      return;
    }
    setUser(session.user);
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
    if (!profile || profile.role !== 'staff') {
      router.push('/');
      return;
    }
    setLoading(false);
    fetchData();
  }, [router, fetchData]);

  useEffect(() => {
    checkStaffAuth();
  }, [checkStaffAuth]);

  const handleQuickStockAdjust = async (product: Product, delta: number) => {
    const nextStock = Math.max(0, (product.stock_quantity || 0) + delta);
    await supabase.from('products').update({ stock_quantity: nextStock }).eq('id', product.id);
    setProducts(prev =>
      prev.map(p => (p.id === product.id ? { ...p, stock_quantity: nextStock } : p))
    );
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    const payload = {
      ...editingProduct,
      id:
        editingProduct.id ||
        editingProduct.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') ||
        `ron-lot-${Date.now()}`,
    };

    const { error } = await supabase.from('products').upsert([payload]);
    if (error) notify(`Error: ${error.message}`);
    else notify(lang === 'ar' ? 'تم تحديث الكتالوج بنجاح' : 'Catalog updated!');

    setIsProductModalOpen(false);
    setEditingProduct(null);
    fetchData();
  };

  const handleConfirmDeleteProduct = async (id: string) => {
    await supabase.from('products').delete().eq('id', id);
    setConfirmDeleteId(null);
    notify(lang === 'ar' ? 'تم حذف المنتج' : 'Product removed.');
    fetchData();
  };

  const updateOrderStatus = async (
    order: Order,
    status: OrderStatus,
    tracking_number?: string
  ) => {
    if (status === 'Cancelled' && order.status !== 'Cancelled') {
      for (const item of order.items || []) {
        const target = products.find(p => p.id === item.productId);
        if (target) {
          await supabase
            .from('products')
            .update({ stock_quantity: target.stock_quantity + item.quantity })
            .eq('id', item.productId);
        }
      }
    }

    const nextHistory = [
      ...(order.status_history || []),
      { status, timestamp: new Date().toISOString() },
    ];

    await supabase
      .from('orders')
      .update({
        status,
        tracking_number: tracking_number ?? order.tracking_number ?? '',
        status_history: nextHistory,
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id);

    notify(`${order.order_number || order.id.slice(0, 8)} → ${translateStatus(status)}`);
    fetchData();
  };

  const handleBulkStatusUpdate = async (newStatus: OrderStatus) => {
    if (selectedOrderIds.length === 0) return;
    await supabase
      .from('orders')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .in('id', selectedOrderIds);
    notify(`Updated ${selectedOrderIds.length} → ${translateStatus(newStatus)}`);
    setSelectedOrderIds([]);
    fetchData();
  };

  const exportOrdersCSV = () => {
    const headers = [
      'OrderNumber',
      'Customer',
      'Email',
      'Phone',
      'City',
      'TotalSAR',
      'PaymentMethod',
      'Status',
      'TrackingNumber',
      'CreatedAt',
    ];
    const rows = filteredOrders.map(o => [
      o.order_number || o.id,
      `"${o.customer_name}"`,
      o.customer_email,
      o.customer_phone || '',
      `"${o.city}"`,
      o.total_amount.toFixed(2),
      o.payment_method || 'card',
      o.status,
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

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchesStatus = orderFilter === 'All' || o.status === orderFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        (o.order_number && o.order_number.toLowerCase().includes(q)) ||
        o.id.toLowerCase().includes(q) ||
        o.customer_name.toLowerCase().includes(q) ||
        o.customer_email.toLowerCase().includes(q) ||
        (o.customer_phone && o.customer_phone.toLowerCase().includes(q)) ||
        o.city.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [orders, orderFilter, searchQuery]);

  const totalRevenue = orders
    .filter(o => o.status !== 'Cancelled')
    .reduce((s, o) => s + Number(o.total_amount || 0), 0);
  const activeQueueCount = orders.filter(
    o => o.status === 'Processing' || o.status === 'Roasted & Packed'
  ).length;
  const lowStockCount = products.filter(p => p.stock_quantity <= 10).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
        <p className="text-stone-600 font-bold text-sm">{t('staff_verifying')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#231F1E]">
      {banner && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#231F1E] text-[#FAF7F2] px-5 py-3 rounded-full shadow-xl border border-[#C4A484] text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#C4A484]" />
          <span>{banner}</span>
        </div>
      )}

      <header className="bg-[#231F1E] text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-4">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="bg-stone-800 p-2 sm:p-2.5 rounded-xl hover:bg-stone-700 transition-all flex items-center gap-1.5 text-xs font-bold"
            >
              {lang === 'ar' ? (
                <ArrowRight className="w-4 h-4" />
              ) : (
                <ArrowLeft className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">{t('back_to_store')}</span>
            </button>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-[#C4A484]" />
              <span className="text-sm sm:text-xl font-extrabold tracking-tight">
                {t('staff_title')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={toggleLanguage}
              className="bg-stone-800 text-stone-200 px-3.5 py-2 rounded-full text-xs font-bold hover:bg-stone-700 transition-all flex items-center gap-1.5 border border-stone-700 cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-[#C4A484]" />
              <span>{lang === 'ar' ? 'English' : 'العربية'}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-8 space-y-6">
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-[#EDE6DD] shadow-sm">
            <span className="text-[10px] sm:text-xs font-bold text-stone-400 uppercase">
              {t('kpi_total_orders')}
            </span>
            <p className="text-xl sm:text-3xl font-extrabold text-[#231F1E] mt-1">
              {orders.length}
            </p>
          </div>
          <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-[#EDE6DD] shadow-sm">
            <span className="text-[10px] sm:text-xs font-bold text-stone-400 uppercase">
              {t('kpi_revenue')}
            </span>
            <p className="text-xl sm:text-3xl font-extrabold text-emerald-700 mt-1">
              {totalRevenue.toFixed(0)} {t('currency')}
            </p>
          </div>
          <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-[#EDE6DD] shadow-sm">
            <span className="text-[10px] sm:text-xs font-bold text-stone-400 uppercase">
              {t('kpi_roasting_queue')}
            </span>
            <p className="text-xl sm:text-3xl font-extrabold text-amber-700 mt-1">
              {activeQueueCount}
            </p>
          </div>
          <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-[#EDE6DD] shadow-sm">
            <span className="text-[10px] sm:text-xs font-bold text-stone-400 uppercase">
              {t('kpi_low_stock')}
            </span>
            <p className="text-xl sm:text-3xl font-extrabold text-red-600 mt-1">{lowStockCount}</p>
          </div>
        </div>

        <div className="flex gap-2 border-b border-[#EDE6DD] pb-3 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs whitespace-nowrap transition-all ${
              activeTab === 'orders'
                ? 'bg-[#231F1E] text-white shadow'
                : 'bg-white text-stone-700 border border-[#EDE6DD]'
            }`}
          >
            <ShoppingBag className="w-4 h-4" /> {t('tab_orders')} ({orders.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs whitespace-nowrap transition-all ${
              activeTab === 'products'
                ? 'bg-[#231F1E] text-white shadow'
                : 'bg-white text-stone-700 border border-[#EDE6DD]'
            }`}
          >
            <Package className="w-4 h-4" /> {t('tab_products')} ({products.length})
          </button>
        </div>

        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="bg-white p-3.5 rounded-2xl sm:rounded-3xl border border-[#EDE6DD] flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-stone-400 absolute top-1/2 -translate-y-1/2 start-3.5" />
                <input
                  type="text"
                  placeholder={t('staff_search_orders')}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl ps-9 pe-4 py-2.5 text-xs"
                />
              </div>

              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {['All', 'Processing', 'Roasted & Packed', 'Shipped', 'Completed', 'Cancelled'].map(
                  st => (
                    <button
                      type="button"
                      key={st}
                      onClick={() => setOrderFilter(st)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                        orderFilter === st
                          ? 'bg-[#231F1E] text-white'
                          : 'bg-[#FAF7F2] text-stone-600'
                      }`}
                    >
                      {st === 'All' ? t('filter_all') : translateStatus(st)}
                    </button>
                  )
                )}
              </div>

              <div className="flex items-center gap-2">
                {selectedOrderIds.length > 0 && (
                  <select
                    onChange={e => {
                      if (e.target.value) handleBulkStatusUpdate(e.target.value as OrderStatus);
                    }}
                    defaultValue=""
                    className="bg-amber-900 text-white px-3 py-2 rounded-xl text-xs font-bold"
                  >
                    <option value="" disabled>
                      {t('bulk_action_label')} ({selectedOrderIds.length})
                    </option>
                    <option value="Roasted & Packed">
                      {translateStatus('Roasted & Packed')}
                    </option>
                    <option value="Shipped">{translateStatus('Shipped')}</option>
                    <option value="Completed">{translateStatus('Completed')}</option>
                  </select>
                )}
                <button
                  type="button"
                  onClick={exportOrdersCSV}
                  className="bg-[#EAE2D7] text-[#231F1E] px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0"
                >
                  <Download className="w-3.5 h-3.5" /> {t('export_csv')}
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {filteredOrders.map(o => (
                <div
                  key={o.id}
                  className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-[#EDE6DD] shadow-sm flex flex-col lg:flex-row justify-between gap-4"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <input
                        type="checkbox"
                        checked={selectedOrderIds.includes(o.id)}
                        onChange={e => {
                          if (e.target.checked) setSelectedOrderIds([...selectedOrderIds, o.id]);
                          else setSelectedOrderIds(selectedOrderIds.filter(id => id !== o.id));
                        }}
                      />
                      <span className="font-extrabold text-sm text-[#231F1E]">
                        {o.order_number || `#${o.id.slice(0, 8)}`}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#EAE2D7] text-[#5A4D41]">
                        {translateStatus(o.status)}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-600 uppercase">
                        {o.payment_method || 'card'}
                      </span>
                    </div>

                    <p className="text-xs font-bold text-stone-700">
                      {o.customer_name} • {o.customer_phone || o.customer_email}
                    </p>
                    <p className="text-xs text-stone-500">
                      {o.address}, {o.city} ({o.postal_code})
                    </p>

                    <div className="bg-[#FAF7F2] p-3 rounded-xl border border-[#EDE6DD] space-y-1">
                      {o.items?.map((item, idx) => (
                        <p key={idx} className="text-xs font-bold text-[#231F1E]">
                          • {item.quantity}x{' '}
                          {lang === 'ar' && item.name_ar ? item.name_ar : item.name} (
                          {translateOption(item.selectedWeight)} •{' '}
                          {translateOption(item.selectedGrind)})
                        </p>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col justify-between items-start lg:items-end gap-3 border-t lg:border-t-0 lg:border-s border-[#EDE6DD] pt-3 lg:pt-0 lg:ps-6 min-w-[240px]">
                    <div className="flex lg:flex-col justify-between w-full lg:w-auto items-center lg:items-end">
                      <span className="text-[10px] uppercase font-bold text-stone-400">
                        {t('total')}
                      </span>
                      <p className="text-xl font-extrabold text-[#231F1E]">
                        {Number(o.total_amount).toFixed(2)} {t('currency')}
                      </p>
                    </div>

                    <input
                      type="text"
                      placeholder={t('courier_input_placeholder')}
                      defaultValue={o.tracking_number || ''}
                      onBlur={e => {
                        if (e.target.value !== (o.tracking_number || '')) {
                          updateOrderStatus(o, o.status, e.target.value);
                        }
                      }}
                      className="w-full bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3 py-2 text-xs"
                    />

                    <div className="flex flex-wrap gap-1.5 w-full lg:justify-end">
                      {(
                        [
                          'Processing',
                          'Roasted & Packed',
                          'Shipped',
                          'Completed',
                          'Cancelled',
                        ] as OrderStatus[]
                      ).map(st => (
                        <button
                          type="button"
                          key={st}
                          onClick={() => updateOrderStatus(o, st)}
                          className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                            o.status === st
                              ? 'bg-[#231F1E] text-white'
                              : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                          }`}
                        >
                          {translateStatus(st)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg sm:text-xl font-extrabold text-[#231F1E]">
                {t('tab_products')}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setEditingProduct({
                    name: '',
                    name_ar: '',
                    category: 'Crops',
                    origin: '',
                    origin_ar: '',
                    region: '',
                    price: 55.0,
                    stock_quantity: 40,
                    roast_level: 'Medium',
                    description: '',
                    description_ar: '',
                    image: '',
                    weight_options: ['250g', '500g', '1kg'],
                    grind_options: ['Whole Bean', 'Espresso', 'Pour Over / Drip', 'French Press'],
                    bestseller: false,
                  });
                  setIsProductModalOpen(true);
                }}
                className="bg-[#231F1E] text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow"
              >
                <Plus className="w-4 h-4" /> {t('add_product_btn')}
              </button>
            </div>

            <div className="bg-white rounded-3xl border border-[#EDE6DD] overflow-x-auto shadow-sm">
              <table className="w-full text-start border-collapse text-xs min-w-[600px]">
                <thead>
                  <tr className="bg-[#FAF7F2] border-b border-[#EDE6DD] font-extrabold text-stone-500 uppercase">
                    <th className="p-4">{t('col_product')}</th>
                    <th className="p-4">{t('col_category')}</th>
                    <th className="p-4">{t('col_price')}</th>
                    <th className="p-4">{t('col_stock')}</th>
                    <th className="p-4 text-end">{t('col_actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {products.map(p => (
                    <tr key={p.id} className="hover:bg-[#FAF7F2]/60">
                      <td className="p-4 flex items-center gap-3">
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-11 h-11 rounded-xl object-cover bg-stone-100 shrink-0"
                        />
                        <div>
                          <p className="font-extrabold text-[#231F1E]">{p.name_ar || p.name}</p>
                          <p className="text-stone-400 text-[11px]">{p.name}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-[#231F1E]">{p.category || 'Crops'}</span>
                        <span className="block text-[#9C7E5E] text-[11px]">{p.roast_level}</span>
                      </td>
                      <td className="p-4 font-extrabold">
                        {p.price.toFixed(2)} {t('currency')}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleQuickStockAdjust(p, -1)}
                            className="w-6 h-6 rounded-lg bg-stone-100 hover:bg-stone-200 flex items-center justify-center"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span
                            className={`px-2.5 py-1 rounded-full font-bold ${
                              p.stock_quantity > 10
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {p.stock_quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleQuickStockAdjust(p, 1)}
                            className="w-6 h-6 rounded-lg bg-stone-100 hover:bg-stone-200 flex items-center justify-center"
                          >
                            <Plus className="w-3 h-3" />
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
                          className="p-2 bg-stone-100 text-stone-700 rounded-xl hover:bg-stone-200 inline-flex"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {confirmDeleteId === p.id ? (
                          <button
                            type="button"
                            onClick={() => handleConfirmDeleteProduct(p.id)}
                            className="px-3 py-1.5 bg-red-600 text-white rounded-xl font-bold text-[11px]"
                          >
                            {t('confirm_delete')}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(p.id)}
                            className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 inline-flex"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {isProductModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[92dvh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setIsProductModalOpen(false)}
              className="absolute top-5 end-5 p-2 rounded-full hover:bg-stone-100"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-extrabold mb-5">
              {editingProduct.id ? t('edit_product_title') : t('new_product_title')}
            </h3>
            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-500 mb-1">
                    {t('arabic_name_label')}
                  </label>
                  <input
                    type="text"
                    required
                    value={editingProduct.name_ar || ''}
                    onChange={e => setEditingProduct({ ...editingProduct, name_ar: e.target.value })}
                    className="w-full bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3.5 py-2.5"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-500 mb-1">
                    {t('english_name_label')}
                  </label>
                  <input
                    type="text"
                    required
                    value={editingProduct.name || ''}
                    onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    className="w-full bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3.5 py-2.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-stone-500 mb-1">
                    {t('col_category')}
                  </label>
                  <select
                    value={editingProduct.category || 'Crops'}
                    onChange={e =>
                      setEditingProduct({ ...editingProduct, category: e.target.value as any })
                    }
                    className="w-full bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3 py-2.5"
                  >
                    <option value="Crops">{t('filter_crops')}</option>
                    <option value="Boxes">{t('filter_boxes')}</option>
                    <option value="Tools">{t('filter_tools')}</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-stone-500 mb-1">
                    {t('col_price')} ({t('currency')})
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={editingProduct.price || 0}
                    onChange={e =>
                      setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) })
                    }
                    className="w-full bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3.5 py-2.5"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-500 mb-1">{t('col_stock')}</label>
                  <input
                    type="number"
                    required
                    value={editingProduct.stock_quantity || 0}
                    onChange={e =>
                      setEditingProduct({
                        ...editingProduct,
                        stock_quantity: parseInt(e.target.value),
                      })
                    }
                    className="w-full bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3.5 py-2.5"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-500 mb-1">
                  {t('image_url_label')}
                </label>
                <input
                  type="url"
                  required
                  value={editingProduct.image || ''}
                  onChange={e => setEditingProduct({ ...editingProduct, image: e.target.value })}
                  className="w-full bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3.5 py-2.5"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-500 mb-1">
                  {t('arabic_desc_label')}
                </label>
                <textarea
                  rows={2}
                  value={editingProduct.description_ar || ''}
                  onChange={e =>
                    setEditingProduct({ ...editingProduct, description_ar: e.target.value })
                  }
                  className="w-full bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3.5 py-2"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-500 mb-1">
                  {t('english_desc_label')}
                </label>
                <textarea
                  rows={2}
                  value={editingProduct.description || ''}
                  onChange={e =>
                    setEditingProduct({ ...editingProduct, description: e.target.value })
                  }
                  className="w-full bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3.5 py-2"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#231F1E] text-white py-3.5 rounded-xl font-bold hover:bg-[#3A3331]"
              >
                {t('save_product_btn')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}