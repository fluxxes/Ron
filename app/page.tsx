'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, Search, Coffee, Star, X, Plus, Minus, 
  Trash2, CheckCircle2, ShieldCheck, Truck, Award, ArrowRight, 
  ChevronRight, User, Lock, LogOut, LayoutDashboard 
} from 'lucide-react';
import { supabase } from './lib/supabase';

interface Product {
  id: string;
  name: string;
  origin: string;
  region: string;
  process: string;
  altitude: string;
  flavor_notes: string[];
  roast_level: string;
  description: string;
  price: number;
  image: string;
  weight_options: string[];
  grind_options: string[];
  bestseller?: boolean;
}

interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  image: string;
  selectedWeight: string;
  selectedGrind: string;
  quantity: number;
}

export default function RonStore() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedRoast, setSelectedRoast] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Auth state
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('customer');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isStaffDashboardOpen, setIsStaffDashboardOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Staff Dashboard Orders
  const [orders, setOrders] = useState<any[]>([]);

  // Quick View & Checkout
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
    const { data } = await supabase.from('products').select('*');
    if (data && data.length > 0) {
      setProducts(data);
    }
  };

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUser(session.user);
      fetchUserProfile(session.user.id);
    }
  };

  const fetchUserProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) {
      setUserRole(data.role);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (authMode === 'signin') {
      const { data, error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
      if (error) setAuthError(error.message);
      else {
        setUser(data.user);
        fetchUserProfile(data.user.id);
        setIsAuthOpen(false);
      }
    } else {
      const { data, error } = await supabase.auth.signUp({ email: authEmail, password: authPassword });
      if (error) setAuthError(error.message);
      else if (data.user) {
        await supabase.from('profiles').insert([{ id: data.user.id, email: authEmail, role: 'customer' }]);
        setUser(data.user);
        setUserRole('customer');
        setIsAuthOpen(false);
      }
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserRole('customer');
    setIsStaffDashboardOpen(false);
  };

  const fetchOrders = async () => {
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (data) setOrders(data);
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    fetchOrders();
  };

  const addToCart = (product: Product, weight = '250g', grind = 'Whole Bean', qty = 1) => {
    const cartItemId = `${product.id}-${weight}-${grind}`;
    setCart(prev => {
      const existing = prev.find(item => item.id === cartItemId);
      if (existing) {
        return prev.map(item => item.id === cartItemId ? { ...item, quantity: item.quantity + qty } : item);
      }
      return [...prev, { id: cartItemId, productId: product.id, name: product.name, price: product.price, image: product.image, selectedWeight: weight, selectedGrind: grind, quantity: qty }];
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean) as CartItem[]);
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from('orders').insert([{
      customer_name: formData.name,
      customer_email: formData.email,
      address: formData.address,
      city: formData.city,
      postal_code: formData.postalCode,
      total_amount: subtotal,
      items: cart
    }]);
    setOrderComplete(true);
    setCart([]);
  };

  const filteredProducts = products.filter(p => {
    const matchesRoast = selectedRoast === 'All' || p.roast_level === selectedRoast;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.origin.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRoast && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-stone-800 font-sans">
      
      {/* Announcement Bar */}
      <div className="bg-stone-900 text-stone-200 text-xs py-2 px-4 text-center font-medium">
        ☕ Welcome to <span className="text-amber-400 font-bold">RON</span> Specialty Coffee • Free shipping on orders over $45
      </div>

      {/* Navbar */}
      <header className="sticky top-0 z-40 bg-[#FBF9F5]/90 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-amber-900 text-white p-2 rounded-xl">
              <Coffee className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-wider text-stone-900">RON</span>
              <span className="block text-[9px] tracking-widest text-amber-800 font-bold uppercase">Specialty Roasters</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                {userRole === 'staff' && (
                  <button 
                    onClick={() => { setIsStaffDashboardOpen(true); fetchOrders(); }}
                    className="bg-amber-100 text-amber-900 px-3.5 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 hover:bg-amber-200 transition-all"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" /> Staff Dashboard
                  </button>
                )}
                <span className="text-xs font-semibold text-stone-600 hidden sm:inline">{user.email}</span>
                <button onClick={handleSignOut} className="p-2 text-stone-600 hover:text-red-600 transition-colors" title="Sign Out">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setIsAuthOpen(true)}
                className="text-xs font-bold bg-stone-200 text-stone-800 px-4 py-2 rounded-full hover:bg-stone-300 transition-all flex items-center gap-1.5"
              >
                <User className="w-3.5 h-3.5" /> Sign In / Up
              </button>
            )}

            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative bg-stone-900 text-white px-4 py-2.5 rounded-full flex items-center gap-2 text-sm font-medium hover:bg-amber-900 transition-all"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Cart</span>
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {cart.reduce((s, i) => s + i.quantity, 0)}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-stone-900 text-white py-24">
        <div className="absolute inset-0 z-0 opacity-40">
          <img src="https://images.unsplash.com/photo-1447933601403-0c6688de566e?q=80&w=1600&auto=format&fit=crop" alt="RON Coffee" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-stone-950 via-stone-900/80 to-transparent"></div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-800 text-amber-200 mb-4 inline-block">
              Single-Origin Micro-Batch
            </span>
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6">
              Exceptional Beans <br /><span className="text-amber-400">Roasted by RON</span>
            </h1>
            <p className="text-stone-300 text-base mb-8">
              Hand-selected from sustainable farms worldwide, freshly roasted to order, and shipped to your doorstep.
            </p>
            <a href="#shop" className="bg-amber-600 text-white px-8 py-3.5 rounded-full font-bold hover:bg-amber-700 transition-all inline-flex items-center gap-2">
              Explore RON Selection <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Product Catalog */}
      <section id="shop" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <span className="text-amber-800 font-semibold text-sm uppercase tracking-wider">RON Collection</span>
            <h2 className="text-3xl font-bold text-stone-900 mt-1">Available Coffee Beans</h2>
          </div>
          <div className="mt-4 md:mt-0 flex gap-2">
            {['All', 'Light', 'Medium', 'Dark'].map(roast => (
              <button 
                key={roast} 
                onClick={() => setSelectedRoast(roast)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${selectedRoast === roast ? 'bg-amber-900 text-white' : 'bg-white text-stone-600 border border-stone-300'}`}
              >
                {roast}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.map(product => (
            <div key={product.id} className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm hover:shadow-xl transition-all flex flex-col justify-between">
              <div>
                <div className="relative h-64 bg-stone-100">
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  <span className="absolute top-3 right-3 bg-white/90 text-stone-900 text-xs font-bold px-3 py-1 rounded-full">
                    {product.roast_level} Roast
                  </span>
                </div>
                <div className="p-6">
                  <div className="text-xs font-bold text-amber-800 uppercase mb-1">{product.origin} • {product.region}</div>
                  <h3 className="text-xl font-bold text-stone-900 mb-2">{product.name}</h3>
                  <p className="text-stone-600 text-sm line-clamp-2 mb-4">{product.description}</p>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {product.flavor_notes?.map((note, idx) => (
                      <span key={idx} className="bg-stone-100 text-stone-700 text-xs px-2.5 py-1 rounded-md font-medium">{note}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="px-6 pb-6 pt-0 flex items-center justify-between border-t border-stone-100 mt-4">
                <span className="text-2xl font-extrabold text-stone-900">${product.price.toFixed(2)}</span>
                <button 
                  onClick={() => { setQuickViewProduct(product); setSelectedWeight(product.weight_options[0]); setSelectedGrind(product.grind_options[0]); }}
                  className="bg-stone-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-amber-900 transition-colors"
                >
                  Select Options
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* QUICK VIEW / OPTIONS MODAL */}
      {quickViewProduct && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl relative">
            <button onClick={() => setQuickViewProduct(null)} className="absolute top-4 right-4 bg-stone-100 p-2 rounded-full z-10"><X className="w-5 h-5" /></button>
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="relative h-64 md:h-full bg-stone-100">
                <img src={quickViewProduct.image} alt={quickViewProduct.name} className="w-full h-full object-cover" />
              </div>
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
                    <select value={selectedGrind} onChange={e => setSelectedGrind(e.target.value)} className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-sm">
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
            <h3 className="text-2xl font-bold mb-2">{authMode === 'signin' ? 'Welcome Back to RON' : 'Create an Account'}</h3>
            {authError && <p className="text-xs text-red-600 mb-4">{authError}</p>}
            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Email</label>
                <input type="email" required value={authEmail} onChange={e => setAuthEmail(e.target.value)} className="w-full bg-stone-50 border rounded-xl px-4 py-3 text-sm" placeholder="ron@coffee.com" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Password</label>
                <input type="password" required value={authPassword} onChange={e => setAuthPassword(e.target.value)} className="w-full bg-stone-50 border rounded-xl px-4 py-3 text-sm" placeholder="••••••••" />
              </div>
              <button type="submit" className="w-full bg-amber-900 text-white py-3.5 rounded-xl font-bold hover:bg-amber-800">
                {authMode === 'signin' ? 'Sign In' : 'Sign Up'}
              </button>
            </form>
            <div className="mt-4 text-center">
              <button onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')} className="text-xs text-amber-900 font-bold hover:underline">
                {authMode === 'signin' ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STAFF DASHBOARD MODAL */}
      {isStaffDashboardOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsStaffDashboardOpen(false)} className="absolute top-6 right-6 p-2"><X className="w-5 h-5" /></button>
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2"><LayoutDashboard className="w-6 h-6 text-amber-900" /> RON Staff Dashboard - Customer Orders</h3>
            <div className="space-y-4">
              {orders.length === 0 ? (
                <p className="text-stone-500 text-center py-12">No orders placed yet.</p>
              ) : (
                orders.map(order => (
                  <div key={order.id} className="bg-stone-50 border rounded-2xl p-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 pb-4 border-b">
                      <div>
                        <h4 className="font-bold text-stone-900">{order.customer_name} ({order.customer_email})</h4>
                        <p className="text-xs text-stone-500">{order.address}, {order.city} ({order.postal_code})</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-extrabold text-amber-900">${order.total_amount.toFixed(2)}</span>
                        <select 
                          value={order.status} 
                          onChange={e => updateOrderStatus(order.id, e.target.value)}
                          className="bg-white border rounded-xl px-3 py-1.5 text-xs font-bold"
                        >
                          <option value="Pending Roasting">Pending Roasting</option>
                          <option value="Roasted & Packed">Roasted & Packed</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <span className="text-xs font-bold uppercase text-stone-400">Order Items:</span>
                      {order.items?.map((item: any, idx: number) => (
                        <div key={idx} className="text-xs text-stone-700 flex justify-between">
                          <span>{item.quantity}x {item.name} ({item.selectedWeight}, {item.selectedGrind})</span>
                          <span>${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* SLIDE-OVER CART DRAWER */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm flex justify-end">
          <div className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="font-bold text-lg">RON Cart ({cart.reduce((s, i) => s + i.quantity, 0)})</h3>
              <button onClick={() => setIsCartOpen(false)} className="p-2"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {cart.length === 0 ? (
                <div className="text-center py-20 text-stone-400">Your cart is empty</div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="flex gap-4 p-4 bg-stone-50 rounded-2xl border relative">
                    <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded-xl" />
                    <div className="flex-1">
                      <h4 className="font-bold text-sm">{item.name}</h4>
                      <p className="text-xs text-stone-500">{item.selectedWeight} • {item.selectedGrind}</p>
                      <div className="flex justify-between items-center mt-3">
                        <span className="font-bold">${(item.price * item.quantity).toFixed(2)}</span>
                        <div className="flex items-center gap-2 bg-white border rounded-lg px-2 py-1">
                          <button onClick={() => updateQuantity(item.id, -1)}><Minus className="w-3 h-3" /></button>
                          <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)}><Plus className="w-3 h-3" /></button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            {cart.length > 0 && (
              <div className="p-6 border-t bg-stone-50">
                <div className="flex justify-between font-extrabold text-lg mb-4">
                  <span>Total</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <button onClick={() => setIsCheckoutOpen(true)} className="w-full bg-amber-900 text-white py-4 rounded-xl font-bold hover:bg-amber-800">
                  Proceed to Checkout <ChevronRight className="w-4 h-4 inline" />
                </button>
              </div>
            )}
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
                <p className="text-stone-600 text-sm mb-6">Your order has been recorded in our database and is pending roasting.</p>
                <button onClick={() => { setOrderComplete(false); setIsCheckoutOpen(false); setIsCartOpen(false); }} className="bg-amber-900 text-white px-8 py-3.5 rounded-xl font-bold">Back to RON</button>
              </div>
            ) : (
              <form onSubmit={handleCheckoutSubmit} className="space-y-4">
                <h3 className="text-2xl font-bold mb-6">RON Secure Checkout</h3>
                <input type="text" required placeholder="Full Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-stone-50 border rounded-xl px-4 py-3 text-sm" />
                <input type="email" required placeholder="Email Address" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-stone-50 border rounded-xl px-4 py-3 text-sm" />
                <input type="text" required placeholder="Shipping Address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full bg-stone-50 border rounded-xl px-4 py-3 text-sm" />
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" required placeholder="City" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full bg-stone-50 border rounded-xl px-4 py-3 text-sm" />
                  <input type="text" required placeholder="Postal Code" value={formData.postalCode} onChange={e => setFormData({...formData, postalCode: e.target.value})} className="w-full bg-stone-50 border rounded-xl px-4 py-3 text-sm" />
                </div>
                <button type="submit" className="w-full bg-amber-900 text-white py-4 rounded-xl font-bold hover:bg-amber-800">Complete Order (${subtotal.toFixed(2)})</button>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}