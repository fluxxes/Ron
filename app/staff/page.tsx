'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Product, Order } from '../types/coffee';
import { Package, ShoppingBag, Plus, Trash2, Edit2, ArrowLeft, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function StaffPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('customer');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products');

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // Product Modal / Form state
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  const checkStaffAuth = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      router.push('/');
      return;
    }
    setUser(session.user);
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
    if (profile) {
      setUserRole(profile.role);
      if (profile.role !== 'staff') {
        alert('Access Denied: Staff only area.');
        router.push('/');
        return;
      }
    } else {
      router.push('/');
      return;
    }
    setLoading(false);
    fetchData();
  }, [router]);

  useEffect(() => {
    checkStaffAuth();
  }, [checkStaffAuth]);

  const fetchData = async () => {
    const { data: prodData } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (prodData) setProducts(prodData);

    const { data: ordData } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (ordData) setOrders(ordData);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    if (editingProduct.id) {
      await supabase.from('products').update(editingProduct).eq('id', editingProduct.id);
    } else {
      await supabase.from('products').insert([editingProduct]);
    }
    setIsProductModalOpen(false);
    setEditingProduct(null);
    fetchData();
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm('Are you sure you want to delete this coffee product?')) {
      await supabase.from('products').delete().eq('id', id);
      fetchData();
    }
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    await supabase.from('orders').update({ status }).eq('id', orderId);
    fetchData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBF9F5] flex items-center justify-center">
        <p className="text-stone-600 font-medium">Verifying Staff Credentials...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-stone-800 font-sans">
      {/* Staff Header Navbar */}
      <header className="bg-stone-900 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push('/')}
              className="bg-stone-800 p-2.5 rounded-xl hover:bg-stone-700 transition-all flex items-center gap-2 text-xs font-bold"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Store
            </button>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-amber-400" />
              <span className="text-xl font-extrabold tracking-tight">RON Staff Dashboard</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-stone-400 bg-stone-800 px-3 py-1.5 rounded-full">{user?.email}</span>
            <button 
              onClick={async () => { await supabase.auth.signOut(); router.push('/'); }}
              className="bg-red-950/50 text-red-300 px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-900/50 transition-all"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Dashboard Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-stone-200 pb-4">
          <button 
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all ${activeTab === 'products' ? 'bg-amber-900 text-white shadow-lg' : 'bg-white text-stone-700 hover:bg-stone-100'}`}
          >
            <Package className="w-4 h-4" /> Inventory ({products.length})
          </button>
          <button 
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all ${activeTab === 'orders' ? 'bg-amber-900 text-white shadow-lg' : 'bg-white text-stone-700 hover:bg-stone-100'}`}
          >
            <ShoppingBag className="w-4 h-4" /> Customer Orders ({orders.length})
          </button>
        </div>

        {/* PRODUCTS TAB */}
        {activeTab === 'products' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-extrabold text-stone-900">Coffee Inventory Management</h2>
              <button 
                onClick={() => {
                  setEditingProduct({ name: '', origin: '', price: 17.00, stock_quantity: 40, roast_level: 'Medium', description: '', image: '', weight_options: ['250g', '500g', '1kg'], grind_options: ['Whole Bean', 'Espresso'] });
                  setIsProductModalOpen(true);
                }}
                className="bg-amber-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-amber-800 transition-all flex items-center gap-2 shadow-md"
              >
                <Plus className="w-4 h-4" /> Add New Coffee
              </button>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-stone-200 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-xs font-bold text-stone-500 uppercase tracking-wider">
                    <th className="p-4">Coffee</th>
                    <th className="p-4">Origin / Roast</th>
                    <th className="p-4">Price</th>
                    <th className="p-4">Stock</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-sm">
                  {products.map(p => (
                    <tr key={p.id} className="hover:bg-stone-50/50">
                      <td className="p-4 flex items-center gap-3">
                        <img src={p.image} alt={p.name} className="w-12 h-12 rounded-xl object-cover bg-stone-100" />
                        <div>
                          <p className="font-bold text-stone-900">{p.name}</p>
                          <p className="text-xs text-stone-500">{p.region}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-medium text-stone-800">{p.origin}</span>
                        <span className="block text-xs text-amber-700 font-semibold">{p.roast_level} Roast</span>
                      </td>
                      <td className="p-4 font-bold">${p.price.toFixed(2)}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${p.stock_quantity > 10 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                          {p.stock_quantity} bags
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button 
                          onClick={() => { setEditingProduct(p); setIsProductModalOpen(true); }}
                          className="p-2 bg-stone-100 text-stone-700 rounded-xl hover:bg-stone-200 transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteProduct(p.id)}
                          className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ORDERS TAB */}
        {activeTab === 'orders' && (
          <div>
            <h2 className="text-2xl font-extrabold text-stone-900 mb-6">Customer Order Fulfillment</h2>
            <div className="space-y-4">
              {orders.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-stone-200">
                  <ShoppingBag className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                  <p className="text-stone-500 font-medium">No customer orders received yet.</p>
                </div>
              ) : (
                orders.map(o => (
                  <div key={o.id} className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm flex flex-col md:flex-row justify-between gap-6">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-extrabold text-stone-900">{o.customer_name}</span>
                        <span className="text-xs text-stone-500">({o.customer_email})</span>
                        <span className={`px-3 py-0.5 rounded-full text-xs font-bold ${o.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                          {o.status}
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 mb-3">{o.address}, {o.city} ({o.postal_code})</p>
                      <div className="space-y-1">
                        {o.items?.map((item: any, idx: number) => (
                          <p key={idx} className="text-xs text-stone-700 font-medium">
                            • {item.quantity}x {item.name} ({item.selectedWeight}, {item.selectedGrind}) - ${(item.price * item.quantity).toFixed(2)}
                          </p>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col items-end justify-between border-t md:border-t-0 md:border-l border-stone-200 pt-4 md:pt-0 md:pl-6">
                      <div className="text-right mb-4">
                        <p className="text-xs text-stone-500 uppercase font-bold">Total Amount</p>
                        <p className="text-2xl font-extrabold text-stone-900">${o.total_amount.toFixed(2)}</p>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => updateOrderStatus(o.id, 'Processing')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${o.status === 'Processing' ? 'bg-amber-900 text-white' : 'bg-stone-100 text-stone-700'}`}
                        >
                          Processing
                        </button>
                        <button 
                          onClick={() => updateOrderStatus(o.id, 'Completed')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${o.status === 'Completed' ? 'bg-emerald-600 text-white' : 'bg-stone-100 text-stone-700'}`}
                        >
                          Complete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* EDIT / ADD PRODUCT MODAL */}
      {isProductModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-6">{editingProduct.id ? 'Edit Coffee Product' : 'Add New Coffee Product'}</h3>
            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Coffee Name</label>
                <input 
                  type="text" required 
                  value={editingProduct.name || ''} 
                  onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} 
                  className="w-full bg-stone-50 border rounded-xl px-4 py-3 text-sm" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Origin Country</label>
                  <input 
                    type="text" required 
                    value={editingProduct.origin || ''} 
                    onChange={e => setEditingProduct({...editingProduct, origin: e.target.value})} 
                    className="w-full bg-stone-50 border rounded-xl px-4 py-3 text-sm" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Roast Level</label>
                  <select 
                    value={editingProduct.roast_level || 'Medium'} 
                    onChange={e => setEditingProduct({...editingProduct, roast_level: e.target.value as any})} 
                    className="w-full bg-stone-50 border rounded-xl px-4 py-3 text-sm"
                  >
                    <option value="Light">Light</option>
                    <option value="Medium">Medium</option>
                    <option value="Dark">Dark</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Price ($)</label>
                  <input 
                    type="number" step="0.01" required 
                    value={editingProduct.price || 0} 
                    onChange={e => setEditingProduct({...editingProduct, price: parseFloat(e.target.value)})} 
                    className="w-full bg-stone-50 border rounded-xl px-4 py-3 text-sm" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Stock Quantity</label>
                  <input 
                    type="number" required 
                    value={editingProduct.stock_quantity || 0} 
                    onChange={e => setEditingProduct({...editingProduct, stock_quantity: parseInt(e.target.value)})} 
                    className="w-full bg-stone-50 border rounded-xl px-4 py-3 text-sm" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Image URL</label>
                <input 
                  type="url" required 
                  value={editingProduct.image || ''} 
                  onChange={e => setEditingProduct({...editingProduct, image: e.target.value})} 
                  className="w-full bg-stone-50 border rounded-xl px-4 py-3 text-sm" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Description</label>
                <textarea 
                  rows={3} required 
                  value={editingProduct.description || ''} 
                  onChange={e => setEditingProduct({...editingProduct, description: e.target.value})} 
                  className="w-full bg-stone-50 border rounded-xl px-4 py-3 text-sm" 
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsProductModalOpen(false)} 
                  className="w-1/2 bg-stone-100 text-stone-700 py-3.5 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="w-1/2 bg-amber-900 text-white py-3.5 rounded-xl font-bold hover:bg-amber-800"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}