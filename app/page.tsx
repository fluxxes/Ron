'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Product, CartItem, Order } from './types/coffee';
import Navbar from './components/Navbar';
import ProductGrid from './components/ProductGrid';
import CartDrawer from './components/CartDrawer';
import StaffDashboard from './components/StaffDashboard';
import { X, CheckCircle2, ChevronRight } from 'lucide-react';

export default function RonStore() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedRoast, setSelectedRoast] = useState<string>('All');
  
  // Auth state
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('customer');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Staff Dash & Orders
  const [isStaffDashOpen, setIsStaffDashOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);

  // Quick View / Checkout
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [selectedWeight, setSelectedWeight] = useState('250g');
  const [selectedGrind, setSelectedGrind] = useState('Whole Bean');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', address: '', city: '', postalCode: '' });

  useEffect(() => {
    fetchProducts();
    checkUser();
  }, []);

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (data) setProducts(data);
  };

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUser(session.user);
      const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      if (data) setUserRole(data.role);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const { data, error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
    if (error) setAuthError(error.message);
    else if (data.user) {
      setUser(data.user);
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
      if (profile) setUserRole(profile.role);
      setIsAuthOpen(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserRole('customer');
    setIsStaffDashOpen(false);
  };

  const handleSaveProduct = async (productData: Partial<Product>) => {
    if (productData.id) {
      await supabase.from('products').update(productData).eq('id', productData.id);
    } else {
      await supabase.from('products').insert([productData]);
    }
    fetchProducts();
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm('Delete this product from RON?')) {
      await supabase.from('products').delete().eq('id', id);
      fetchProducts();
    }
  };

  const fetchOrders = async () => {
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (data) setOrders(data);
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    await supabase.from('orders').update({ status }).eq('id', orderId);
    fetchOrders();
  };

  const addToCart = (product: Product, weight = '250g', grind = 'Whole Bean', qty = 1) => {
    const cartItemId = `${product.id}-${weight}-${grind}`;
    setCart(prev => {
      const existing = prev.find(item => item.id === cartItemId);
      if (existing) return prev.map(item => item.id === cartItemId ? { ...item, quantity: item.quantity + qty } : item);
      return [...prev, { id: cartItemId, productId: product.id, name: product.name, price: product.price, image: product.image, selectedWeight: weight, selectedGrind: grind, quantity: qty }];
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => item.id === id ? (item.quantity + delta > 0 ? { ...item, quantity: item.quantity + delta } : null) : item).filter(Boolean) as CartItem[]);
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from('orders').insert([{
      customer_name: formData.name, customer_email: formData.email, address: formData.address,
      city: formData.city, postal_code: formData.postalCode, total_amount: subtotal, status: 'Processing', items: cart
    }]);

    for (const item of cart) {
      const target = products.find(p => p.id === item.productId);
      if (target) {
        await supabase.from('products').update({ stock_quantity: Math.max(0, target.stock_quantity - item.quantity) }).eq('id', item.productId);
      }
    }

    fetchProducts();
    setOrderComplete(true);
    setCart([]);
  };

  const filteredProducts = products.filter(p => {
    const matchesRoast = selectedRoast === 'All' || p.roast_level === selectedRoast;
    return matchesRoast;
  });

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-stone-800 font-sans">
      <Navbar 
        user={user} userRole={userRole} cartCount={cart.reduce((s, i) => s + i.quantity, 0)}
        onOpenAuth={() => setIsAuthOpen(true)} onOpenCart={() => setIsCartOpen(true)}
        onOpenStaffDash={() => { setIsStaffDashOpen(true); fetchOrders(); }} onSignOut={handleSignOut}
      />

      {/* Hero Section with Coffee Advertising Image */}
      <section className="relative overflow-hidden bg-stone-900 text-white py-24">
        <div className="absolute inset-0 z-0 opacity-40">
          <img 
            src="https://images.unsplash.com/photo-1447933601403-0c6688de566e?q=80&w=1600&auto=format&fit=crop" 
            alt="RON Coffee Roasting" 
            className="w-full h-full object-cover" 
          />
          <div className="absolute inset-0 bg-gradient-to-r from-stone-950 via-stone-900/80 to-transparent"></div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-800 text-amber-200 mb-4 inline-block">
              RON Specialty Micro-Batch Roastery
            </span>
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6">
              Exceptional Beans <br /><span className="text-amber-400">Roasted by RON</span>
            </h1>
            <p className="text-stone-300 text-base mb-8">
              Hand-selected from sustainable estates worldwide, freshly roasted to order, and shipped straight to your cup.
            </p>
            <a href="#shop" className="bg-amber-600 text-white px-8 py-3.5 rounded-full font-bold hover:bg-amber-700 transition-all inline-flex items-center gap-2">
              Explore RON Selection <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      <ProductGrid 
        products={filteredProducts} selectedRoast={selectedRoast} onSelectRoast={setSelectedRoast}
        onSelectProduct={(p) => { setQuickViewProduct(p); setSelectedWeight(p.weight_options[0] || '250g'); setSelectedGrind(p.grind_options[0] || 'Whole Bean'); }}
      />

      <CartDrawer 
        isOpen={isCartOpen} cart={cart} onClose={() => setIsCartOpen(false)}
        onUpdateQuantity={updateQuantity} onProceedToCheckout={() => { setIsCartOpen(false); setIsCheckoutOpen(true); }}
      />

      <StaffDashboard 
        isOpen={isStaffDashOpen} products={products} orders={orders} onClose={() => setIsStaffDashOpen(false)}
        onSaveProduct={handleSaveProduct} onDeleteProduct={handleDeleteProduct} onUpdateOrderStatus={updateOrderStatus}
      />

      {/* QUICK VIEW MODAL */}
      {quickViewProduct && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl relative">
            <button onClick={() => setQuickViewProduct(null)} className="absolute top-4 right-4 bg-stone-100 p-2 rounded-full z-10"><X className="w-5 h-5" /></button>
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="relative h-64 md:h-full bg-stone-100"><img src={quickViewProduct.image} alt={quickViewProduct.name} className="w-full h-full object-cover" /></div>
              <div className="p-8 flex flex-col justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-stone-900 mb-2">{quickViewProduct.name}</h3>
                  <p className="text-stone-600 text-sm mb-4">{quickViewProduct.description}</p>
                  <div className="mb-4">
                    <label className="block text-xs font-bold uppercase text-stone-500 mb-2">Bag Size</label>
                    <div className="grid grid-cols-3 gap-2">
                      {quickViewProduct.weight_options?.map(w => (
                        <button key={w} onClick={() => setSelectedWeight(w)} className={`py-2 rounded-xl text-xs font-bold border ${selectedWeight === w ? 'bg-amber-900 text-white border-amber-900' : 'bg-stone-50 text-stone-700'}`}>{w}</button>
                      ))}
                    </div>
                  </div>
                  <div className="mb-6">
                    <label className="block text-xs font-bold uppercase text-stone-500 mb-2">Grind Type</label>
                    <select value={selectedGrind} onChange={e => setSelectedGrind(e.target.value)} className="w-full bg-stone-50 border rounded-xl px-3 py-2 text-sm">
                      {quickViewProduct.grind_options?.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t">
                  <span className="text-2xl font-extrabold">${(quickViewProduct.price * (selectedWeight === '500g' ? 1.8 : selectedWeight === '1kg' ? 3.3 : 1)).toFixed(2)}</span>
                  <button onClick={() => {
                    const mult = selectedWeight === '500g' ? 1.8 : selectedWeight === '1kg' ? 3.3 : 1;
                    addToCart({ ...quickViewProduct, price: quickViewProduct.price * mult }, selectedWeight, selectedGrind);
                    setQuickViewProduct(null);
                  }} className="bg-amber-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-amber-800">Add to Cart</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AUTH MODAL */}
      {isAuthOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl relative">
            <button onClick={() => setIsAuthOpen(false)} className="absolute top-6 right-6 p-2"><X className="w-5 h-5" /></button>
            <h3 className="text-2xl font-bold mb-2">Sign In to RON</h3>
            {authError && <p className="text-xs text-red-600 mb-4">{authError}</p>}
            <form onSubmit={handleAuth} className="space-y-4">
              <input type="email" required value={authEmail} onChange={e => setAuthEmail(e.target.value)} className="w-full bg-stone-50 border rounded-xl px-4 py-3 text-sm" placeholder="staff@roncoffee.com" />
              <input type="password" required value={authPassword} onChange={e => setAuthPassword(e.target.value)} className="w-full bg-stone-50 border rounded-xl px-4 py-3 text-sm" placeholder="••••••••" />
              <button type="submit" className="w-full bg-amber-900 text-white py-3.5 rounded-xl font-bold">Sign In</button>
            </form>
          </div>
        </div>
      )}

      {/* CHECKOUT MODAL */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-8 shadow-2xl relative">
            <button onClick={() => setIsCheckoutOpen(false)} className="absolute top-6 right-6"><X className="w-5 h-5" /></button>
            {orderComplete ? (
              <div className="text-center py-12">
                <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2">RON Order Placed!</h3>
                <p className="text-stone-600 text-sm mb-6">Order saved and stock updated automatically.</p>
                <button onClick={() => { setOrderComplete(false); setIsCheckoutOpen(false); }} className="bg-amber-900 text-white px-8 py-3.5 rounded-xl font-bold">Back to Store</button>
              </div>
            ) : (
              <form onSubmit={handleCheckoutSubmit} className="space-y-4">
                <h3 className="text-2xl font-bold mb-6">RON Checkout</h3>
                <input type="text" required placeholder="Full Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-stone-50 border rounded-xl px-4 py-3 text-sm" />
                <input type="email" required placeholder="Email Address" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-stone-50 border rounded-xl px-4 py-3 text-sm" />
                <input type="text" required placeholder="Shipping Address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full bg-stone-50 border rounded-xl px-4 py-3 text-sm" />
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" required placeholder="City" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full bg-stone-50 border rounded-xl px-4 py-3 text-sm" />
                  <input type="text" required placeholder="Postal Code" value={formData.postalCode} onChange={e => setFormData({...formData, postalCode: e.target.value})} className="w-full bg-stone-50 border rounded-xl px-4 py-3 text-sm" />
                </div>
                <button type="submit" className="w-full bg-amber-900 text-white py-4 rounded-xl font-bold">Complete Order (${subtotal.toFixed(2)})</button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}