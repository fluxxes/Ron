'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './lib/supabase';
import {
  Product,
  CartItem,
  Order,
  CustomerAddress,
  SavedPaymentMethod,
} from './types/coffee';
import { PRODUCTS, BREW_GUIDES } from './data/products';
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
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

export default function RonStore() {
  const { lang, t, toggleLanguage } = useTranslation();
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedRoast, setSelectedRoast] = useState<string>('All');

  // Non-disruptive in-website notification banner
  const [banner, setBanner] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showBanner = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setBanner({ message, type });
    setTimeout(() => {
      setBanner(prev => (prev?.message === message ? null : prev));
    }, 4500);
  }, []);

  // Auth & Customer Account State
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('customer');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [authError, setAuthError] = useState('');
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<SavedPaymentMethod[]>([]);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);

  // Quick View / Product Customization Modal
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [selectedWeight, setSelectedWeight] = useState('250g');
  const [selectedGrind, setSelectedGrind] = useState('Whole Bean');

  // Checkout Modal State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  const fetchProducts = useCallback(async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data && data.length > 0) {
      setProducts(data);
    } else {
      setProducts(PRODUCTS);
    }
  }, []);

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
    fetchProducts();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        fetchAccountData(session.user.id, session.user.email);
      }
    });

    if (typeof window !== 'undefined') {
      const savedCart = localStorage.getItem('ron_cart');
      if (savedCart) {
        try {
          setCart(JSON.parse(savedCart));
        } catch {}
      }
    }
  }, [fetchProducts, fetchAccountData]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ron_cart', JSON.stringify(cart));
    }
  }, [cart]);

  const handleAuthSubmit = async (email: string, pass: string) => {
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
      showBanner(
        lang === 'ar' ? 'تم تسجيل الدخول بنجاح' : 'Signed in successfully!',
        'success'
      );
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserRole('customer');
    setAddresses([]);
    setPaymentMethods([]);
    setCustomerOrders([]);
    showBanner(lang === 'ar' ? 'تم تسجيل الخروج' : 'Signed out.', 'success');
  };

  const addToCart = (
    product: Product,
    weight = '250g',
    grind = 'Whole Bean',
    qty = 1
  ) => {
    const cartItemId = `${product.id}-${weight}-${grind}`;
    setCart(prev => {
      const existing = prev.find(item => item.id === cartItemId);
      if (existing) {
        return prev.map(item =>
          item.id === cartItemId ? { ...item, quantity: item.quantity + qty } : item
        );
      }
      return [
        ...prev,
        {
          id: cartItemId,
          productId: product.id,
          name: product.name,
          name_ar: product.name_ar,
          price: product.price,
          image: product.image,
          selectedWeight: weight,
          selectedGrind: grind,
          quantity: qty,
        },
      ];
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(
      prev =>
        prev
          .map(item =>
            item.id === id
              ? item.quantity + delta > 0
                ? { ...item, quantity: item.quantity + delta }
                : null
              : item
          )
          .filter(Boolean) as CartItem[]
    );
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckoutSubmit = async (payload: CheckoutSubmissionPayload) => {
    const totalAmount = subtotal + payload.shippingCost;
    const generatedOrderNum = `RON-2026-${Math.floor(100000 + Math.random() * 900000)}`;

    // 1. Optional: Save new customer address if requested
    if (user && payload.saveAddress) {
      await supabase.from('customer_addresses').insert([
        {
          user_id: user.id,
          label: 'Home',
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

    // 2. Optional: Vault tokenized card metadata if requested
    if (user && payload.saveCard && payload.newCardDetails) {
      await supabase.from('saved_payment_methods').insert([
        {
          user_id: user.id,
          method_type: 'card',
          card_brand: payload.newCardDetails.card_brand,
          last4: payload.newCardDetails.last4,
          exp_month: payload.newCardDetails.exp_month,
          exp_year: payload.newCardDetails.exp_year,
          cardholder_name: payload.newCardDetails.cardholder_name,
          gateway_token: `tok_ron_${Date.now()}`,
          is_default: paymentMethods.length === 0,
        },
      ]);
    }

    // 3. Try Atomic High-Concurrency RPC first, with automatic fallback
    const { data: rpcOrder, error: rpcError } = await supabase.rpc('create_order_atomic', {
      p_user_id: user?.id || null,
      p_customer_name: payload.name,
      p_customer_email: payload.email,
      p_customer_phone: payload.phone,
      p_address: payload.address,
      p_city: payload.city,
      p_postal_code: payload.postalCode,
      p_national_address: payload.nationalAddress,
      p_shipping_method: payload.shippingMethod,
      p_shipping_cost: payload.shippingCost,
      p_subtotal: subtotal,
      p_total_amount: totalAmount,
      p_payment_method: payload.paymentMethod,
      p_payment_status: payload.paymentMethod === 'cod' ? 'Pending' : 'Paid',
      p_transaction_id: payload.transactionId,
      p_items: cart,
    });

    if (!rpcError && rpcOrder) {
      setCompletedOrder(rpcOrder as Order);
    } else {
      // Fallback if SQL RPC hasn't been executed yet
      const fallbackOrderData = {
        order_number: generatedOrderNum,
        user_id: user?.id || null,
        customer_name: payload.name,
        customer_email: payload.email,
        customer_phone: payload.phone,
        address: payload.address,
        city: payload.city,
        postal_code: payload.postalCode,
        national_address: payload.nationalAddress,
        shipping_method: payload.shippingMethod,
        shipping_cost: payload.shippingCost,
        subtotal,
        total_amount: totalAmount,
        payment_method: payload.paymentMethod,
        payment_status: payload.paymentMethod === 'cod' ? 'Pending' : 'Paid',
        transaction_id: payload.transactionId,
        status: 'Processing' as const,
        items: cart,
      };

      const { data: inserted } = await supabase
        .from('orders')
        .insert([fallbackOrderData])
        .select('*')
        .single();

      for (const item of cart) {
        const target = products.find(p => p.id === item.productId);
        if (target) {
          await supabase
            .from('products')
            .update({ stock_quantity: Math.max(0, target.stock_quantity - item.quantity) })
            .eq('id', item.productId);
        }
      }

      setCompletedOrder(
        (inserted as Order) || {
          ...fallbackOrderData,
          id: generatedOrderNum,
          created_at: new Date().toISOString(),
        }
      );
    }

    await fetchProducts();
    if (user) await fetchAccountData(user.id, user.email);
    setOrderComplete(true);
    setCart([]);
    showBanner(t('order_placed'), 'success');
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#2C2825] font-sans">
      
      {/* In-Website Notification Banner (Replaces disruptive browser alerts) */}
      {banner && (
        <div
          className={`fixed top-24 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-xl border flex items-center gap-2.5 text-xs font-bold transition-all ${
            banner.type === 'error'
              ? 'bg-red-950 text-red-100 border-red-800'
              : 'bg-[#2C2825] text-[#FAF7F2] border-[#C4A484]'
          }`}
        >
          {banner.type === 'error' ? (
            <AlertTriangle className="w-4 h-4 text-red-400" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-[#C4A484]" />
          )}
          <span>{banner.message}</span>
          <button onClick={() => setBanner(null)} className="ms-2 opacity-70 hover:opacity-100">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <Navbar
        user={user}
        userRole={userRole}
        cartCount={cart.reduce((s, i) => s + i.quantity, 0)}
        lang={lang}
        onToggleLang={toggleLanguage}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenAccount={() => setIsAccountOpen(true)}
        onOpenCart={() => setIsCartOpen(true)}
        onSignOut={handleSignOut}
        t={t}
      />

      {/* Main Storefront Product Catalog */}
      <main>
        <ProductGrid
          products={products}
          selectedRoast={selectedRoast}
          onSelectRoast={setSelectedRoast}
          lang={lang}
          onSelectProduct={p => {
            setQuickViewProduct(p);
            setSelectedWeight(p.weight_options?.[0] || '250g');
            setSelectedGrind(p.grind_options?.[0] || 'Whole Bean');
          }}
          onQuickAdd={p => {
            addToCart(p, p.weight_options?.[0] || '250g', p.grind_options?.[0] || 'Whole Bean', 1);
          }}
          t={t}
        />

        {/* Preserved Interactive Brew Guides Section */}
        <section id="brew-guides" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-[#EDE6DD]">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-[#C4A484] font-semibold text-xs uppercase tracking-wider block mb-2">
              RŌN BARISTA ACADEMY
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#2C2825] mb-3">
              {t('brew_guides_title')}
            </h2>
            <p className="text-stone-500 text-xs sm:text-sm">{t('brew_guides_subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {BREW_GUIDES.map((guide, idx) => (
              <div
                key={idx}
                className="bg-white rounded-3xl p-6 border border-[#EFECE6] shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-[#EAE2D7] text-[#5A4D41] flex items-center justify-center">
                    <Coffee className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold bg-[#FAF7F2] border border-[#EDE6DD] px-3 py-1 rounded-full flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#C4A484]" />
                    {lang === 'ar' ? guide.time_ar : guide.time}
                  </span>
                </div>
                <h3 className="text-lg font-extrabold text-[#2C2825] mb-2">
                  {lang === 'ar' ? guide.method_ar : guide.method}
                </h3>
                <p className="text-xs text-[#C4A484] font-bold mb-1">
                  {lang === 'ar' ? guide.ratio_ar : guide.ratio}
                </p>
                <p className="text-xs text-stone-500 mb-4">
                  {lang === 'ar' ? guide.grind_ar : guide.grind}
                </p>
                <ol className="space-y-2 text-xs text-stone-600 border-t border-stone-100 pt-4">
                  {(lang === 'ar' ? guide.steps_ar : guide.steps).map((step, sIdx) => (
                    <li key={sIdx} className="flex gap-2">
                      <span className="font-extrabold text-[#2C2825]">{sIdx + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </section>

        {/* About & Contact Footer Section */}
        <footer id="about" className="bg-[#2C2825] text-[#FAF7F2] py-16 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-10">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#EAE2D7] flex items-center justify-center mb-4">
                <span className="font-serif font-extrabold tracking-widest text-[#2C2825] text-sm">
                  RŌN
                </span>
              </div>
              <h4 className="font-extrabold text-lg mb-2">{t('about_title')}</h4>
              <p className="text-xs text-stone-300 leading-relaxed">{t('about_desc')}</p>
            </div>

            <div>
              <h4 className="font-extrabold text-lg mb-3">{t('nav_track')}</h4>
              <p className="text-xs text-stone-300 mb-4">{t('track_page_subtitle')}</p>
              <Link
                href="/track"
                className="inline-flex items-center gap-2 bg-[#EAE2D7] text-[#2C2825] px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-white transition-all"
              >
                <Truck className="w-4 h-4" />
                <span>{t('track_your_order')}</span>
              </Link>
            </div>

            <div id="contact">
              <h4 className="font-extrabold text-lg mb-3">{t('contact_title')}</h4>
              <p className="text-xs text-stone-300 mb-3">{t('contact_desc')}</p>
              <p className="text-xs text-[#C4A484] font-bold">care@roncoffee.sa • +966 50 000 0000</p>
              <p className="text-[11px] text-stone-400 mt-4">
                © {new Date().getFullYear()} RŌN Specialty Roastery. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </main>

      {/* PRODUCT QUICK VIEW & WEIGHT / GRIND CUSTOMIZATION MODAL */}
      {quickViewProduct && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl relative border border-[#EDE6DD]">
            <button
              onClick={() => setQuickViewProduct(null)}
              className="absolute top-4 end-4 bg-white/90 p-2 rounded-full z-10 shadow"
            >
              <X className="w-5 h-5 text-[#2C2825]" />
            </button>
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="relative h-64 md:h-full bg-stone-100 p-3">
                <img
                  src={quickViewProduct.image}
                  alt={quickViewProduct.name}
                  className="w-full h-full object-cover rounded-2xl"
                />
              </div>
              <div className="p-6 sm:p-8 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-[#C4A484] uppercase block mb-1">
                    {lang === 'ar' && quickViewProduct.origin_ar
                      ? `${quickViewProduct.origin_ar} • ${quickViewProduct.region_ar || quickViewProduct.region}`
                      : `${quickViewProduct.origin} • ${quickViewProduct.region}`}
                  </span>
                  <h3 className="text-2xl font-extrabold text-[#2C2825] mb-2">
                    {lang === 'ar' && quickViewProduct.name_ar
                      ? quickViewProduct.name_ar
                      : quickViewProduct.name}
                  </h3>
                  <p className="text-stone-600 text-xs leading-relaxed mb-4">
                    {lang === 'ar' && quickViewProduct.description_ar
                      ? quickViewProduct.description_ar
                      : quickViewProduct.description}
                  </p>

                  {/* Weight Options */}
                  <div className="mb-4">
                    <label className="block text-xs font-bold text-stone-500 mb-2">
                      {t('bag_size')}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {quickViewProduct.weight_options?.map(w => (
                        <button
                          key={w}
                          type="button"
                          onClick={() => setSelectedWeight(w)}
                          className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                            selectedWeight === w
                              ? 'bg-[#2C2825] text-white border-[#2C2825]'
                              : 'bg-[#FAF7F2] text-stone-700 border-[#EDE6DD]'
                          }`}
                        >
                          {w}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Grind Options */}
                  <div className="mb-6">
                    <label className="block text-xs font-bold text-stone-500 mb-2">
                      {t('grind_type')}
                    </label>
                    <select
                      value={selectedGrind}
                      onChange={e => setSelectedGrind(e.target.value)}
                      className="w-full bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#2C2825]"
                    >
                      {quickViewProduct.grind_options?.map(g => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-stone-100">
                  <span className="text-2xl font-extrabold text-[#2C2825]">
                    {(
                      quickViewProduct.price *
                      (selectedWeight === '500g' ? 1.8 : selectedWeight === '1kg' ? 3.3 : 1)
                    ).toFixed(2)}{' '}
                    <span className="text-sm">{t('currency')}</span>
                  </span>
                  <button
                    onClick={() => {
                      const mult =
                        selectedWeight === '500g' ? 1.8 : selectedWeight === '1kg' ? 3.3 : 1;
                      addToCart(
                        { ...quickViewProduct, price: quickViewProduct.price * mult },
                        selectedWeight,
                        selectedGrind
                      );
                      setQuickViewProduct(null);
                    }}
                    className="bg-[#2C2825] text-white px-6 py-3 rounded-full text-xs font-bold hover:bg-[#3E3834] transition-all"
                  >
                    {t('add_to_cart_btn')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CART DRAWER */}
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

      {/* AUTH MODAL */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSubmit={handleAuthSubmit}
        onAuthSuccess={u => {
          setUser(u);
          fetchAccountData(u.id, u.email);
        }}
        authError={authError}
        t={t}
      />

      {/* CUSTOMER ACCOUNT HUB MODAL */}
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
        t={t}
      />

      {/* MULTI-METHOD CHECKOUT MODAL */}
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
        t={t}
      />
    </div>
  );
}