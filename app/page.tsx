// Copyright (c) 2026 (RON). Developed by (fluxes) All rights reserved.
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase, getSecureCartSessionKey } from './lib/supabase';
import { Product, CartItem, Order, CustomerAddress, SavedPaymentMethod } from './types/coffee';
import { localizeProduct } from './data/products';
import { createCourierShipment } from './lib/deliveryService';
import { processOrderPayment } from './lib/paymentService';
import {
  useSiteSettings,
  getEnabledWeights,
  getEnabledGrinds,
  calculateConfiguredUnitPrice,
} from './lib/siteSettings';
import Navbar from './components/Navbar';
import ProductGrid from './components/ProductGrid';
import CartDrawer from './components/CartDrawer';
import AuthModal from './components/AuthModal';
import CustomerAccountModal from './components/CustomerAccountModal';
import CheckoutModal, { CheckoutSubmissionPayload } from './components/CheckoutModal';
import { useTranslation } from './lib/useTranslation';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Coffee,
  Clock,
  Truck,
  ShoppingBag,
  Plus,
  Minus,
  Mail,
  Phone,
  MessageCircle,
} from 'lucide-react';
import Link from 'next/link';

export default function RonStore() {
  const { lang, t, toggleLanguage } = useTranslation();
  const { settings } = useSiteSettings();

  const enabledWeights = useMemo(() => getEnabledWeights(settings), [settings]);
  const enabledGrinds = useMemo(() => getEnabledGrinds(settings), [settings]);

  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedRoast, setSelectedRoast] = useState<string>('All');
  const [banner, setBanner] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showBanner = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setBanner({ message, type });
    setTimeout(() => setBanner(null), 4000);
  }, []);

  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('customer');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [authError, setAuthError] = useState('');
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<SavedPaymentMethod[]>([]);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);

  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [selectedWeight, setSelectedWeight] = useState('250g');
  const [selectedGrind, setSelectedGrind] = useState('Whole Bean');
  const [quickViewQty, setQuickViewQty] = useState(1);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  const fetchProducts = useCallback(async (): Promise<Product[]> => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) {
      const normalized = data.map(item => localizeProduct(item));
      setProducts(normalized);
      return normalized;
    }
    return [];
  }, []);

  const hydrateCartFromSupabase = useCallback(
    async (catalog: Product[], userId?: string | null) => {
      if (catalog.length === 0) return;
      try {
        const sessionKey = getSecureCartSessionKey(userId);
        const query = userId
          ? supabase
              .from('cart_items')
              .select('*')
              .or(`session_key.eq.${sessionKey},user_id.eq.${userId}`)
          : supabase.from('cart_items').select('*').eq('session_key', sessionKey);

        const { data: rows } = await query;
        if (!rows || rows.length === 0) return;

        const hydrated: CartItem[] = [];
        for (const row of rows) {
          const prod = catalog.find(p => String(p.id) === String(row.product_id));
          if (!prod || prod.stock_quantity <= 0) continue;

          const weight = row.selected_weight || enabledWeights[0]?.key || '250g';
          const grind = row.selected_grind || enabledGrinds[0]?.key || 'Whole Bean';
          const unitPrice = calculateConfiguredUnitPrice(prod, weight, grind, settings);
          const id = `${prod.id}-${weight}-${grind}`;
          const validQty = Math.min(prod.stock_quantity, Math.max(1, Number(row.quantity) || 1));

          const existingIdx = hydrated.findIndex(item => item.id === id);
          if (existingIdx >= 0) {
            hydrated[existingIdx].quantity = Math.min(
              prod.stock_quantity,
              hydrated[existingIdx].quantity + validQty
            );
          } else {
            hydrated.push({
              id,
              productId: prod.id,
              name: prod.name,
              name_ar: prod.name_ar,
              price: unitPrice,
              image: prod.image,
              selectedWeight: weight,
              selectedGrind: grind,
              quantity: validQty,
            });
          }
        }

        if (hydrated.length > 0) {
          setCart(hydrated);
        }
      } catch {
        // Non-blocking fallback
      }
    },
    [settings, enabledWeights, enabledGrinds]
  );

  const fetchAccountData = useCallback(async (userId: string, userEmail?: string) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (profile) setUserRole(profile.role);

    const { data: addrData } = await supabase
      .from('customer_addresses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (addrData) setAddresses(addrData);

    const { data: payData } = await supabase
      .from('saved_payment_methods')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (payData) setPaymentMethods(payData);

    const { data: ordData } = await supabase
      .from('orders')
      .select('*')
      .or(`user_id.eq.${userId}${userEmail ? `,customer_email.eq.${userEmail}` : ''}`)
      .order('created_at', { ascending: false });
    if (ordData) setCustomerOrders(ordData);
  }, []);

  useEffect(() => {
    let active = true;
    const initStore = async () => {
      const catalog = await fetchProducts();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!active) return;
      if (session?.user) {
        setUser(session.user);
        await fetchAccountData(session.user.id, session.user.email);
        await hydrateCartFromSupabase(catalog, session.user.id);
      } else {
        await hydrateCartFromSupabase(catalog, null);
      }
    };
    void initStore();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        void fetchAccountData(session.user.id, session.user.email);
      } else {
        setUser(null);
        setUserRole('customer');
        setAddresses([]);
        setPaymentMethods([]);
        setCustomerOrders([]);
      }
    });

    const productChannel = supabase
      .channel('public-catalog-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        void fetchProducts();
      })
      .subscribe();

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
      supabase.removeChannel(productChannel);
    };
  }, [fetchProducts, fetchAccountData, hydrateCartFromSupabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserRole('customer');
    setIsAccountOpen(false);
    showBanner(lang === 'ar' ? 'تم تسجيل الخروج بنجاح' : 'Signed out successfully', 'success');
  };

  const syncCartToDatabase = async (
    productId: string,
    weight: string,
    grind: string,
    quantity: number
  ) => {
    try {
      const sessionKey = getSecureCartSessionKey(user?.id);
      if (quantity <= 0) {
        await supabase.from('cart_items').delete().match({
          session_key: sessionKey,
          product_id: productId,
          selected_weight: weight,
          selected_grind: grind,
        });
      } else {
        await supabase.from('cart_items').upsert(
          [
            {
              user_id: user?.id || null,
              session_key: sessionKey,
              product_id: productId,
              selected_weight: weight,
              selected_grind: grind,
              quantity,
              updated_at: new Date().toISOString(),
            },
          ],
          { onConflict: 'session_key,product_id,selected_weight,selected_grind' }
        );
      }
    } catch {
      // Non-blocking fallback
    }
  };

  const addToCart = (
    rawProduct: Product,
    weight?: string,
    grind?: string,
    qty = 1,
    openDrawer = false
  ) => {
    const product = localizeProduct(rawProduct);
    if (product.stock_quantity <= 0) {
      showBanner(t('out_of_stock'), 'error');
      return;
    }

    const isTool = product.category === 'Tools';
    const defaultW = enabledWeights[0]?.key || '250g';
    const defaultG = enabledGrinds[0]?.key || 'Whole Bean';
    const finalWeight = isTool ? 'Standard' : weight || defaultW;
    const finalGrind = isTool ? 'Kit' : grind || defaultG;
    const unitPrice = calculateConfiguredUnitPrice(product, finalWeight, finalGrind, settings);
    const cartItemId = `${product.id}-${finalWeight}-${finalGrind}`;

    setCart(prev => {
      const existing = prev.find(item => item.id === cartItemId);
      const nextQty = existing
        ? Math.min(product.stock_quantity, existing.quantity + qty)
        : Math.min(product.stock_quantity, qty);

      void syncCartToDatabase(product.id, finalWeight, finalGrind, nextQty);

      if (existing) {
        return prev.map(item =>
          item.id === cartItemId ? { ...item, price: unitPrice, quantity: nextQty } : item
        );
      }
      return [
        ...prev,
        {
          id: cartItemId,
          productId: product.id,
          name: product.name,
          name_ar: product.name_ar,
          price: unitPrice,
          image: product.image,
          selectedWeight: finalWeight,
          selectedGrind: finalGrind,
          quantity: nextQty,
        },
      ];
    });

    if (openDrawer) {
      setIsCartOpen(true);
    } else {
      showBanner(
        lang === 'ar'
          ? `تمت إضافة "${product.name_ar || product.name}" إلى السلة`
          : `Added "${product.name}" to cart`,
        'success'
      );
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev =>
      prev
        .map(item => {
          if (item.id !== id) return item;
          const prod = products.find(p => p.id === item.productId);
          const maxStock = prod ? prod.stock_quantity : 99;
          const nextQty = Math.min(maxStock, item.quantity + delta);
          void syncCartToDatabase(
            item.productId,
            item.selectedWeight,
            item.selectedGrind,
            nextQty
          );
          return nextQty > 0 ? { ...item, quantity: nextQty } : null;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalCartItems = cart.reduce((s, i) => s + i.quantity, 0);

  const handleCheckoutSubmit = async (payload: CheckoutSubmissionPayload) => {
    if (cart.length === 0) {
      showBanner(t('cart_empty'), 'error');
      return;
    }

    const paymentRes = await processOrderPayment({
      amountSar: subtotal + payload.shippingCost,
      currency: 'SAR',
      method: payload.paymentMethod,
      customerName: payload.name,
      customerEmail: payload.email,
      customerPhone: payload.phone,
      description: `RON Specialty Coffee Order (${cart.length} items)`,
      idempotencyKey: payload.idempotencyKey,
      cardDetails: payload.newCardDetails,
    });

    if (!paymentRes.success) {
      showBanner(
        paymentRes.errorMessage ||
          (lang === 'ar' ? 'تعذر إتمام عملية الدفع' : 'Payment verification failed'),
        'error'
      );
      return;
    }

    if (user && payload.saveAddress) {
      await supabase.from('customer_addresses').insert([
        {
          user_id: user.id,
          label: lang === 'ar' ? 'عنوان الشحن' : 'Shipping',
          recipient_name: payload.name,
          phone: payload.phone,
          country: 'Saudi Arabia',
          city: payload.city,
          address_line1: payload.address,
          postal_code: payload.postalCode,
          national_address: payload.nationalAddress,
          is_default_shipping: addresses.length === 0,
          is_default_billing: addresses.length === 0,
        },
      ]);
    }

    if (user && payload.saveCard && payload.newCardDetails) {
      await supabase.from('saved_payment_methods').insert([
        {
          user_id: user.id,
          method_type: 'card',
          cardholder_name: payload.newCardDetails.cardholder_name,
          card_brand: payload.newCardDetails.card_brand,
          last4: payload.newCardDetails.last4,
          exp_month: payload.newCardDetails.exp_month,
          exp_year: payload.newCardDetails.exp_year,
          gateway_token: `tok_${Date.now()}`,
          is_default: paymentMethods.length === 0,
        },
      ]);
    }

    const courierRes = await createCourierShipment({
      provider: payload.courierProvider,
      orderNumber: '',
      recipientName: payload.name,
      recipientPhone: payload.phone,
      recipientEmail: payload.email,
      city: payload.city,
      address: payload.address,
      postalCode: payload.postalCode,
      nationalAddress: payload.nationalAddress,
      codAmount: payload.paymentMethod === 'cod' ? subtotal + payload.shippingCost : 0,
      weightKg: Math.max(0.5, cart.reduce((s, i) => s + i.quantity * 0.25, 0)),
      items: cart,
    });

    const { data: rpcOrder, error: rpcError } = await supabase.rpc('create_order_atomic', {
      p_idempotency_key: payload.idempotencyKey,
      p_session_key: getSecureCartSessionKey(user?.id),
      p_user_id: user?.id || null,
      p_customer_name: payload.name,
      p_customer_email: payload.email,
      p_customer_phone: payload.phone,
      p_address: payload.address,
      p_city: payload.city,
      p_postal_code: payload.postalCode,
      p_national_address: payload.nationalAddress,
      p_shipping_method: payload.shippingMethod,
      p_payment_method: payload.paymentMethod,
      p_transaction_id: paymentRes.transactionId || payload.transactionId,
      p_courier_provider: payload.courierProvider,
      p_tracking_number: courierRes.trackingNumber,
      p_waybill_url: courierRes.waybillUrl,
      p_items: cart,
    });

    if (rpcError || !rpcOrder) {
      showBanner(
        rpcError?.message ||
          (lang === 'ar'
            ? 'تعذر إتمام الطلب. يرجى التحقق من المخزون والمحاولة مرة أخرى.'
            : 'Could not place order. Please check stock and try again.'),
        'error'
      );
      return;
    }

    setCompletedOrder(rpcOrder as Order);
    await fetchProducts();
    if (user) await fetchAccountData(user.id, user.email);
    setOrderComplete(true);
    setCart([]);
    showBanner(t('order_placed'), 'success');
  };

  const liveQuickViewUnitPrice = quickViewProduct
    ? calculateConfiguredUnitPrice(quickViewProduct, selectedWeight, selectedGrind, settings)
    : 0;

  return (
    <div
      className="min-h-screen pb-20 sm:pb-0 transition-colors"
      style={{
        backgroundColor: settings.theme.bg_color || '#FAF7F2',
        color: settings.theme.primary_dark || '#231F1E',
      }}
    >
      {banner && (
        <div className="fixed top-24 inset-x-0 z-50 flex justify-center px-4 pointer-events-none">
          <div
            className={`pointer-events-auto flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-xl border text-xs font-extrabold transition-all ${
              banner.type === 'error'
                ? 'bg-red-950 text-red-100 border-red-800'
                : 'bg-[#231F1E] text-[#EAE2D7] border-[#5A4D41]'
            }`}
          >
            {banner.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{banner.message}</span>
            <button
              type="button"
              onClick={() => setBanner(null)}
              className="ms-2 opacity-70 hover:opacity-100"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      <Navbar
        user={user}
        userRole={userRole}
        cartCount={totalCartItems}
        lang={lang}
        onToggleLang={toggleLanguage}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenAccount={() => setIsAccountOpen(true)}
        onOpenCart={() => setIsCartOpen(true)}
        onSignOut={handleSignOut}
        t={t}
      />

      <main>
        <ProductGrid
          products={products}
          cart={cart}
          selectedRoast={selectedRoast}
          onSelectRoast={setSelectedRoast}
          lang={lang}
          onSelectProduct={p => {
            setQuickViewProduct(p);
            setSelectedWeight(enabledWeights[0]?.key || '250g');
            setSelectedGrind(enabledGrinds[0]?.key || 'Whole Bean');
            setQuickViewQty(1);
          }}
          onQuickAdd={p =>
            addToCart(p, enabledWeights[0]?.key, enabledGrinds[0]?.key, 1, false)
          }
          onUpdateCartQuantity={updateQuantity}
          t={t}
        />

        {/* Roastery Feature Banner */}
        {settings.features.show_roastery_banner && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div
              className="text-[#FAF7F2] rounded-3xl p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl"
              style={{ backgroundColor: settings.theme.primary_dark || '#231F1E' }}
            >
              <div className="space-y-3 max-w-2xl">
                <span
                  className="text-xs font-extrabold uppercase tracking-widest"
                  style={{ color: settings.theme.accent_gold || '#C4A484' }}
                >
                  {t('roastery_banner_badge')}
                </span>
                <h2 className="text-2xl sm:text-4xl font-black leading-tight">
                  {t('roastery_banner_title')}
                </h2>
                <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
                  {t('roastery_banner_desc')}
                </p>
              </div>
              {settings.features.show_track_order && (
                <Link
                  href={settings.content.banner_cta_link || '/track'}
                  className="bg-[#EAE2D7] text-[#231F1E] px-7 py-4 rounded-2xl text-xs sm:text-sm font-extrabold hover:bg-white transition-all flex items-center gap-2 shrink-0"
                >
                  <Truck className="w-4 h-4 text-[#8C735B]" />
                  <span>{t('nav_track')}</span>
                </Link>
              )}
            </div>
          </section>
        )}

        {/* Dynamic CMS Brew Guides Section */}
        {settings.features.show_brew_guides && settings.brew_guides.length > 0 && (
          <section id="brew-guides" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span
                className="text-xs font-bold uppercase tracking-widest block mb-1"
                style={{ color: settings.theme.accent_gold || '#B89F86' }}
              >
                {t('brew_guides_badge')}
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-[#231F1E]">
                {t('brew_guides_title')}
              </h2>
              <p className="text-xs sm:text-sm text-stone-500 mt-2">{t('brew_guides_subtitle')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {settings.brew_guides.map((g, i) => (
                <div
                  key={g.id || i}
                  className="bg-white p-6 rounded-3xl border border-[#EDE6DD] shadow-sm space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-lg text-[#231F1E]">
                      {lang === 'ar' ? g.method_ar : g.method}
                    </h3>
                    <Coffee
                      className="w-5 h-5"
                      style={{ color: settings.theme.accent_gold || '#C4A484' }}
                    />
                  </div>
                  <div className="text-xs space-y-1 bg-[#FAF7F2] p-3.5 rounded-2xl border border-[#EDE6DD]">
                    <p>
                      <strong>{lang === 'ar' ? 'النسبة:' : 'Ratio:'}</strong>{' '}
                      {lang === 'ar' ? g.ratio_ar : g.ratio}
                    </p>
                    <p>
                      <strong>{lang === 'ar' ? 'الطحنة:' : 'Grind:'}</strong>{' '}
                      {lang === 'ar' ? g.grind_ar : g.grind}
                    </p>
                    <p className="flex items-center gap-1 text-[#8C735B] font-bold pt-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{lang === 'ar' ? g.time_ar : g.time}</span>
                    </p>
                  </div>
                  <ol className="text-xs text-stone-600 space-y-2 list-decimal list-inside">
                    {(lang === 'ar' ? g.steps_ar : g.steps).map((st, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {st}
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Dynamic CMS Footer & Contact */}
        {settings.features.show_footer && (
          <footer id="about" className="bg-white border-t border-[#E6DFD5] mt-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-extrabold text-lg text-[#231F1E] mb-2">{t('about_title')}</h3>
                <p className="text-xs text-stone-500 leading-relaxed max-w-md">{t('about_desc')}</p>
              </div>
              <div id="contact" className="space-y-3">
                <h3 className="font-extrabold text-lg text-[#231F1E]">{t('contact_title')}</h3>
                <p className="text-xs text-stone-500 leading-relaxed">{t('contact_desc')}</p>

                <div className="flex flex-wrap gap-3 text-xs font-bold text-stone-700">
                  {settings.content.contact_email && (
                    <a
                      href={`mailto:${settings.content.contact_email}`}
                      className="inline-flex items-center gap-1.5 bg-[#FAF7F2] px-3 py-2 rounded-xl border border-[#EDE6DD] hover:border-[#231F1E]"
                    >
                      <Mail className="w-3.5 h-3.5 text-[#9C7E5E]" />
                      <span>{settings.content.contact_email}</span>
                    </a>
                  )}
                  {settings.content.contact_phone && (
                    <a
                      href={`tel:${settings.content.contact_phone}`}
                      dir="ltr"
                      className="inline-flex items-center gap-1.5 bg-[#FAF7F2] px-3 py-2 rounded-xl border border-[#EDE6DD] hover:border-[#231F1E]"
                    >
                      <Phone className="w-3.5 h-3.5 text-[#9C7E5E]" />
                      <span>{settings.content.contact_phone}</span>
                    </a>
                  )}
                  {settings.content.whatsapp_number && (
                    <a
                      href={`https://wa.me/${settings.content.whatsapp_number.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-3 py-2 rounded-xl border border-emerald-200 hover:bg-emerald-100"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>
                  )}
                </div>

                {settings.features.show_customer_accounts && (
                  <button
                    type="button"
                    onClick={() => (user ? setIsAccountOpen(true) : setIsAuthOpen(true))}
                    className="text-white px-5 py-2.5 rounded-xl text-xs font-bold"
                    style={{ backgroundColor: settings.theme.primary_dark || '#231F1E' }}
                  >
                    {t('account_tab_tickets')}
                  </button>
                )}
              </div>
            </div>
            <div className="border-t border-[#E6DFD5] py-5 text-center text-xs text-stone-400 font-bold">
              © 2026 {settings.theme.brand_logo_text || 'RŌN'}. {t('rights_reserved')}
            </div>
          </footer>
        )}
      </main>

      {/* Product Quick-View Modal (250g Default + No French Press + Live +1 SAR Grind Price) */}
      {quickViewProduct && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-[#EDE6DD] grid grid-cols-1 md:grid-cols-2 relative max-h-[92vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setQuickViewProduct(null)}
              className="absolute top-4 end-4 z-10 p-2 rounded-full bg-white/90 text-stone-700 shadow"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="h-64 md:h-full bg-[#EAE2D7]">
              <img
                src={quickViewProduct.image}
                alt={quickViewProduct.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-6 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <span className="text-xs font-bold text-[#9C7E5E]">
                  {lang === 'ar'
                    ? quickViewProduct.origin_ar || quickViewProduct.origin
                    : quickViewProduct.origin}{' '}
                  •{' '}
                  {lang === 'ar'
                    ? quickViewProduct.process_ar || quickViewProduct.process
                    : quickViewProduct.process}
                </span>
                <h3 className="text-xl font-extrabold text-[#231F1E]">
                  {lang === 'ar'
                    ? quickViewProduct.name_ar || quickViewProduct.name
                    : quickViewProduct.name}
                </h3>
                <p className="text-xs text-stone-500 leading-relaxed">
                  {lang === 'ar'
                    ? quickViewProduct.description_ar || quickViewProduct.description
                    : quickViewProduct.description}
                </p>

                {quickViewProduct.category !== 'Tools' && (
                  <>
                    <div>
                      <label className="block text-[11px] font-bold text-stone-500 mb-1.5">
                        {t('bag_size')}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {enabledWeights.map(w => (
                          <button
                            key={w.key}
                            type="button"
                            onClick={() => setSelectedWeight(w.key)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                              selectedWeight === w.key
                                ? 'bg-[#231F1E] text-white border-[#231F1E]'
                                : 'bg-[#FAF7F2] text-stone-700 border-[#EDE6DD]'
                            }`}
                          >
                            {lang === 'ar' ? w.label_ar : w.label_en}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-stone-500 mb-1.5">
                        {t('grind_type')}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {enabledGrinds.map(g => (
                          <button
                            key={g.key}
                            type="button"
                            onClick={() => setSelectedGrind(g.key)}
                            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                              selectedGrind === g.key
                                ? 'bg-[#231F1E] text-white border-[#231F1E]'
                                : 'bg-[#FAF7F2] text-stone-700 border-[#EDE6DD]'
                            }`}
                          >
                            <span>{lang === 'ar' ? g.label_ar : g.label_en}</span>
                            {Number(g.extra_price) > 0 && (
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                                  selectedGrind === g.key
                                    ? 'bg-[#C4A484]/25 text-[#EAE2D7]'
                                    : 'bg-[#EAE2D7] text-[#5A4D41]'
                                }`}
                              >
                                +{Number(g.extra_price)} {t('currency')}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="pt-4 border-t border-[#EDE6DD] space-y-3">
                <div className="flex items-center justify-between text-sm font-extrabold text-[#231F1E]">
                  <span>{t('total')}</span>
                  <span className="text-lg">
                    {(liveQuickViewUnitPrice * quickViewQty).toFixed(2)} {t('currency')}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3 py-2">
                    <button
                      type="button"
                      onClick={() => setQuickViewQty(q => Math.max(1, q - 1))}
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-extrabold w-5 text-center">{quickViewQty}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setQuickViewQty(q => Math.min(quickViewProduct.stock_quantity, q + 1))
                      }
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={quickViewProduct.stock_quantity <= 0}
                    onClick={() => {
                      addToCart(
                        quickViewProduct,
                        selectedWeight,
                        selectedGrind,
                        quickViewQty,
                        true
                      );
                      setQuickViewProduct(null);
                    }}
                    className="flex-1 bg-[#231F1E] text-white py-3 rounded-xl text-xs font-bold hover:bg-[#3A3331] flex items-center justify-center gap-2"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>{t('add_to_cart')}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <CartDrawer
        isOpen={isCartOpen}
        cart={cart}
        lang={lang}
        onClose={() => setIsCartOpen(false)}
        onUpdateQuantity={updateQuantity}
        onProceedToCheckout={() => {
          setIsCartOpen(false);
          setOrderComplete(false);
          setIsCheckoutOpen(true);
        }}
        t={t}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSubmit={async (email, pass) => {
          setAuthError('');
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password: pass,
          });
          if (error) {
            setAuthError(error.message);
          } else if (data.user) {
            setUser(data.user);
            await fetchAccountData(data.user.id, data.user.email);
            setIsAuthOpen(false);
          }
        }}
        authError={authError}
        t={t}
      />

      <CustomerAccountModal
        isOpen={isAccountOpen}
        onClose={() => setIsAccountOpen(false)}
        user={user}
        addresses={addresses}
        paymentMethods={paymentMethods}
        customerOrders={customerOrders}
        onRefreshAccountData={() => user && fetchAccountData(user.id, user.email)}
        onReorder={items => {
          setCart(items);
          setIsAccountOpen(false);
          setIsCartOpen(true);
        }}
        onNotify={showBanner}
        lang={lang}
        t={t}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cart={cart}
        subtotal={subtotal}
        orderComplete={orderComplete}
        completedOrder={completedOrder}
        savedAddresses={addresses}
        savedPaymentMethods={paymentMethods}
        user={user}
        onCheckoutSubmit={handleCheckoutSubmit}
        onResetCheckout={() => {
          setOrderComplete(false);
          setIsCheckoutOpen(false);
        }}
        lang={lang}
        t={t}
      />
    </div>
  );
}