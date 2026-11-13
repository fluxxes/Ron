// Copyright (c) 2026 (RON). Developed by (fluxes) All rights reserved.
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Product, Order, OrderStatus, SupportTicket, CourierProviderType } from '../types/coffee';
import { localizeProduct } from '../data/products';
import { generateTrackingNumber } from '../lib/deliveryService';
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
  CheckCircle2,
  Clock,
  Coffee,
  Truck,
  PackageCheck,
  XCircle,
  Printer,
  RefreshCw,
  Sparkles,
  ExternalLink,
  CheckSquare,
  Square,
  Zap,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '../lib/useTranslation';

type OrderPipelineTab =
  | 'all'
  | 'incoming'
  | 'processing'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export default function StaffPage() {
  const router = useRouter();
  const { lang, t, toggleLanguage, translateStatus, translateOption } = useTranslation();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'tickets'>('orders');

  // Data States
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);

  // Order Pipeline States
  const [pipelineTab, setPipelineTab] = useState<OrderPipelineTab>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);
  const [staffBanner, setStaffBanner] = useState<string>('');

  // Product Filter & Modal States
  const [productSearch, setProductSearch] = useState<string>('');
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('All');
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [flavorNotesInput, setFlavorNotesInput] = useState<string>('');
  const [flavorNotesArInput, setFlavorNotesArInput] = useState<string>('');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  // Ticket Filter State
  const [ticketFilter, setTicketFilter] = useState<
    'All' | 'Open' | 'In Progress' | 'Resolved' | 'Closed'
  >('All');

  const notifyStaff = useCallback((msg: string) => {
    setStaffBanner(msg);
    setTimeout(() => setStaffBanner(''), 3500);
  }, []);

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
    if (ordData) setOrders(ordData as Order[]);

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

  // Real-time subscriptions for instant order, product & ticket updates
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('staff-live-command-center')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        void fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, () => {
        void fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        void fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchData]);

  // Advance or update order stage using the atomic RPC (with direct fallback)
  const handleAdvanceOrderStage = async (
    order: Order,
    nextStatus: OrderStatus,
    customNote = ''
  ) => {
    setBusyOrderId(order.id);
    try {
      const noteText =
        customNote ||
        (lang === 'ar'
          ? `تم تحديث الحالة إلى ${translateStatus(nextStatus)} بواسطة الموظف`
          : `Status updated to ${nextStatus} by Staff`);

      const { error: rpcError } = await supabase.rpc('advance_order_stage', {
        p_order_id: order.id,
        p_new_status: nextStatus,
        p_note: noteText,
      });

      if (rpcError) {
        const nextHistory = [
          ...(order.status_history || []),
          {
            status: nextStatus,
            timestamp: new Date().toISOString(),
            note: noteText,
          },
        ];
        await supabase
          .from('orders')
          .update({
            status: nextStatus,
            payment_status:
              nextStatus === 'Delivered' || nextStatus === 'Completed'
                ? 'Paid'
                : order.payment_status,
            status_history: nextHistory,
            updated_at: new Date().toISOString(),
          })
          .eq('id', order.id);
      }

      await fetchData();
      notifyStaff(
        lang === 'ar'
          ? `تم تحديث الطلب ${order.order_number || order.id.slice(0, 8)} إلى: ${translateStatus(nextStatus)}`
          : `Order ${order.order_number || order.id.slice(0, 8)} updated to ${nextStatus}`
      );
    } finally {
      setBusyOrderId(null);
    }
  };

  // Bulk status update for selected orders
  const handleBulkOrderStatus = async (targetStatus: OrderStatus) => {
    if (selectedOrderIds.length === 0) return;
    for (const id of selectedOrderIds) {
      const found = orders.find(o => o.id === id);
      if (found) {
        await handleAdvanceOrderStage(found, targetStatus, `Bulk update to ${targetStatus}`);
      }
    }
    setSelectedOrderIds([]);
  };

  const handleUpdateCourierInfo = async (
    orderId: string,
    courier_provider: CourierProviderType,
    tracking_number: string
  ) => {
    const cleanTracking = tracking_number.trim();
    const courier_name = courier_provider === 'saudi_post' ? 'Saudi Post (SPL)' : 'SMSA Express';
    const waybill_url = cleanTracking
      ? courier_provider === 'saudi_post'
        ? `https://splonline.com.sa/ar/tracking/?awb=${cleanTracking}`
        : `https://www.smsaexpress.com/sa/ar/trackingdetails?tracknumbers=${cleanTracking}`
      : '';

    await supabase
      .from('orders')
      .update({
        courier_provider,
        courier_name,
        tracking_number: cleanTracking,
        waybill_url,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);
    void fetchData();
  };

  const handleAutoGenerateWaybill = async (order: Order) => {
    const provider: CourierProviderType = order.courier_provider || 'smsa';
    const generated = generateTrackingNumber(provider);
    await supabase
      .from('orders')
      .update({
        courier_provider: provider,
        courier_name: generated.courierName,
        tracking_number: generated.trackingNumber,
        waybill_url: generated.waybillUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id);
    await fetchData();
    notifyStaff(
      lang === 'ar'
        ? `تم إصدار بوليصة شحن جديدة: ${generated.trackingNumber}`
        : `Generated new AWB: ${generated.trackingNumber}`
    );
  };

  const handleSaveStaffNote = async (orderId: string, staff_notes: string) => {
    await supabase
      .from('orders')
      .update({ staff_notes, updated_at: new Date().toISOString() })
      .eq('id', orderId);
    void fetchData();
    notifyStaff(lang === 'ar' ? 'تم حفظ ملاحظة الموظف' : 'Staff note saved');
  };

  const handleTogglePaymentPaid = async (order: Order) => {
    const nextPayStatus = order.payment_status === 'Paid' ? 'Pending' : 'Paid';
    await supabase
      .from('orders')
      .update({ payment_status: nextPayStatus, updated_at: new Date().toISOString() })
      .eq('id', order.id);
    void fetchData();
  };

  // Product & Stock Controls
  const handleQuickStockAdjust = async (product: Product, delta: number) => {
    const nextStock = Math.max(0, product.stock_quantity + delta);
    await supabase.from('products').update({ stock_quantity: nextStock }).eq('id', product.id);
    void fetchData();
  };

  const handleToggleBestseller = async (product: Product) => {
    await supabase
      .from('products')
      .update({ bestseller: !product.bestseller })
      .eq('id', product.id);
    void fetchData();
  };

  const openProductModal = (prod?: Product) => {
    if (prod) {
      setEditingProduct(prod);
      setFlavorNotesInput((prod.flavor_notes || []).join(', '));
      setFlavorNotesArInput((prod.flavor_notes_ar || []).join('، '));
    } else {
      setEditingProduct({
        name: '',
        name_ar: '',
        category: 'Crops',
        origin: 'Ethiopia',
        origin_ar: 'إثيوبيا',
        region: 'Yirgacheffe',
        region_ar: 'يرقاتشيف',
        process: 'Washed',
        process_ar: 'مغسولة',
        altitude: '1,950m',
        roast_level: 'Medium',
        price: 58,
        stock_quantity: 50,
        image: '',
        description: '',
        description_ar: '',
        bestseller: false,
      });
      setFlavorNotesInput('Chocolate, Jasmine, Berry');
      setFlavorNotesArInput('شوكولاتة، ياسمين، توت');
    }
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    const parsedNotesEn = flavorNotesInput
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    const parsedNotesAr = flavorNotesArInput
      .split(/[,،]/)
      .map(s => s.trim())
      .filter(Boolean);

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
      flavor_notes: parsedNotesEn,
      flavor_notes_ar: parsedNotesAr.length > 0 ? parsedNotesAr : parsedNotesEn,
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
    await fetchData();
    notifyStaff(lang === 'ar' ? 'تم حفظ المنتج في قاعدة البيانات' : 'Product saved to Supabase');
  };

  const handleDeleteProduct = async (id: string) => {
    await supabase.from('products').delete().eq('id', id);
    await fetchData();
    notifyStaff(lang === 'ar' ? 'تم حذف المنتج' : 'Product deleted');
  };

  // Ticket Reply & Resolution
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
    notifyStaff(lang === 'ar' ? 'تم إرسال الرد للعميل' : 'Reply sent to customer');
  };

  const exportOrdersCsv = () => {
    const headers = [
      'OrderNumber',
      'Customer',
      'Email',
      'Phone',
      'City',
      'NationalAddress',
      'TotalSAR',
      'PaymentMethod',
      'PaymentStatus',
      'OrderStatus',
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
      o.national_address || '',
      o.total_amount,
      o.payment_method || 'card',
      o.payment_status || 'Paid',
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

  // Pipeline counts
  const pipelineCounts = useMemo(() => {
    return {
      all: orders.length,
      incoming: orders.filter(
        o => o.status === 'Pending Approval' || o.status === 'Approved'
      ).length,
      processing: orders.filter(
        o => o.status === 'Processing' || o.status === 'Roasted & Packed'
      ).length,
      out_for_delivery: orders.filter(
        o => o.status === 'Shipped' || o.status === 'Out for Delivery'
      ).length,
      delivered: orders.filter(
        o => o.status === 'Delivered' || o.status === 'Completed'
      ).length,
      cancelled: orders.filter(o => o.status === 'Cancelled').length,
    };
  }, [orders]);

  // Filtered Orders by Sub-Tab + Search
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchesTab =
        pipelineTab === 'all' ||
        (pipelineTab === 'incoming' &&
          (o.status === 'Pending Approval' || o.status === 'Approved')) ||
        (pipelineTab === 'processing' &&
          (o.status === 'Processing' || o.status === 'Roasted & Packed')) ||
        (pipelineTab === 'out_for_delivery' &&
          (o.status === 'Shipped' || o.status === 'Out for Delivery')) ||
        (pipelineTab === 'delivered' &&
          (o.status === 'Delivered' || o.status === 'Completed')) ||
        (pipelineTab === 'cancelled' && o.status === 'Cancelled');

      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        o.order_number?.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q) ||
        o.tracking_number?.toLowerCase().includes(q) ||
        o.customer_name.toLowerCase().includes(q) ||
        o.customer_email.toLowerCase().includes(q) ||
        o.customer_phone?.toLowerCase().includes(q) ||
        o.city.toLowerCase().includes(q);

      return matchesTab && matchesSearch;
    });
  }, [orders, pipelineTab, searchQuery]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCat =
        productCategoryFilter === 'All' || (p.category || 'Crops') === productCategoryFilter;
      const q = productSearch.trim().toLowerCase();
      const matchesQ =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.name_ar && p.name_ar.toLowerCase().includes(q)) ||
        p.origin.toLowerCase().includes(q);
      return matchesCat && matchesQ;
    });
  }, [products, productCategoryFilter, productSearch]);

  // Filtered Tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter(tk => ticketFilter === 'All' || tk.status === ticketFilter);
  }, [tickets, ticketFilter]);

  const totalRevenue = orders
    .filter(o => o.status !== 'Cancelled')
    .reduce((s, o) => s + Number(o.total_amount || 0), 0);
  const lowStockCount = products.filter(p => p.stock_quantity <= 10).length;

  const getStepNumber = (status: OrderStatus) => {
    if (status === 'Pending Approval' || status === 'Approved') return 1;
    if (status === 'Processing') return 2;
    if (status === 'Roasted & Packed') return 3;
    if (status === 'Shipped' || status === 'Out for Delivery') return 4;
    if (status === 'Delivered' || status === 'Completed') return 5;
    return 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center text-xs font-bold">
        {t('staff_verifying')}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#231F1E]">
      {/* Staff Toast Banner */}
      {staffBanner && (
        <div className="fixed top-20 inset-x-0 z-50 flex justify-center px-4 pointer-events-none">
          <div className="bg-[#231F1E] text-[#EAE2D7] border border-[#C4A484] px-5 py-3 rounded-2xl shadow-xl text-xs font-extrabold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{staffBanner}</span>
          </div>
        </div>
      )}

      {/* Top Staff Command Header */}
      <header className="bg-[#231F1E] text-white shadow-md h-16 sm:h-20 flex items-center px-4 sm:px-6 justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3 sm:gap-4">
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
            <ShieldCheck className="w-6 h-6 shrink-0" />
            <span className="text-white text-xs sm:text-base">{t('staff_title')}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void fetchData()}
            className="bg-stone-800 text-stone-200 px-3 py-2 rounded-full text-xs font-bold hover:bg-stone-700 flex items-center gap-1.5"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#C4A484]" />
            <span className="hidden sm:inline">{lang === 'ar' ? 'تحديث' : 'Sync'}</span>
          </button>
          <button
            type="button"
            onClick={toggleLanguage}
            className="bg-stone-800 text-stone-200 px-3.5 py-2 rounded-full text-xs font-bold hover:bg-stone-700 flex items-center gap-1.5"
          >
            <Globe className="w-3.5 h-3.5 text-[#C4A484]" />
            <span>{lang === 'ar' ? 'English' : 'العربية'}</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Executive KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-[#EDE6DD] shadow-sm">
            <span className="text-xs font-bold text-stone-400 uppercase">
              {t('kpi_total_orders')}
            </span>
            <p className="text-3xl font-extrabold mt-1">{orders.length}</p>
            <span className="text-[11px] font-bold text-stone-400">
              {pipelineCounts.processing}{' '}
              {lang === 'ar' ? 'قيد التجهيز الآن' : 'actively processing'}
            </span>
          </div>
          <div className="bg-white p-5 rounded-3xl border border-[#EDE6DD] shadow-sm">
            <span className="text-xs font-bold text-stone-400 uppercase">{t('kpi_revenue')}</span>
            <p className="text-2xl font-extrabold text-emerald-700 mt-1">
              {totalRevenue.toFixed(2)} {t('currency')}
            </p>
            <span className="text-[11px] font-bold text-emerald-600">
              {pipelineCounts.delivered} {lang === 'ar' ? 'طلب مكتمل' : 'delivered'}
            </span>
          </div>
          <div className="bg-white p-5 rounded-3xl border border-[#EDE6DD] shadow-sm">
            <span className="text-xs font-bold text-stone-400 uppercase">
              {t('kpi_open_tickets')}
            </span>
            <p className="text-3xl font-extrabold text-amber-700 mt-1">
              {tickets.filter(tk => tk.status !== 'Closed').length}
            </p>
            <span className="text-[11px] font-bold text-stone-400">
              {tickets.length} {lang === 'ar' ? 'إجمالي التذاكر' : 'total tickets'}
            </span>
          </div>
          <div className="bg-white p-5 rounded-3xl border border-[#EDE6DD] shadow-sm">
            <span className="text-xs font-bold text-stone-400 uppercase">
              {t('kpi_low_stock')}
            </span>
            <p className="text-3xl font-extrabold text-red-600 mt-1">{lowStockCount}</p>
            <span className="text-[11px] font-bold text-stone-400">
              {products.length} {lang === 'ar' ? 'منتج في الكتالوج' : 'catalog items'}
            </span>
          </div>
        </div>

        {/* Main Section Switcher Tabs */}
        <div className="flex gap-2 border-b border-[#EDE6DD] pb-3 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`px-5 py-3 rounded-2xl font-extrabold text-xs flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'orders'
                ? 'bg-[#231F1E] text-white shadow-md'
                : 'bg-white text-stone-700 border border-[#EDE6DD]'
            }`}
          >
            <ShoppingBag className="w-4 h-4 text-[#C4A484]" />
            <span>
              {t('tab_orders')} ({orders.length})
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('products')}
            className={`px-5 py-3 rounded-2xl font-extrabold text-xs flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'products'
                ? 'bg-[#231F1E] text-white shadow-md'
                : 'bg-white text-stone-700 border border-[#EDE6DD]'
            }`}
          >
            <Package className="w-4 h-4 text-[#C4A484]" />
            <span>
              {t('tab_products')} ({products.length})
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tickets')}
            className={`px-5 py-3 rounded-2xl font-extrabold text-xs flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'tickets'
                ? 'bg-[#231F1E] text-white shadow-md'
                : 'bg-white text-stone-700 border border-[#EDE6DD]'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-[#C4A484]" />
            <span>
              {t('tab_tickets')} ({tickets.length})
            </span>
          </button>
        </div>

        {/* ===================================================================== */}
        {/* TAB 1: SHEIN / AMAZON-STYLE ORDER FULFILLMENT PIPELINE                */}
        {/* ===================================================================== */}
        {activeTab === 'orders' && (
          <div className="space-y-5">
            {/* 6-Stage Pipeline Sub-Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {[
                {
                  id: 'all',
                  label: lang === 'ar' ? 'جميع الطلبات' : 'All Orders',
                  count: pipelineCounts.all,
                },
                {
                  id: 'incoming',
                  label: lang === 'ar' ? 'طلبات جديدة / للاعتماد' : 'Incoming / To Approve',
                  count: pipelineCounts.incoming,
                },
                {
                  id: 'processing',
                  label: lang === 'ar' ? 'قيد التحميص والتجهيز' : 'Processing & Roasting',
                  count: pipelineCounts.processing,
                },
                {
                  id: 'out_for_delivery',
                  label: lang === 'ar' ? 'خرجت للتوصيل (مع الشحن)' : 'Out for Delivery',
                  count: pipelineCounts.out_for_delivery,
                },
                {
                  id: 'delivered',
                  label: lang === 'ar' ? 'تم التوصيل ومكتملة' : 'Delivered & Completed',
                  count: pipelineCounts.delivered,
                },
                {
                  id: 'cancelled',
                  label: lang === 'ar' ? 'ملغية (مستردة)' : 'Cancelled',
                  count: pipelineCounts.cancelled,
                },
              ].map(sub => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setPipelineTab(sub.id as OrderPipelineTab)}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold flex items-center gap-2 whitespace-nowrap border transition-all ${
                    pipelineTab === sub.id
                      ? 'bg-[#EAE2D7] text-[#231F1E] border-[#231F1E] shadow-sm'
                      : 'bg-white text-stone-600 border-[#EDE6DD] hover:border-stone-400'
                  }`}
                >
                  <span>{sub.label}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] ${
                      pipelineTab === sub.id
                        ? 'bg-[#231F1E] text-white'
                        : 'bg-[#FAF7F2] text-stone-700'
                    }`}
                  >
                    {sub.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Search, Bulk Action & CSV Toolbar */}
            <div className="bg-white p-4 rounded-3xl border border-[#EDE6DD] flex flex-wrap items-center justify-between gap-3 shadow-sm">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-4 h-4 text-stone-400 absolute top-1/2 -translate-y-1/2 start-3.5" />
                <input
                  type="text"
                  placeholder={t('staff_search_orders')}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl ps-9 pe-4 py-2.5 text-xs"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {selectedOrderIds.length > 0 && (
                  <div className="flex items-center gap-1.5 bg-[#FAF7F2] px-3 py-1.5 rounded-xl border border-[#C4A484]">
                    <span className="text-xs font-extrabold text-[#231F1E]">
                      {selectedOrderIds.length} {lang === 'ar' ? 'محدد:' : 'Selected:'}
                    </span>
                    <button
                      type="button"
                      onClick={() => void handleBulkOrderStatus('Approved')}
                      className="bg-blue-600 text-white px-2.5 py-1 rounded-lg text-[11px] font-bold"
                    >
                      {lang === 'ar' ? 'اعتماد' : 'Approve'}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleBulkOrderStatus('Processing')}
                      className="bg-amber-700 text-white px-2.5 py-1 rounded-lg text-[11px] font-bold"
                    >
                      {lang === 'ar' ? 'قيد التجهيز' : 'Process'}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleBulkOrderStatus('Out for Delivery')}
                      className="bg-indigo-600 text-white px-2.5 py-1 rounded-lg text-[11px] font-bold"
                    >
                      {lang === 'ar' ? 'إرسال للتوصيل' : 'Dispatch'}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleBulkOrderStatus('Delivered')}
                      className="bg-emerald-700 text-white px-2.5 py-1 rounded-lg text-[11px] font-bold"
                    >
                      {lang === 'ar' ? 'تم التسليم' : 'Delivered'}
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={exportOrdersCsv}
                  className="bg-[#231F1E] text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  <span>{t('export_csv')}</span>
                </button>
              </div>
            </div>

            {/* Order Cards List */}
            {filteredOrders.length === 0 ? (
              <div className="bg-white p-14 rounded-3xl border border-[#EDE6DD] text-center text-stone-400 text-xs font-bold">
                {lang === 'ar'
                  ? 'لا توجد طلبات مطابقة في هذا القسم حالياً.'
                  : 'No matching orders in this pipeline stage.'}
              </div>
            ) : (
              filteredOrders.map(o => {
                const isSelected = selectedOrderIds.includes(o.id);
                const stepNum = getStepNumber(o.status);
                const isExpanded = expandedOrderId === o.id;

                return (
                  <div
                    key={o.id}
                    className={`bg-white p-6 rounded-3xl border transition-all shadow-sm space-y-5 ${
                      isSelected ? 'border-[#231F1E] ring-2 ring-[#C4A484]/30' : 'border-[#EDE6DD]'
                    }`}
                  >
                    {/* Top Row: Order Meta + Customer + Status Dropdown */}
                    <div className="flex flex-col lg:flex-row justify-between gap-4 border-b border-stone-100 pb-4">
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedOrderIds(prev =>
                              prev.includes(o.id)
                                ? prev.filter(i => i !== o.id)
                                : [...prev, o.id]
                            )
                          }
                          className="mt-1 text-stone-400 hover:text-[#231F1E]"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-[#231F1E]" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>

                        <div className="space-y-1">
                          <div className="flex flex-wrap gap-2 items-center">
                            <span className="font-extrabold text-sm sm:text-base text-[#231F1E]">
                              {o.order_number || o.id.slice(0, 8)}
                            </span>
                            <span
                              className={`px-3 py-0.5 rounded-full text-[11px] font-extrabold ${
                                o.status === 'Cancelled'
                                  ? 'bg-red-100 text-red-700'
                                  : o.status === 'Delivered' || o.status === 'Completed'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-[#EAE2D7] text-[#5A4D41]'
                              }`}
                            >
                              {translateStatus(o.status)}
                            </span>
                            <button
                              type="button"
                              onClick={() => void handleTogglePaymentPaid(o)}
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                o.payment_status === 'Paid'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-amber-50 text-amber-800 border-amber-200'
                              }`}
                              title="Click to toggle Paid / Pending"
                            >
                              {o.payment_method?.toUpperCase() || 'CARD'} •{' '}
                              {o.payment_status || 'Paid'}
                            </button>
                            <span className="text-[11px] text-stone-400">
                              {new Date(o.created_at).toLocaleString()}
                            </span>
                          </div>

                          <p className="text-xs font-bold text-stone-800">
                            {o.customer_name} • {o.customer_email}{' '}
                            {o.customer_phone ? `• ${o.customer_phone}` : ''}
                          </p>
                          <p className="text-xs text-stone-500">
                            {o.address}, {o.city} ({o.postal_code}){' '}
                            {o.national_address ? `• العنوان الوطني: ${o.national_address}` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2.5">
                        <div className="text-end me-2">
                          <span className="text-[10px] font-bold text-stone-400 block uppercase">
                            {t('total')}
                          </span>
                          <span className="font-extrabold text-lg text-[#231F1E]">
                            {Number(o.total_amount).toFixed(2)} {t('currency')}
                          </span>
                        </div>

                        <select
                          value={o.status}
                          disabled={busyOrderId === o.id}
                          onChange={e =>
                            void handleAdvanceOrderStage(o, e.target.value as OrderStatus)
                          }
                          className="bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3 py-2 text-xs font-extrabold text-[#231F1E]"
                        >
                          <option value="Pending Approval">
                            {translateStatus('Pending Approval')}
                          </option>
                          <option value="Approved">{translateStatus('Approved')}</option>
                          <option value="Processing">{translateStatus('Processing')}</option>
                          <option value="Roasted & Packed">
                            {translateStatus('Roasted & Packed')}
                          </option>
                          <option value="Out for Delivery">
                            {translateStatus('Out for Delivery')}
                          </option>
                          <option value="Delivered">{translateStatus('Delivered')}</option>
                          <option value="Completed">{translateStatus('Completed')}</option>
                          <option value="Cancelled">{translateStatus('Cancelled')}</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => setPrintingOrder(o)}
                          className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EDE6DD] text-stone-700 hover:bg-[#EAE2D7]"
                          title={t('print_invoice')}
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Visual 5-Stage SHEIN/Amazon Progress Bar */}
                    {o.status !== 'Cancelled' && (
                      <div className="grid grid-cols-5 gap-2 pt-1">
                        {[
                          { step: 1, label: lang === 'ar' ? '1. معتمد' : '1. Approved' },
                          { step: 2, label: lang === 'ar' ? '2. قيد التجهيز' : '2. Processing' },
                          {
                            step: 3,
                            label: lang === 'ar' ? '3. تم التحميص' : '3. Roasted & Packed',
                          },
                          {
                            step: 4,
                            label: lang === 'ar' ? '4. خرج للتوصيل' : '4. Out for Delivery',
                          },
                          { step: 5, label: lang === 'ar' ? '5. تم التسليم' : '5. Delivered' },
                        ].map(s => (
                          <div key={s.step} className="space-y-1">
                            <div
                              className={`h-1.5 rounded-full transition-all ${
                                stepNum >= s.step ? 'bg-[#231F1E]' : 'bg-stone-200'
                              }`}
                            />
                            <span
                              className={`block text-[10px] font-bold ${
                                stepNum >= s.step ? 'text-[#231F1E]' : 'text-stone-400'
                              }`}
                            >
                              {s.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* One-Click SHEIN/Amazon Staff Action Bar */}
                    <div className="bg-[#FAF7F2] p-3.5 rounded-2xl border border-[#EDE6DD] flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-extrabold text-stone-500 me-1 flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5 text-[#C4A484]" />
                          {lang === 'ar' ? 'تحكم سريع بالمرحلة:' : 'Quick Stage Action:'}
                        </span>

                        <button
                          type="button"
                          disabled={busyOrderId === o.id}
                          onClick={() => void handleAdvanceOrderStage(o, 'Approved')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                            o.status === 'Approved'
                              ? 'bg-[#231F1E] text-white'
                              : 'bg-white border border-[#EDE6DD] text-stone-700 hover:bg-[#EAE2D7]/50'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                          <span>{lang === 'ar' ? 'اعتماد الطلب' : 'Approve Order'}</span>
                        </button>

                        <button
                          type="button"
                          disabled={busyOrderId === o.id}
                          onClick={() => void handleAdvanceOrderStage(o, 'Processing')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                            o.status === 'Processing'
                              ? 'bg-[#231F1E] text-white'
                              : 'bg-white border border-[#EDE6DD] text-stone-700 hover:bg-[#EAE2D7]/50'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>{lang === 'ar' ? 'بدء التجهيز' : 'Set Processing'}</span>
                        </button>

                        <button
                          type="button"
                          disabled={busyOrderId === o.id}
                          onClick={() => void handleAdvanceOrderStage(o, 'Roasted & Packed')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                            o.status === 'Roasted & Packed'
                              ? 'bg-[#231F1E] text-white'
                              : 'bg-white border border-[#EDE6DD] text-stone-700 hover:bg-[#EAE2D7]/50'
                          }`}
                        >
                          <Coffee className="w-3.5 h-3.5 text-amber-800" />
                          <span>{lang === 'ar' ? 'تم التحميص والتغليف' : 'Roast & Pack'}</span>
                        </button>

                        <button
                          type="button"
                          disabled={busyOrderId === o.id}
                          onClick={() => void handleAdvanceOrderStage(o, 'Out for Delivery')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                            o.status === 'Out for Delivery' || o.status === 'Shipped'
                              ? 'bg-[#231F1E] text-white'
                              : 'bg-white border border-[#EDE6DD] text-stone-700 hover:bg-[#EAE2D7]/50'
                          }`}
                        >
                          <Truck className="w-3.5 h-3.5 text-indigo-600" />
                          <span>{lang === 'ar' ? 'إرسال للتوصيل' : 'Out for Delivery'}</span>
                        </button>

                        <button
                          type="button"
                          disabled={busyOrderId === o.id}
                          onClick={() => void handleAdvanceOrderStage(o, 'Delivered')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                            o.status === 'Delivered' || o.status === 'Completed'
                              ? 'bg-emerald-700 text-white'
                              : 'bg-white border border-[#EDE6DD] text-stone-700 hover:bg-emerald-50'
                          }`}
                        >
                          <PackageCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{lang === 'ar' ? 'تم التوصيل والتسليم' : 'Mark Delivered'}</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        {o.status !== 'Cancelled' && (
                          <button
                            type="button"
                            disabled={busyOrderId === o.id}
                            onClick={() => void handleAdvanceOrderStage(o, 'Cancelled')}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 flex items-center gap-1"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>
                              {lang === 'ar' ? 'إلغاء واسترداد المخزون' : 'Cancel & Restock'}
                            </span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setExpandedOrderId(isExpanded ? null : o.id)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-[#EDE6DD] text-stone-600"
                        >
                          {isExpanded
                            ? lang === 'ar'
                              ? 'إخفاء السجل'
                              : 'Hide Log'
                            : lang === 'ar'
                            ? 'سجل وملاحظات الطلب'
                            : 'Logs & Notes'}
                        </button>
                      </div>
                    </div>

                    {/* Items + Courier AWB Row */}
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
                      <div className="flex flex-wrap gap-2">
                        {(o.items || []).map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 bg-[#FAF7F2] border border-[#EDE6DD] px-3 py-1.5 rounded-xl"
                          >
                            {item.image && (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-7 h-7 rounded-md object-cover"
                              />
                            )}
                            <span className="font-bold text-[#231F1E]">
                              {item.quantity}x{' '}
                              {lang === 'ar' && item.name_ar ? item.name_ar : item.name}
                            </span>
                            <span className="text-stone-500">
                              ({translateOption(item.selectedWeight)} /{' '}
                              {translateOption(item.selectedGrind)})
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Courier & AWB Control */}
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          value={o.courier_provider || 'smsa'}
                          onChange={e =>
                            void handleUpdateCourierInfo(
                              o.id,
                              e.target.value as CourierProviderType,
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
                            void handleUpdateCourierInfo(
                              o.id,
                              (o.courier_provider as CourierProviderType) || 'smsa',
                              e.target.value
                            )
                          }
                          className="bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3 py-1.5 text-xs font-mono w-40"
                        />
                        <button
                          type="button"
                          onClick={() => void handleAutoGenerateWaybill(o)}
                          className="bg-[#EAE2D7] text-[#231F1E] px-3 py-1.5 rounded-xl text-xs font-extrabold hover:bg-[#DFD3C3]"
                        >
                          {lang === 'ar' ? 'توليد بوليصة' : 'Auto AWB'}
                        </button>
                        {o.waybill_url && (
                          <a
                            href={o.waybill_url}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-xl bg-[#FAF7F2] border border-[#EDE6DD] text-amber-800 hover:bg-stone-100"
                            title="Open Courier Tracking"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Expandable Audit History & Staff Internal Notes */}
                    {isExpanded && (
                      <div className="pt-4 border-t border-stone-100 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#EDE6DD] space-y-2">
                          <h5 className="font-extrabold text-[#231F1E]">
                            {lang === 'ar'
                              ? 'سجل تتبع المراحل (Status History)'
                              : 'Order Audit Trail'}
                          </h5>
                          <div className="space-y-1.5 max-h-40 overflow-y-auto">
                            {(o.status_history || []).map((h, i) => (
                              <div
                                key={i}
                                className="flex justify-between items-center bg-white p-2 rounded-xl border border-[#EDE6DD]"
                              >
                                <div>
                                  <span className="font-extrabold text-[#231F1E]">
                                    {translateStatus(h.status)}
                                  </span>
                                  {h.note && (
                                    <p className="text-[11px] text-stone-500">{h.note}</p>
                                  )}
                                </div>
                                <span className="text-[10px] text-stone-400 font-mono">
                                  {new Date(h.timestamp).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#EDE6DD] space-y-2">
                          <h5 className="font-extrabold text-[#231F1E]">
                            {lang === 'ar'
                              ? 'ملاحظات الموظفين الداخلية'
                              : 'Internal Staff Notes'}
                          </h5>
                          <textarea
                            rows={3}
                            defaultValue={o.staff_notes || ''}
                            placeholder={
                              lang === 'ar'
                                ? 'أضف ملاحظة داخلية حول التحميص أو التوصيل...'
                                : 'Add internal roastery or courier note...'
                            }
                            onBlur={e => void handleSaveStaffNote(o.id, e.target.value)}
                            className="w-full bg-white border border-[#EDE6DD] rounded-xl p-2.5 text-xs"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ===================================================================== */}
        {/* TAB 2: SUPABASE PRODUCTS & INVENTORY CONTROL                          */}
        {/* ===================================================================== */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-3xl border border-[#EDE6DD] flex flex-wrap items-center justify-between gap-3 shadow-sm">
              <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[240px]">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 text-stone-400 absolute top-1/2 -translate-y-1/2 start-3.5" />
                  <input
                    type="text"
                    placeholder={t('search_placeholder')}
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                    className="w-full bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl ps-9 pe-4 py-2.5 text-xs"
                  />
                </div>
                {['All', 'Crops', 'Boxes', 'Tools'].map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setProductCategoryFilter(cat)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold border ${
                      productCategoryFilter === cat
                        ? 'bg-[#231F1E] text-white border-[#231F1E]'
                        : 'bg-[#FAF7F2] text-stone-600 border-[#EDE6DD]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => openProductModal()}
                className="bg-[#231F1E] text-white px-5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>{t('add_product_btn')}</span>
              </button>
            </div>

            <div className="bg-white rounded-3xl border border-[#EDE6DD] overflow-x-auto shadow-sm">
              <table className="w-full text-start text-xs">
                <thead className="bg-[#FAF7F2] border-b border-[#EDE6DD] font-extrabold">
                  <tr>
                    <th className="p-4 text-start">{t('col_product')}</th>
                    <th className="p-4 text-start">{t('col_category')}</th>
                    <th className="p-4 text-start">{t('col_price')}</th>
                    <th className="p-4 text-start">{t('col_stock')}</th>
                    <th className="p-4 text-center">{t('bestseller_badge')}</th>
                    <th className="p-4 text-end">{t('col_actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredProducts.map(p => (
                    <tr key={p.id} className="hover:bg-[#FAF7F2]/50">
                      <td className="p-4 flex items-center gap-3">
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-12 h-12 rounded-xl object-cover bg-stone-100 shrink-0"
                        />
                        <div>
                          <p className="font-extrabold text-[#231F1E]">{p.name_ar || p.name}</p>
                          <p className="text-stone-400">
                            {p.name} • {p.origin}
                          </p>
                        </div>
                      </td>
                      <td className="p-4 font-bold">
                        {p.category} • {p.roast_level}
                      </td>
                      <td className="p-4 font-extrabold">
                        {p.price.toFixed(2)} {t('currency')}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => void handleQuickStockAdjust(p, -5)}
                            className="px-2 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 font-bold"
                          >
                            -5
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleQuickStockAdjust(p, -1)}
                            className="px-2 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 font-bold"
                          >
                            -1
                          </button>
                          <span
                            className={`font-extrabold min-w-[32px] text-center ${
                              p.stock_quantity <= 10 ? 'text-red-600' : 'text-emerald-700'
                            }`}
                          >
                            {p.stock_quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => void handleQuickStockAdjust(p, 1)}
                            className="px-2 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 font-bold"
                          >
                            +1
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleQuickStockAdjust(p, 5)}
                            className="px-2 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 font-bold"
                          >
                            +5
                          </button>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          type="button"
                          onClick={() => void handleToggleBestseller(p)}
                          className={`px-3 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1 ${
                            p.bestseller
                              ? 'bg-[#231F1E] text-[#EAE2D7]'
                              : 'bg-stone-100 text-stone-400'
                          }`}
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>{p.bestseller ? 'Yes' : 'No'}</span>
                        </button>
                      </td>
                      <td className="p-4 text-end space-x-2">
                        <button
                          type="button"
                          onClick={() => openProductModal(p)}
                          className="p-2 text-stone-600 hover:text-[#231F1E]"
                        >
                          <Edit2 className="w-4 h-4 inline" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDeleteProduct(p.id)}
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

        {/* ===================================================================== */}
        {/* TAB 3: CUSTOMER SUPPORT TICKETS CENTER                                */}
        {/* ===================================================================== */}
        {activeTab === 'tickets' && (
          <div className="space-y-4">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {(['All', 'Open', 'In Progress', 'Resolved', 'Closed'] as const).map(st => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setTicketFilter(st)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border ${
                    ticketFilter === st
                      ? 'bg-[#231F1E] text-white border-[#231F1E]'
                      : 'bg-white text-stone-600 border-[#EDE6DD]'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {filteredTickets.map(tk => (
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

        {/* Printable Packing Slip & Tax Invoice Modal */}
        {printingOrder && (
          <div className="fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-xl w-full p-8 shadow-2xl border border-[#EDE6DD] space-y-6">
              <div className="flex justify-between items-start border-b pb-4">
                <div>
                  <h3 className="font-black text-xl text-[#231F1E]">{t('invoice_header')}</h3>
                  <p className="text-xs text-stone-500 mt-1">
                    {printingOrder.order_number || printingOrder.id} •{' '}
                    {new Date(printingOrder.created_at).toLocaleString()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPrintingOrder(null)}
                  className="text-stone-400 hover:text-stone-900"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs bg-[#FAF7F2] p-4 rounded-2xl border border-[#EDE6DD]">
                <div>
                  <span className="font-bold text-stone-400 block">{t('customer_label')}</span>
                  <p className="font-extrabold text-[#231F1E]">{printingOrder.customer_name}</p>
                  <p>{printingOrder.customer_phone}</p>
                  <p>{printingOrder.customer_email}</p>
                </div>
                <div>
                  <span className="font-bold text-stone-400 block">{t('shipping')}</span>
                  <p className="font-extrabold text-[#231F1E]">
                    {printingOrder.address}, {printingOrder.city}
                  </p>
                  <p>
                    {printingOrder.courier_name} • AWB: #{printingOrder.tracking_number}
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                {(printingOrder.items || []).map((item, i) => (
                  <div key={i} className="flex justify-between border-b pb-2">
                    <span className="font-bold">
                      {item.quantity}x {item.name_ar || item.name} ({item.selectedWeight} /{' '}
                      {item.selectedGrind})
                    </span>
                    <span className="font-extrabold">
                      {(item.price * item.quantity).toFixed(2)} {t('currency')}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between font-black text-base pt-2">
                  <span>{t('total')}</span>
                  <span>
                    {Number(printingOrder.total_amount).toFixed(2)} {t('currency')}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="bg-[#231F1E] text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>{t('print_invoice')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrintingOrder(null)}
                  className="border border-stone-300 px-5 py-2.5 rounded-xl text-xs font-bold"
                >
                  {t('close_btn')}
                </button>
              </div>
            </div>
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
                    placeholder="Origin (Ethiopia)"
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="الإيحاءات بالعربي (شوكولاتة، توت)"
                    value={flavorNotesArInput}
                    onChange={e => setFlavorNotesArInput(e.target.value)}
                    className="bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3.5 py-2.5"
                  />
                  <input
                    type="text"
                    placeholder="Flavor Notes EN (Chocolate, Berry)"
                    value={flavorNotesInput}
                    onChange={e => setFlavorNotesInput(e.target.value)}
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

                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={Boolean(editingProduct.bestseller)}
                    onChange={e =>
                      setEditingProduct({ ...editingProduct, bestseller: e.target.checked })
                    }
                  />
                  <span className="font-bold">{t('bestseller_badge')}</span>
                </label>

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