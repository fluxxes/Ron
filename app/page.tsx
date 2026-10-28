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
import { PRODUCTS, BREW_GUIDES, localizeProduct } from './data/products';
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
} from 'lucide-react';
import Link from 'next/link';

export default function RonStore() {
  const { lang, t, toggleLanguage, translateOption } = useTranslation();
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedRoast, setSelectedRoast] = useState<string>('All');

  const [banner, setBanner] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showBanner = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setBanner({ message, type });
    setTimeout(() => {
      setBanner(prev => (prev?.message === message ? null : prev));
    }, 4000);
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

  const getWeightMultiplier = (product: Product, chosenWeight: string) => {
    if (product.category === 'Tools' || product.category === 'Boxes') return 1;
    const baseWeight = product.weight_options?.[0] || '250g';
    if (chosenWeight === baseWeight) return 1;
    if (baseWeight === '250g') {
      if (chosenWeight === '500g') return 1.85;
      if (chosenWeight === '1kg') return 3.4;
    }
    return 1;
  };

  const fetchProducts = useCallback(async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      // Merge database products with our reference products & full Arabic/English translations
      const localizedDb = data.map(item => localizeProduct(item));
      const existingIds = new Set(localizedDb.map(i => i.id));
      const missingReferenceProducts = PRODUCTS.filter(p => !existingIds.has(p.id));
      setProducts([...localizedDb, ...missingReferenceProducts]);
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
    showBanner(lang === 'ar' ? 'تم تسجيل الخروج بنجاح' : 'Signed out.', 'success');
  };

  const addToCart = (
    rawProduct: Product,
    weight?: string,
    grind?: string,
    qty = 1,
    openDrawer = false
  ) => {
    const product = localizeProduct(rawProduct);
    const isTool = product.category === 'Tools';
    const finalWeight = isTool ? 'Standard' : weight || product.weight_options?.[0] || '250g';
    const finalGrind = isTool ? 'Kit' : grind || product.grind_options?.[0] || 'Whole Bean';
    const unitPrice = Number((product.price * getWeightMultiplier(product, finalWeight)).toFixed(2));
    const cartItemId = `${product.id}-${finalWeight}-${finalGrind}`;

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
          price: unitPrice,
          image: product.image,
          selectedWeight: finalWeight,
          selectedGrind: finalGrind,
          quantity: qty,
        },
      ];
    });

    if (openDrawer) {
      setIsCartOpen(true);
    } else {
      const title = lang === 'ar' && product.name_ar ? product.name_ar : product.name;
      showBanner(
        lang === 'ar' ? `تمت إضافة "${title}" للسلة` : `Added "${title}" to cart`,
        'success'
      );
    }
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
  const totalCartItems = cart.reduce((s, i) => s + i.quantity, 0);

  const handleCheckoutSubmit = async (payload: CheckoutSubmissionPayload) => {
    const totalAmount = subtotal + payload.shippingCost;
    const generatedOrderNum = `RON-2026-${Math.floor(100000 + Math.random() * 900000)}`;

    if (user && payload.saveAddress) {
      await supabase.from('customer_addresses').insert([
        {
          user_id: user.id,
          label: lang === 'ar' ? 'المنزل' : 'Home',
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
    <div className="min-h-screen bg-[#FAF7F2] text-[#231F1E] pb-20 sm:pb-0">
      
      {/* In-Website Notification Banner */}
      {banner && (
        <div
          className={`fixed top-24 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-full shadow-xl border flex items-center gap-2 text-xs font-bold transition-all max-w-[92vw] ${
            banner.type === 'error'
              ? 'bg-red-950 text-red-100 border-red-800'
              : 'bg-[#231F1E] text-[#FAF7F2] border-[#C4A484]'
          }`}
        >
          {banner.type === 'error' ? (
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-[#C4A484] shrink-0" />
          )}
          <span className="truncate">{banner.message}</span>
          <button
            type="button"
            onClick={() => setBanner(null)}
            className="ms-1 opacity-70 hover:opacity-100"
          >
            <X className="w-3.5 h-3.5" />
          </button>
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
            const loc = localizeProduct(p);
            setQuickViewProduct(loc);
            setSelectedWeight(loc.weight_options?.[0] || '250g');
            setSelectedGrind(loc.grind_options?.[0] || 'Whole Bean');
            setQuickViewQty(1);
          }}
          onQuickAdd={p => {
            addToCart(p, p.weight_options?.[0], p.grind_options?.[0], 1, false);
          }}
          onUpdateCartQuantity={updateQuantity}
          t={t}
        />

        {/* Dark Espresso Rounded Feature Container matching the bottom of the Reference Image */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div className="bg-[#231F1E] text-[#FAF7F2] rounded-[32px] p-8 sm:p-12 shadow-xl relative overflow-hidden">
            <div className="max-w-2xl relative z-10">
              <span className="text-[#C4A484] text-xs font-bold uppercase tracking-widest block mb-2">
                {t('roastery_banner_badge')}
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold mb-3 leading-tight">
                {t('roastery_banner_title')}
              </h2>
              <p className="text-stone-300 text-xs sm:text-sm leading-relaxed mb-6">
                {t('roastery_banner_desc')}
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/track"
                  className="bg-[#EAE2D7] text-[#231F1E] px-6 py-3 rounded-full text-xs font-extrabold hover:bg-white transition-all inline-flex items-center gap-2"
                >
                  <Truck className="w-4 h-4" />
                  <span>{t('track_your_order')}</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Brew Guides Section */}
        <section
          id="brew-guides"
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 border-t border-[#E6DFD5]"
        >
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
            <span className="text-[#B89F86] font-bold text-xs uppercase tracking-wider block mb-2">
              {t('brew_guides_badge')}
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#231F1E] mb-2">
              {t('brew_guides_title')}
            </h2>
            <p className="text-stone-500 text-xs sm:text-sm">{t('brew_guides_subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {BREW_GUIDES.map((guide, idx) => (
              <div
                key={idx}
                className="bg-white rounded-3xl p-6 border border-[#ECE6DF] shadow-sm hover:shadow-md transition-all"
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
                <h3 className="text-lg font-extrabold text-[#231F1E] mb-2">
                  {lang === 'ar' ? guide.method_ar : guide.method}
                </h3>
                <p className="text-xs text-[#9C7E5E] font-bold mb-1">
                  {lang === 'ar' ? guide.ratio_ar : guide.ratio}
                </p>
                <p className="text-xs text-stone-500 mb-4">
                  {lang === 'ar' ? guide.grind_ar : guide.grind}
                </p>
                <ol className="space-y-2 text-xs text-stone-600 border-t border-stone-100 pt-4">
                  {(lang === 'ar' ? guide.steps_ar : guide.steps).map((step, sIdx) => (
                    <li key={sIdx} className="flex gap-2">
                      <span className="font-extrabold text-[#231F1E]">{sIdx + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer id="about" className="bg-[#231F1E] text-[#FAF7F2] py-14 mt-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="w-12 h-12 rounded-md bg-[#DFD3C3] flex items-center justify-center mb-4">
                <span className="font-serif font-extrabold tracking-widest text-[#231F1E] text-sm">
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
                className="inline-flex items-center gap-2 bg-[#EAE2D7] text-[#231F1E] px-5 py-2.5 rounded-full text-xs font-bold hover:bg-white transition-all"
              >
                <Truck className="w-4 h-4" />
                <span>{t('track_your_order')}</span>
              </Link>
            </div>

            <div id="contact">
              <h4 className="font-extrabold text-lg mb-3">{t('contact_title')}</h4>
              <p className="text-xs text-stone-300 mb-3">{t('contact_desc')}</p>
              <p className="text-xs text-[#C4A484] font-bold" dir="ltr">
                care@roncoffee.sa • +966 50 000 0000
              </p>
              <p className="text-[11px] text-stone-400 mt-4">
                © {new Date().getFullYear()} {t('rights_reserved')}
              </p>
            </div>
          </div>
        </footer>
      </main>

      {/* Mobile Floating Sticky Cart Bar */}
      {totalCartItems > 0 && !isCartOpen && !isCheckoutOpen && (
        <div className="sm:hidden fixed bottom-3 inset-x-3 z-40">
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-[#231F1E] text-white p-4 rounded-2xl shadow-2xl border border-[#C4A484]/40 flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <span className="bg-[#EAE2D7] text-[#231F1E] text-xs font-extrabold w-6 h-6 rounded-full flex items-center justify-center">
                {totalCartItems}
              </span>
              <span className="text-xs font-bold">{t('view_cart_bar')}</span>
            </div>
            <span className="text-xs font-extrabold text-[#EAE2D7]">
              {subtotal.toFixed(2)} {t('currency')}
            </span>
          </button>
        </div>
      )}

      {/* PRODUCT QUICK VIEW & CUSTOMIZATION MODAL */}
      {quickViewProduct && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl relative border border-[#EDE6DD] max-h-[92dvh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setQuickViewProduct(null)}
              className="absolute top-4 end-4 bg-white/90 p-2 rounded-full z-10 shadow"
            >
              <X className="w-5 h-5 text-[#231F1E]" />
            </button>
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="relative h-56 md:h-full bg-stone-100 p-3">
                <img
                  src={quickViewProduct.image}
                  alt={quickViewProduct.name}
                  className="w-full h-full object-cover rounded-2xl"
                />
              </div>
              <div className="p-5 sm:p-8 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-[#9C7E5E] uppercase block mb-1">
                    {lang === 'ar'
                      ? `${quickViewProduct.origin_ar || quickViewProduct.origin} • ${
                          quickViewProduct.region_ar || quickViewProduct.region
                        }`
                      : `${quickViewProduct.origin} • ${quickViewProduct.region}`}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-[#231F1E] mb-2">
                    {lang === 'ar'
                      ? quickViewProduct.name_ar || quickViewProduct.name
                      : quickViewProduct.name}
                  </h3>
                  <p className="text-stone-600 text-xs leading-relaxed mb-4">
                    {lang === 'ar'
                      ? quickViewProduct.description_ar || quickViewProduct.description
                      : quickViewProduct.description}
                  </p>

                  {quickViewProduct.category !== 'Tools' && (
                    <>
                      {quickViewProduct.weight_options &&
                        quickViewProduct.weight_options.length > 1 && (
                          <div className="mb-4">
                            <label className="block text-xs font-bold text-stone-500 mb-2">
                              {t('bag_size')}
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                              {quickViewProduct.weight_options.map(w => (
                                <button
                                  key={w}
                                  type="button"
                                  onClick={() => setSelectedWeight(w)}
                                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                                    selectedWeight === w
                                      ? 'bg-[#231F1E] text-white border-[#231F1E]'
                                      : 'bg-[#FAF7F2] text-stone-700 border-[#EDE6DD]'
                                  }`}
                                >
                                  {translateOption(w)}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                      {quickViewProduct.grind_options &&
                        quickViewProduct.grind_options.length > 1 && (
                          <div className="mb-4">
                            <label className="block text-xs font-bold text-stone-500 mb-2">
                              {t('grind_type')}
                            </label>
                            <select
                              value={selectedGrind}
                              onChange={e => setSelectedGrind(e.target.value)}
                              className="w-full bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#231F1E]"
                            >
                              {quickViewProduct.grind_options.map(g => (
                                <option key={g} value={g}>
                                  {translateOption(g)}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                    </>
                  )}

                  <div className="mb-5 flex items-center justify-between bg-[#FAF7F2] p-3 rounded-2xl border border-[#EDE6DD]">
                    <span className="text-xs font-bold text-stone-600">{t('quantity_label')}</span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setQuickViewQty(q => Math.max(1, q - 1))}
                        className="w-7 h-7 rounded-lg bg-white border border-stone-200 flex items-center justify-center"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-extrabold w-5 text-center">{quickViewQty}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setQuickViewQty(q =>
                            Math.min(quickViewProduct.stock_quantity || 99, q + 1)
                          )
                        }
                        className="w-7 h-7 rounded-lg bg-white border border-stone-200 flex items-center justify-center"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-stone-100">
                  <span className="text-xl sm:text-2xl font-extrabold text-[#231F1E]">
                    {(
                      quickViewProduct.price *
                      getWeightMultiplier(quickViewProduct, selectedWeight) *
                      quickViewQty
                    ).toFixed(2)}{' '}
                    <span className="text-xs sm:text-sm">{t('currency')}</span>
                  </span>
                  <button
                    type="button"
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
                    className="bg-[#231F1E] text-white px-6 py-3 rounded-full text-xs font-bold hover:bg-[#3A3331] transition-all flex items-center gap-2"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>{t('add_to_cart_btn')}</span>
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
        onAuthSubmit={handleAuthSubmit}
        onAuthSuccess={u => {
          setUser(u);
          fetchAccountData(u.id, u.email);
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
        t={t}
      />
    </div>
  );
}