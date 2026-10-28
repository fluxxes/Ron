'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Product, Order, OrderStatus } from '../types/coffee';
import { PRODUCTS } from '../data/products';
import {
  Package,
  ShoppingBag,
  Plus,
  Trash2,
  Edit2,
  ArrowLeft,
  ShieldCheck,
  Globe,
  CheckCircle2,
  Clock,
  Search,
  Download,
  AlertTriangle,
  Truck,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '../lib/useTranslation';

export default function StaffPage() {
  const router = useRouter();
  const { lang, t, toggleLanguage } = useTranslation();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'products'>('orders');

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // In-website Notification Banner
  const [banner, setBanner] = useState<string | null>(null);
  const notify = (msg: string) => {
    setBanner(msg);
    setTimeout(() => setBanner(null), 4000);
  };

  // High-volume Order Filtering, Bulk Selection & Pagination
  const [orderFilter, setOrderFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [pageSize, setPageSize] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Product Modal / Bilingual Editor
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const { data: prodData } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    if (prodData && prodData.length > 0) setProducts(prodData);
    else setProducts(PRODUCTS);

    const { data: ordData } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    if (ordData) setOrders(ordData);
  }, []);

  const checkStaffAuth = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
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
    else notify('Product catalog updated successfully!');

    setIsProductModalOpen(false);
    setEditingProduct(null);
    fetchData();
  };

  const handleConfirmDeleteProduct = async (id: string) => {
    await supabase.from('products').delete().eq('id', id);
    setConfirmDeleteId(null);
    notify('Product removed from catalog.');
    fetchData();
  };

  const updateOrderStatus = async (
    order: Order,
    status: OrderStatus,
    tracking_number?: string,
    staff_notes?: string
  ) => {
    // Restore stock automatically if an order is newly Cancelled
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
        staff_notes: staff_notes ?? order.staff_notes ?? '',
        status_history: nextHistory,
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id);

    notify(`Order ${order.order_number || order.id.slice(0, 8)} updated to ${status}`);
    fetchData();
  };

  const handleBulkStatusUpdate = async (newStatus: OrderStatus) => {
    if (selectedOrderIds.length === 0) return;
    await supabase
      .from('orders')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .in('id', selectedOrderIds);
    notify(`Updated ${selectedOrderIds.length} orders to ${newStatus}`);
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

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, currentPage, pageSize]);

  // Executive KPI Metrics
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
        <p className="text-stone-600 font-bold text-sm">Verifying Secure RŌN Staff Credentials...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#2C2825] font-sans">
      {banner && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-[#2C2825] text-[#FAF7F2] px-5 py-3 rounded-2xl shadow-xl border border-[#C4A484] text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#C4A484]" />
          <span>{banner}</span>
        </div>
      )}

      {/* Staff Top Header */}
      <header className="bg-[#2C2825] text-white shadow-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/')}
              className="bg-stone-800 p-2.5 rounded-xl hover:bg-stone-700 transition-all flex items-center gap-2 text-xs font-bold"
            >
              <ArrowLeft className="w-4 h-4" /> {t('back_to_store')}
            </button>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-[#C4A484]" />
              <span className="text-lg sm:text-xl font-extrabold tracking-tight">
                RŌN Operations & Fulfillment
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleLanguage}
              className="bg-stone-800 text-stone-200 px-3 py-2 rounded-xl text-xs font-bold hover:bg-stone-700 transition-all flex items-center gap-1.5 border border-stone-700"
            >
              <Globe className="w-4 h-4 text-[#C4A484]" />
              {lang === 'ar' ? 'EN' : 'عربي'}
            </button>
            <span className="text-xs text-stone-400 bg-stone-800 px-3 py-1.5 rounded-full hidden sm:inline">
              {user?.email}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        
        {/* Executive KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-[#EDE6DD] shadow-sm">
            <span className="text-xs font-bold text-stone-400 uppercase">Total Orders</span>
            <p className="text-3xl font-extrabold text-[#2C2825] mt-1">{orders.length}</p>
          </div>
          <div className="bg-white p-5 rounded-3xl border border-[#EDE6DD] shadow-sm">
            <span className="text-xs font-bold text-stone-400 uppercase">Total Revenue</span>
            <p className="text-3xl font-extrabold text-emerald-700 mt-1">
              {totalRevenue.toFixed(2)} SAR
            </p>
          </div>
          <div className="bg-white p-5 rounded-3xl border border-[#EDE6DD] shadow-sm">
            <span className="text-xs font-bold text-stone-400 uppercase">Active Roasting Queue</span>
            <p className="text-3xl font-extrabold text-amber-700 mt-1">{activeQueueCount}</p>
          </div>
          <div className="bg-white p-5 rounded-3xl border border-[#EDE6DD] shadow-sm">
            <span className="text-xs font-bold text-stone-400 uppercase">Low Stock Lots (≤10)</span>
            <p className="text-3xl font-extrabold text-red-600 mt-1">{lowStockCount}</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-3 border-b border-[#EDE6DD] pb-4">
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-xs transition-all ${
              activeTab === 'orders'
                ? 'bg-[#2C2825] text-white shadow'
                : 'bg-white text-stone-700 border border-[#EDE6DD]'
            }`}
          >
            <ShoppingBag className="w-4 h-4" /> Order Fulfillment ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-xs transition-all ${
              activeTab === 'products'
                ? 'bg-[#2C2825] text-white shadow'
                : 'bg-white text-stone-700 border border-[#EDE6DD]'
            }`}
          >
            <Package className="w-4 h-4" /> Catalog & Inventory ({products.length})
          </button>
        </div>

        {/* TAB 1: HIGH-VOLUME ORDERS MANAGEMENT */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-3xl border border-[#EDE6DD] flex flex-col lg:flex-row items-center justify-between gap-4">
              <div className="relative w-full lg:w-80">
                <Search className="w-4 h-4 text-stone-400 absolute top-1/2 -translate-y-1/2 start-3.5" />
                <input
                  type="text"
                  placeholder="Search Order #, Name, Email, Phone, City..."
                  value={searchQuery}
                  onChange={e => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl ps-9 pe-4 py-2.5 text-xs"
                />
              </div>

              <div className="flex flex-wrap gap-1.5">
                {['All', 'Processing', 'Roasted & Packed', 'Shipped', 'Completed', 'Cancelled'].map(
                  st => (
                    <button
                      key={st}
                      onClick={() => {
                        setOrderFilter(st);
                        setCurrentPage(1);
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                        orderFilter === st
                          ? 'bg-[#2C2825] text-white'
                          : 'bg-[#FAF7F2] text-stone-600'
                      }`}
                    >
                      {st}
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
                      Bulk Action ({selectedOrderIds.length})
                    </option>
                    <option value="Roasted & Packed">Mark Roasted & Packed</option>
                    <option value="Shipped">Mark Shipped</option>
                    <option value="Completed">Mark Completed</option>
                  </select>
                )}
                <button
                  onClick={exportOrdersCSV}
                  className="bg-[#EAE2D7] text-[#2C2825] px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Export CSV
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {paginatedOrders.map(o => (
                <div
                  key={o.id}
                  className="bg-white rounded-3xl p-6 border border-[#EDE6DD] shadow-sm flex flex-col lg:flex-row justify-between gap-6"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <input
                        type="checkbox"
                        checked={selectedOrderIds.includes(o.id)}
                        onChange={e => {
                          if (e.target.checked) setSelectedOrderIds([...selectedOrderIds, o.id]);
                          else setSelectedOrderIds(selectedOrderIds.filter(id => id !== o.id));
                        }}
                      />
                      <span className="font-extrabold text-sm text-[#2C2825]">
                        {o.order_number || `#${o.id.slice(0, 8)}`}
                      </span>
                      <span className="font-bold text-xs text-stone-700">
                        {o.customer_name} ({o.customer_email} {o.customer_phone ? `• ${o.customer_phone}` : ''})
                      </span>
                      <span className="px-3 py-0.5 rounded-full text-[11px] font-extrabold bg-[#EAE2D7] text-[#5A4D41]">
                        {o.status}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-600 uppercase">
                        {o.payment_method || 'card'} • {o.payment_status || 'Paid'}
                      </span>
                    </div>

                    <p className="text-xs text-stone-500">
                      {o.address}, {o.city} ({o.postal_code}) • {new Date(o.created_at).toLocaleString()}
                    </p>

                    <div className="bg-[#FAF7F2] p-3 rounded-2xl border border-[#EDE6DD] space-y-1">
                      {o.items?.map((item, idx) => (
                        <p key={idx} className="text-xs font-bold text-[#2C2825]">
                          • {item.quantity}x {item.name} ({item.selectedWeight} • {item.selectedGrind}) —{' '}
                          {(item.price * item.quantity).toFixed(2)} SAR
                        </p>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col justify-between items-end gap-3 border-t lg:border-t-0 lg:border-s border-[#EDE6DD] pt-4 lg:pt-0 lg:ps-6 min-w-[260px]">
                    <div className="text-end">
                      <span className="text-[10px] uppercase font-bold text-stone-400">Order Total</span>
                      <p className="text-2xl font-extrabold text-[#2C2825]">
                        {Number(o.total_amount).toFixed(2)} SAR
                      </p>
                    </div>

                    <input
                      type="text"
                      placeholder="Courier Tracking # (Aramex/SMSA)"
                      defaultValue={o.tracking_number || ''}
                      onBlur={e => {
                        if (e.target.value !== (o.tracking_number || '')) {
                          updateOrderStatus(o, o.status, e.target.value);
                        }
                      }}
                      className="w-full bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3 py-1.5 text-xs"
                    />

                    <div className="flex flex-wrap gap-1.5 justify-end">
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
                          key={st}
                          onClick={() => updateOrderStatus(o, st)}
                          className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                            o.status === st
                              ? 'bg-[#2C2825] text-white'
                              : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: BILINGUAL PRODUCT CATALOG & INVENTORY */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-extrabold text-[#2C2825]">Product Catalog & Stock</h2>
              <button
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
                className="bg-[#2C2825] text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow"
              >
                <Plus className="w-4 h-4" /> Add Coffee / Product
              </button>
            </div>

            <div className="bg-white rounded-3xl border border-[#EDE6DD] overflow-hidden shadow-sm">
              <table className="w-full text-start border-collapse text-xs">
                <thead>
                  <tr className="bg-[#FAF7F2] border-b border-[#EDE6DD] font-extrabold text-stone-500 uppercase">
                    <th className="p-4">Product (AR / EN)</th>
                    <th className="p-4">Category / Roast</th>
                    <th className="p-4">Price (SAR)</th>
                    <th className="p-4">Stock</th>
                    <th className="p-4 text-end">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {products.map(p => (
                    <tr key={p.id} className="hover:bg-[#FAF7F2]/60">
                      <td className="p-4 flex items-center gap-3">
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-12 h-12 rounded-xl object-cover bg-stone-100"
                        />
                        <div>
                          <p className="font-extrabold text-[#2C2825]">{p.name_ar || p.name}</p>
                          <p className="text-stone-500">{p.name}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-[#2C2825]">{p.category || 'Crops'}</span>
                        <span className="block text-[#C4A484] font-semibold">
                          {p.roast_level} Roast
                        </span>
                      </td>
                      <td className="p-4 font-extrabold">{p.price.toFixed(2)} SAR</td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-full font-bold ${
                            p.stock_quantity > 10
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {p.stock_quantity} bags
                        </span>
                      </td>
                      <td className="p-4 text-end space-x-2">
                        <button
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
                            onClick={() => handleConfirmDeleteProduct(p.id)}
                            className="px-3 py-1.5 bg-red-600 text-white rounded-xl font-bold text-[11px]"
                          >
                            Confirm Delete
                          </button>
                        ) : (
                          <button
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

      {/* BILINGUAL PRODUCT MODAL */}
      {isProductModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsProductModalOpen(false)}
              className="absolute top-6 end-6 p-2 rounded-full hover:bg-stone-100"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-extrabold mb-6">
              {editingProduct.id ? 'Edit RŌN Product' : 'Add New RŌN Product'}
            </h3>
            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-500 mb-1">Arabic Name (الاسم بالعربي)</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.name_ar || ''}
                    onChange={e => setEditingProduct({ ...editingProduct, name_ar: e.target.value })}
                    className="w-full bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3.5 py-2.5"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-500 mb-1">English Name</label>
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
                  <label className="block font-bold text-stone-500 mb-1">Category</label>
                  <select
                    value={editingProduct.category || 'Crops'}
                    onChange={e =>
                      setEditingProduct({ ...editingProduct, category: e.target.value as any })
                    }
                    className="w-full bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3 py-2.5"
                  >
                    <option value="Crops">محاصيل RON (Crops)</option>
                    <option value="Boxes">بوكسات RON (Boxes)</option>
                    <option value="Tools">أدوات القهوة (Tools)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-stone-500 mb-1">Price (SAR)</label>
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
                  <label className="block font-bold text-stone-500 mb-1">Stock (Bags)</label>
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
                <label className="block font-bold text-stone-500 mb-1">Image URL</label>
                <input
                  type="url"
                  required
                  value={editingProduct.image || ''}
                  onChange={e => setEditingProduct({ ...editingProduct, image: e.target.value })}
                  className="w-full bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3.5 py-2.5"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-500 mb-1">Arabic Description</label>
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
                <label className="block font-bold text-stone-500 mb-1">English Description</label>
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
                className="w-full bg-[#2C2825] text-white py-3.5 rounded-xl font-bold hover:bg-[#3E3834]"
              >
                Save Product to RŌN Catalog
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}