'use client';

import React, { useState } from 'react';
import { 
  ShoppingBag, Search, Coffee, Star, 
  X, Plus, Minus, Trash2, CheckCircle2, ShieldCheck, Truck, 
  Award, ArrowRight, ChevronRight
} from 'lucide-react';
import { PRODUCTS, BREW_GUIDES } from './data/products';
import { Product, CartItem } from './types/coffee';

export default function CoffeeStore() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedRoast, setSelectedRoast] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [promoError, setPromoError] = useState('');
  const [promoSuccess, setPromoSuccess] = useState('');
  
  // Quick View Modal
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [selectedWeight, setSelectedWeight] = useState('250g');
  const [selectedGrind, setSelectedGrind] = useState('Whole Bean');

  // Checkout Modal State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [formData, setFormData] = useState({
    name: '', email: '', address: '', city: '', postalCode: '', country: 'United States', cardNumber: ''
  });

  // Subscription Builder State
  const [subBags, setSubBags] = useState(2);
  const [subFrequency, setSubFrequency] = useState('Every 2 weeks');
  const [subRoastPref, setSubRoastPref] = useState("Roaster&apos;s Choice");

  // Filtered Products
  const filteredProducts = PRODUCTS.filter(product => {
    const matchesRoast = selectedRoast === 'All' || product.roastLevel === selectedRoast;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          product.origin.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.flavorNotes.some(note => note.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesRoast && matchesSearch;
  });

  // Cart Handlers
  const addToCart = (product: Product, weight = '250g', grind = 'Whole Bean', qty = 1) => {
    const cartItemId = `${product.id}-${weight}-${grind}`;
    setCart(prev => {
      const existing = prev.find(item => item.id === cartItemId);
      if (existing) {
        return prev.map(item => 
          item.id === cartItemId ? { ...item, quantity: item.quantity + qty } : item
        );
      }
      return [...prev, {
        id: cartItemId,
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        selectedWeight: weight,
        selectedGrind: grind,
        quantity: qty
      }];
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

  const removeItem = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal > 45 || subtotal === 0 ? 0 : 5.00;
  const discountAmount = subtotal * discount;
  const total = Math.max(0, subtotal - discountAmount + shipping);

  const applyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError('');
    setPromoSuccess('');
    if (promoCode.trim().toUpperCase() === 'COFFEE10') {
      setDiscount(0.10);
      setPromoSuccess('10% discount applied successfully!');
    } else {
      setPromoError('Invalid promo code. Try "COFFEE10"');
    }
  };

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOrderComplete(true);
    setCart([]);
  };

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-stone-800 font-sans selection:bg-amber-800 selection:text-white">
      
      {/* Top Banner */}
      <div className="bg-stone-900 text-stone-200 text-xs py-2 px-4 text-center font-medium tracking-wide">
        ☕ Free shipping on all orders over $45 • Use code <span className="text-amber-400 font-bold">COFFEE10</span> for 10% off your first order!
      </div>

      {/* Navigation */}
      <header className="sticky top-0 z-40 bg-[#FBF9F5]/90 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-amber-900 text-white p-2 rounded-xl shadow-md">
              <Coffee className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-stone-900">VELVET BEAN</span>
              <span className="block text-[10px] tracking-widest text-amber-800 font-semibold uppercase">Specialty Roasters</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-stone-600">
            <a href="#shop" className="hover:text-amber-900 transition-colors">Shop Coffee</a>
            <a href="#subscriptions" className="hover:text-amber-900 transition-colors">Subscriptions</a>
            <a href="#brew-guides" className="hover:text-amber-900 transition-colors">Brew Guides</a>
          </nav>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative bg-stone-900 text-white px-4 py-2.5 rounded-full flex items-center gap-2.5 text-sm font-medium hover:bg-amber-900 transition-all shadow-sm hover:shadow"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Cart</span>
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-600 text-white text-[11px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-stone-900 text-white py-24 lg:py-32">
        <div className="absolute inset-0 z-0 opacity-40">
          <img 
            src="https://images.unsplash.com/photo-1447933601403-0c6688de566e?q=80&w=1600&auto=format&fit=crop" 
            alt="Coffee Roasting Background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-stone-950 via-stone-900/80 to-transparent"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-800/80 text-amber-200 mb-6">
              <Star className="w-3.5 h-3.5 fill-amber-200" /> Award-Winning Micro-Batch Roastery
            </span>
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight mb-6">
              Freshly Roasted <br />
              <span className="text-amber-400">Single-Origin</span> Beans
            </h1>
            <p className="text-stone-300 text-lg mb-8 leading-relaxed">
              Ethically sourced from sustainable high-altitude farms across the globe, small-batch roasted to highlight their distinct flavor profiles, and delivered straight to your door.
            </p>
            <div className="flex flex-wrap gap-4">
              <a 
                href="#shop" 
                className="bg-amber-600 text-white px-8 py-4 rounded-full font-semibold hover:bg-amber-700 transition-all shadow-lg flex items-center gap-2"
              >
                Explore Collection <ArrowRight className="w-4 h-4" />
              </a>
              <a 
                href="#subscriptions" 
                className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-8 py-4 rounded-full font-semibold hover:bg-white/20 transition-all"
              >
                Join Coffee Club
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="bg-stone-200/60 border-y border-stone-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-stone-700">
          <div className="flex items-center gap-3">
            <div className="bg-white p-3 rounded-xl shadow-sm text-amber-800"><Truck className="w-6 h-6" /></div>
            <div>
              <h4 className="font-bold text-sm text-stone-900">Free Shipping</h4>
              <p className="text-xs text-stone-500">On orders over $45</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white p-3 rounded-xl shadow-sm text-amber-800"><FlameIcon className="w-6 h-6" /></div>
            <div>
              <h4 className="font-bold text-sm text-stone-900">Freshly Roasted</h4>
              <p className="text-xs text-stone-500">Roasted to order weekly</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white p-3 rounded-xl shadow-sm text-amber-800"><Award className="w-6 h-6" /></div>
            <div>
              <h4 className="font-bold text-sm text-stone-900">Ethically Sourced</h4>
              <p className="text-xs text-stone-500">100% Direct Fair Trade</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white p-3 rounded-xl shadow-sm text-amber-800"><ShieldCheck className="w-6 h-6" /></div>
            <div>
              <h4 className="font-bold text-sm text-stone-900">Satisfaction Guaranteed</h4>
              <p className="text-xs text-stone-500">Love every sip or refund</p>
            </div>
          </div>
        </div>
      </section>

      {/* Shop Section */}
      <section id="shop" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <span className="text-amber-800 font-semibold text-sm uppercase tracking-wider">Our Inventory</span>
            <h2 className="text-3xl font-bold tracking-tight text-stone-900 mt-1">Featured Coffee Beans</h2>
          </div>

          <div className="mt-6 md:mt-0 flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input 
                type="text"
                placeholder="Search coffee or flavor notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white border border-stone-300 rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-800 w-64 shadow-sm"
              />
            </div>

            <div className="flex bg-white border border-stone-300 rounded-full p-1 shadow-sm">
              {['All', 'Light', 'Medium', 'Dark'].map((roast) => (
                <button
                  key={roast}
                  onClick={() => setSelectedRoast(roast)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    selectedRoast === roast ? 'bg-amber-900 text-white shadow' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {roast} Roast
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.map((product) => (
            <div 
              key={product.id} 
              className="group bg-white rounded-2xl border border-stone-200/80 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="relative h-72 w-full bg-stone-100 overflow-hidden">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {product.bestseller && (
                    <span className="absolute top-3 left-3 bg-amber-800 text-white text-[10px] uppercase tracking-wider font-bold px-3 py-1 rounded-full shadow">
                      Bestseller
                    </span>
                  )}
                  <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-md text-stone-900 text-xs font-semibold px-3 py-1 rounded-full shadow">
                    {product.roastLevel} Roast
                  </span>
                </div>

                <div className="p-6">
                  <div className="text-xs font-semibold text-amber-800 tracking-wider uppercase mb-1">
                    {product.origin} • {product.region}
                  </div>
                  <h3 className="text-xl font-bold text-stone-900 mb-2 group-hover:text-amber-900 transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-stone-600 text-sm line-clamp-2 mb-4">
                    {product.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mb-6">
                    {product.flavorNotes.map((note, idx) => (
                      <span key={idx} className="bg-stone-100 text-stone-700 text-xs px-2.5 py-1 rounded-md font-medium">
                        {note}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="px-6 pb-6 pt-0 flex items-center justify-between border-t border-stone-100 mt-4">
                <div>
                  <span className="text-xs text-stone-400 block">From</span>
                  <span className="text-2xl font-extrabold text-stone-900">${product.price.toFixed(2)}</span>
                </div>
                <button
                  onClick={() => {
                    setQuickViewProduct(product);
                    setSelectedWeight(product.weightOptions[0]);
                    setSelectedGrind(product.grindOptions[0]);
                  }}
                  className="bg-stone-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-amber-900 transition-colors shadow-sm"
                >
                  Select Options
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-24 bg-white rounded-3xl border border-stone-200">
            <Coffee className="w-12 h-12 text-stone-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-stone-800">No coffee beans found</h3>
            <p className="text-stone-500 text-sm mt-1">Try searching for a different origin, flavor, or roast level.</p>
          </div>
        )}
      </section>

      {/* Subscription Builder Section */}
      <section id="subscriptions" className="bg-amber-950 text-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="text-amber-400 text-xs font-bold uppercase tracking-widest bg-amber-900/60 px-3 py-1 rounded-full">
              Coffee Club Subscription
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold mt-4 mb-4">Never Run Out of Great Coffee</h2>
            <p className="text-stone-300 text-lg">
              Customize your recurring coffee delivery. Save 15% on every order, pause or cancel anytime with a single click.
            </p>
          </div>

          <div className="bg-white text-stone-900 rounded-3xl p-8 sm:p-12 shadow-2xl max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-3">1. How many bags per delivery?</label>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 4].map(num => (
                    <button
                      key={num}
                      onClick={() => setSubBags(num)}
                      className={`py-3 rounded-xl font-bold border transition-all text-sm ${
                        subBags === num ? 'border-amber-900 bg-amber-900 text-white' : 'border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-800'
                      }`}
                    >
                      {num} {num === 1 ? 'Bag' : 'Bags'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-stone-700 mb-3">2. Delivery Frequency</label>
                <select
                  value={subFrequency}
                  onChange={(e) => setSubFrequency(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-900"
                >
                  <option>Every 1 week</option>
                  <option>Every 2 weeks</option>
                  <option>Every 4 weeks</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-stone-700 mb-3">3. Roast Preference</label>
                <select
                  value={subRoastPref}
                  onChange={(e) => setSubRoastPref(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-900"
                >
                  <option>Roaster&apos;s Choice (Surprise Me)</option>
                  <option>Light Roasts Only</option>
                  <option>Medium Roasts Only</option>
                  <option>Dark Roasts Only</option>
                </select>
              </div>
            </div>

            <div className="bg-amber-50 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 border border-amber-200">
              <div>
                <h4 className="font-bold text-stone-900 text-lg">Your Custom Subscription Plan</h4>
                <p className="text-sm text-stone-600 mt-1">
                  {subBags} {subBags === 1 ? 'bag' : 'bags'} ({subRoastPref}) delivered {subFrequency.toLowerCase()}. Includes free shipping & 15% discount.
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-stone-500 block">Estimated total</span>
                <span className="text-3xl font-extrabold text-amber-900">
                  ${(subBags * 16.00 * 0.85).toFixed(2)} <span className="text-xs text-stone-500 font-normal">/ delivery</span>
                </span>
                <button 
                  onClick={() => {
                    addToCart({
                      id: 'subscription-box',
                      name: `Coffee Club Subscription (${subBags} bags - ${subRoastPref})`,
                      origin: 'Curated Subscription',
                      region: subFrequency,
                      process: 'Freshly Roasted',
                      altitude: 'Various',
                      flavorNotes: ['Curated seasonal rotation'],
                      roastLevel: 'Medium',
                      description: `Recurring delivery of ${subBags} bags. ${subFrequency}`,
                      price: subBags * 16.00 * 0.85,
                      image: 'https://images.unsplash.com/photo-1587734195503-904fca47e0e9?q=80&w=800&auto=format&fit=crop',
                      weightOptions: ['250g'],
                      grindOptions: ['Whole Bean']
                    });
                  }}
                  className="mt-3 w-full sm:w-auto bg-amber-900 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-amber-800 transition-all shadow-lg"
                >
                  Subscribe Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Brew Guides Section */}
      <section id="brew-guides" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-amber-800 font-semibold text-sm uppercase tracking-wider">Expert Knowledge</span>
          <h2 className="text-3xl font-bold tracking-tight text-stone-900 mt-1">Master Your Brew</h2>
          <p className="text-stone-600 mt-2">Follow our step-by-step masterclasses to brew café-quality coffee at home.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {BREW_GUIDES.map((guide, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-stone-200 p-8 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold text-stone-900 mb-4">{guide.method}</h3>
                <div className="space-y-2 mb-6 text-sm">
                  <div className="flex justify-between pb-2 border-b border-stone-100">
                    <span className="text-stone-500 font-medium">Ratio:</span>
                    <span className="font-bold text-stone-900">{guide.ratio}</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-stone-100">
                    <span className="text-stone-500 font-medium">Grind Size:</span>
                    <span className="font-bold text-stone-900">{guide.grind}</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-stone-100">
                    <span className="text-stone-500 font-medium">Brew Time:</span>
                    <span className="font-bold text-stone-900">{guide.time}</span>
                  </div>
                </div>

                <h4 className="font-bold text-stone-900 text-sm mb-3">Step-by-Step Instructions:</h4>
                <ol className="space-y-2.5">
                  {guide.steps.map((step, sIdx) => (
                    <li key={sIdx} className="text-xs text-stone-600 flex items-start gap-2.5 leading-relaxed">
                      <span className="bg-amber-100 text-amber-900 font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0">
                        {sIdx + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-stone-900 text-stone-400 py-16 border-t border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-amber-800 text-white p-2 rounded-xl">
                <Coffee className="w-5 h-5" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">VELVET BEAN</span>
            </div>
            <p className="text-sm text-stone-400 leading-relaxed">
              Dedicated to sourcing, roasting, and sharing the world&apos;s most exceptional specialty coffee beans.
            </p>
          </div>

          <div>
            <h4 className="text-white font-bold text-sm mb-4">Quick Links</h4>
            <ul className="space-y-2.5 text-sm">
              <li><a href="#shop" className="hover:text-white transition-colors">Shop All Coffee</a></li>
              <li><a href="#subscriptions" className="hover:text-white transition-colors">Coffee Club</a></li>
              <li><a href="#brew-guides" className="hover:text-white transition-colors">Brewing Guides</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold text-sm mb-4">Customer Care</h4>
            <ul className="space-y-2.5 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Shipping & Delivery</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Returns & Refunds</a></li>
              <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold text-sm mb-4">Stay Connected</h4>
            <p className="text-sm text-stone-400 mb-4">Subscribe to receive brewing tips, new harvest alerts, and secret discounts.</p>
            <div className="flex gap-2">
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="bg-stone-800 border border-stone-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-600 w-full"
              />
              <button className="bg-amber-800 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-amber-700 transition-colors">
                Join
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-stone-800 text-center text-xs text-stone-500">
          © {new Date().getFullYear()} Velvet Bean Roasters Inc. All rights reserved.
        </div>
      </footer>

      {/* QUICK VIEW / PRODUCT OPTIONS MODAL */}
      {quickViewProduct && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl relative">
            <button 
              onClick={() => setQuickViewProduct(null)}
              className="absolute top-4 right-4 bg-stone-100 hover:bg-stone-200 text-stone-700 p-2 rounded-full transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="relative h-72 md:h-full bg-stone-100">
                <img 
                  src={quickViewProduct.image} 
                  alt={quickViewProduct.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-8 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-amber-800 tracking-wider uppercase">
                    {quickViewProduct.origin} • {quickViewProduct.roastLevel} Roast
                  </span>
                  <h3 className="text-2xl font-bold text-stone-900 mt-1 mb-2">{quickViewProduct.name}</h3>
                  <p className="text-stone-600 text-sm mb-4 leading-relaxed">{quickViewProduct.description}</p>

                  <div className="mb-4">
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">Bag Size</label>
                    <div className="grid grid-cols-3 gap-2">
                      {quickViewProduct.weightOptions.map(weight => (
                        <button
                          key={weight}
                          onClick={() => setSelectedWeight(weight)}
                          className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                            selectedWeight === weight ? 'border-amber-900 bg-amber-900 text-white' : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                          }`}
                        >
                          {weight}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">Grind Type</label>
                    <select
                      value={selectedGrind}
                      onChange={(e) => setSelectedGrind(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-900"
                    >
                      {quickViewProduct.grindOptions.map(grind => (
                        <option key={grind} value={grind}>{grind}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-stone-100">
                  <div>
                    <span className="text-xs text-stone-400 block">Total Price</span>
                    <span className="text-2xl font-extrabold text-stone-900">
                      ${(quickViewProduct.price * (selectedWeight === '500g' ? 1.8 : selectedWeight === '1kg' ? 3.3 : 1)).toFixed(2)}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      const multiplier = selectedWeight === '500g' ? 1.8 : selectedWeight === '1kg' ? 3.3 : 1;
                      addToCart({
                        ...quickViewProduct,
                        price: quickViewProduct.price * multiplier
                      }, selectedWeight, selectedGrind);
                      setQuickViewProduct(null);
                    }}
                    className="bg-amber-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-amber-800 transition-all shadow-md"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SLIDE-OVER CART DRAWER */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm flex justify-end">
          <div className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl">
            <div className="p-6 border-b border-stone-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-amber-900" />
                <h3 className="font-bold text-lg text-stone-900">Your Cart ({cart.reduce((s, i) => s + i.quantity, 0)})</h3>
              </div>
              <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-stone-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {cart.length === 0 ? (
                <div className="text-center py-20">
                  <ShoppingBag className="w-16 h-16 text-stone-300 mx-auto mb-4" />
                  <h4 className="font-bold text-stone-800 text-lg">Your cart is empty</h4>
                  <p className="text-stone-500 text-sm mt-1">Add some fresh roasted coffee beans to get started!</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="flex gap-4 p-4 rounded-2xl bg-stone-50 border border-stone-200/60 relative">
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-stone-200 shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-stone-900 text-sm">{item.name}</h4>
                      <p className="text-xs text-stone-500 mt-0.5">{item.selectedWeight} • {item.selectedGrind}</p>
                      <div className="flex items-center justify-between mt-3">
                        <span className="font-extrabold text-stone-900">${(item.price * item.quantity).toFixed(2)}</span>
                        <div className="flex items-center gap-2 bg-white border border-stone-300 rounded-lg px-2 py-1">
                          <button onClick={() => updateQuantity(item.id, -1)} className="text-stone-500 hover:text-stone-900">
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="text-stone-500 hover:text-stone-900">
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => removeItem(item.id)} className="absolute top-3 right-3 text-stone-400 hover:text-red-600 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-6 border-t border-stone-200 bg-stone-50">
                <form onSubmit={applyPromo} className="flex gap-2 mb-4">
                  <input 
                    type="text" 
                    placeholder="Promo code (COFFEE10)"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className="flex-1 bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs uppercase focus:outline-none focus:ring-2 focus:ring-amber-900 font-semibold"
                  />
                  <button type="submit" className="bg-stone-900 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-stone-800">
                    Apply
                  </button>
                </form>
                {promoSuccess && <p className="text-xs text-emerald-600 font-semibold mb-3">{promoSuccess}</p>}
                {promoError && <p className="text-xs text-red-600 font-semibold mb-3">{promoError}</p>}

                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between text-stone-600">
                    <span>Subtotal</span>
                    <span className="font-bold text-stone-900">${subtotal.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Discount (10%)</span>
                      <span>-${discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-stone-600">
                    <span>Shipping</span>
                    <span>{shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}</span>
                  </div>
                  <div className="flex justify-between text-stone-900 font-extrabold text-base pt-2 border-t border-stone-200">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={() => setIsCheckoutOpen(true)}
                  className="w-full bg-amber-900 text-white py-4 rounded-xl font-bold hover:bg-amber-800 transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  Proceed to Checkout <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CHECKOUT MODAL */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setIsCheckoutOpen(false)}
              className="absolute top-6 right-6 bg-stone-100 hover:bg-stone-200 text-stone-700 p-2 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {orderComplete ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold text-stone-900 mb-2">Order Confirmed!</h3>
                <p className="text-stone-600 text-sm max-w-sm mx-auto mb-6">
                  Thank you for your order, <span className="font-bold text-stone-900">{formData.name}</span>! We are freshly roasting your beans and preparing them for shipment.
                </p>
                <button
                  onClick={() => {
                    setOrderComplete(false);
                    setIsCheckoutOpen(false);
                    setIsCartOpen(false);
                  }}
                  className="bg-amber-900 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-amber-800 transition-all"
                >
                  Back to Store
                </button>
              </div>
            ) : (
              <div>
                <h3 className="text-2xl font-bold text-stone-900 mb-6">Secure Checkout</h3>
                <form onSubmit={handleCheckoutSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">Full Name</label>
                    <input 
                      type="text" 
                      required
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      placeholder="John Doe"
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">Email Address</label>
                    <input 
                      type="email" 
                      required
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      placeholder="john@example.com"
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">Shipping Address</label>
                    <input 
                      type="text" 
                      required
                      value={formData.address}
                      onChange={e => setFormData({...formData, address: e.target.value})}
                      placeholder="123 Coffee Lane"
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-900"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">City</label>
                      <input 
                        type="text" 
                        required
                        value={formData.city}
                        onChange={e => setFormData({...formData, city: e.target.value})}
                        placeholder="Seattle"
                        className="w-full bg-stone-50 border border-stone-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">Postal Code</label>
                      <input 
                        type="text" 
                        required
                        value={formData.postalCode}
                        onChange={e => setFormData({...formData, postalCode: e.target.value})}
                        placeholder="98101"
                        className="w-full bg-stone-50 border border-stone-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">Card Number (Simulated)</label>
                    <input 
                      type="text" 
                      required
                      placeholder="4242 •••• •••• 4242"
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-900 font-mono"
                    />
                  </div>

                  <div className="pt-4 border-t border-stone-200 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-stone-500 block">Total Due</span>
                      <span className="text-xl font-extrabold text-stone-900">${total.toFixed(2)}</span>
                    </div>
                    <button
                      type="submit"
                      className="bg-amber-900 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-amber-800 transition-all shadow-lg"
                    >
                      Complete Order
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

function FlameIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path>
    </svg>
  );
}