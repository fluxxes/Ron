import React, { useState } from 'react';
import { X, LayoutDashboard, Package, ShoppingBag, Plus, Edit, Trash2, Clock, CheckCircle } from 'lucide-react';
import { Product, Order } from '../types/coffee';

interface StaffDashboardProps {
  isOpen: boolean;
  products: Product[];
  orders: Order[];
  onClose: () => void;
  onSaveProduct: (product: Partial<Product>) => void;
  onDeleteProduct: (id: string) => void;
  onUpdateOrderStatus: (orderId: string, status: Order['status']) => void;
}

export default function StaffDashboard({ isOpen, products, orders, onClose, onSaveProduct, onDeleteProduct, onUpdateOrderStatus }: StaffDashboardProps) {
  const [dashboardTab, setDashboardTab] = useState<'inventory' | 'orders'>('inventory');
  const [orderFilter, setOrderFilter] = useState<'all' | 'processing' | 'completed'>('processing');
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  if (!isOpen) return null;

  const filteredOrders = orders.filter(o => {
    if (orderFilter === 'processing') return o.status === 'Processing' || o.status === 'Roasted & Packed';
    if (orderFilter === 'completed') return o.status === 'Completed' || o.status === 'Shipped';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-5xl w-full p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 text-stone-400 hover:text-stone-900"><X className="w-6 h-6" /></button>
        
        <div className="flex items-center gap-3 mb-6 pb-4 border-b">
          <div className="bg-amber-900 text-white p-2.5 rounded-xl">
            <LayoutDashboard className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-stone-900">RON Admin & Staff Dashboard</h3>
            <p className="text-xs text-stone-500">Full Inventory Management & Real-time Order Control System</p>
          </div>
        </div>

        <div className="flex gap-4 border-b border-stone-200 mb-6">
          <button 
            onClick={() => setDashboardTab('inventory')}
            className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${dashboardTab === 'inventory' ? 'border-amber-900 text-amber-900' : 'border-transparent text-stone-500'}`}
          >
            <Package className="w-4 h-4" /> Inventory Control ({products.length})
          </button>
          <button 
            onClick={() => setDashboardTab('orders')}
            className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${dashboardTab === 'orders' ? 'border-amber-900 text-amber-900' : 'border-transparent text-stone-500'}`}
          >
            <ShoppingBag className="w-4 h-4" /> Order Fulfillment ({orders.length})
          </button>
        </div>

        {dashboardTab === 'inventory' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h4 className="font-bold text-stone-900 text-lg">Inventory & Stock Listing</h4>
              <button 
                onClick={() => {
                  setEditingProduct({ name: '', origin: '', region: '', process: 'Washed', altitude: '1,800m', flavor_notes: ['Chocolate'], roast_level: 'Medium', description: '', price: 18.00, stock_quantity: 50, image: '' });
                  setIsProductModalOpen(true);
                }}
                className="bg-amber-900 text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-amber-800 flex items-center gap-2 shadow-md"
              >
                <Plus className="w-4 h-4" /> Add New Coffee Bean
              </button>
            </div>

            <div className="overflow-x-auto border border-stone-200 rounded-2xl">
              <table className="w-full text-left text-sm">
                <thead className="bg-stone-100 text-stone-700 font-bold uppercase text-xs border-b">
                  <tr>
                    <th className="p-4">Coffee Name</th>
                    <th className="p-4">Origin</th>
                    <th className="p-4">Roast</th>
                    <th className="p-4">Price</th>
                    <th className="p-4">Stock</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {products.map(p => (
                    <tr key={p.id} className="hover:bg-stone-50">
                      <td className="p-4 font-bold text-stone-900 flex items-center gap-3">
                        <img src={p.image} alt={p.name} className="w-10 h-10 object-cover rounded-lg" />
                        {p.name}
                      </td>
                      <td className="p-4 text-stone-600">{p.origin}</td>
                      <td className="p-4"><span className="px-2.5 py-1 bg-stone-200 text-stone-800 rounded-full text-xs font-semibold">{p.roast_level}</span></td>
                      <td className="p-4 font-extrabold text-stone-900">${p.price.toFixed(2)}</td>
                      <td className="p-4">
                        <span className={`font-bold ${p.stock_quantity > 10 ? 'text-emerald-700' : p.stock_quantity > 0 ? 'text-amber-700' : 'text-red-600'}`}>{p.stock_quantity} units</span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button onClick={() => { setEditingProduct(p); setIsProductModalOpen(true); }} className="p-2 text-stone-600 hover:text-amber-900"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => onDeleteProduct(p.id)} className="p-2 text-stone-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {dashboardTab === 'orders' && (
          <div>
            <div className="flex gap-2 mb-6">
              <button onClick={() => setOrderFilter('processing')} className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 ${orderFilter === 'processing' ? 'bg-amber-900 text-white' : 'bg-stone-100 text-stone-600'}`}>
                <Clock className="w-3.5 h-3.5" /> Processing
              </button>
              <button onClick={() => setOrderFilter('completed')} className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 ${orderFilter === 'completed' ? 'bg-amber-900 text-white' : 'bg-stone-100 text-stone-600'}`}>
                <CheckCircle className="w-3.5 h-3.5" /> Completed
              </button>
              <button onClick={() => setOrderFilter('all')} className={`px-4 py-2 rounded-xl text-xs font-bold ${orderFilter === 'all' ? 'bg-amber-900 text-white' : 'bg-stone-100 text-stone-600'}`}>All Orders</button>
            </div>

            <div className="space-y-4">
              {filteredOrders.length === 0 ? (
                <div className="text-center py-12 text-stone-500 font-medium">No orders found.</div>
              ) : (
                filteredOrders.map(order => (
                  <div key={order.id} className="bg-stone-50 border border-stone-200 rounded-2xl p-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 pb-4 border-b">
                      <div>
                        <span className="text-xs font-bold uppercase text-amber-800">Order ID: {order.id.slice(0, 8)}</span>
                        <h4 className="font-bold text-stone-900">{order.customer_name} ({order.customer_email})</h4>
                        <p className="text-xs text-stone-500">{order.address}, {order.city} - {order.postal_code}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-extrabold text-stone-900 text-lg">${order.total_amount.toFixed(2)}</span>
                        <select 
                          value={order.status} 
                          onChange={e => onUpdateOrderStatus(order.id, e.target.value as Order['status'])}
                          className="bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold"
                        >
                          <option value="Processing">Processing</option>
                          <option value="Roasted & Packed">Roasted & Packed</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Product Add/Edit Submodal */}
        {isProductModalOpen && editingProduct && (
          <div className="fixed inset-0 z-60 bg-stone-950/80 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
              <button onClick={() => setIsProductModalOpen(false)} className="absolute top-4 right-4"><X className="w-5 h-5" /></button>
              <h4 className="font-bold text-xl mb-4">{editingProduct.id ? 'Edit Product' : 'New Product'}</h4>
              <form onSubmit={e => { e.preventDefault(); onSaveProduct(editingProduct); setIsProductModalOpen(false); }} className="space-y-4">
                <input type="text" required placeholder="Name" value={editingProduct.name || ''} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} className="w-full bg-stone-50 border rounded-xl px-4 py-2 text-sm" />
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" required placeholder="Origin" value={editingProduct.origin || ''} onChange={e => setEditingProduct({...editingProduct, origin: e.target.value})} className="bg-stone-50 border rounded-xl px-4 py-2 text-sm" />
                  <input type="text" required placeholder="Region" value={editingProduct.region || ''} onChange={e => setEditingProduct({...editingProduct, region: e.target.value})} className="bg-stone-50 border rounded-xl px-4 py-2 text-sm" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <select value={editingProduct.roast_level || 'Medium'} onChange={e => setEditingProduct({...editingProduct, roast_level: e.target.value as any})} className="bg-stone-50 border rounded-xl px-2 py-2 text-sm">
                    <option value="Light">Light</option>
                    <option value="Medium">Medium</option>
                    <option value="Dark">Dark</option>
                  </select>
                  <input type="number" step="0.5" placeholder="Price" value={editingProduct.price || 0} onChange={e => setEditingProduct({...editingProduct, price: parseFloat(e.target.value)})} className="bg-stone-50 border rounded-xl px-4 py-2 text-sm" />
                  <input type="number" placeholder="Stock" value={editingProduct.stock_quantity || 0} onChange={e => setEditingProduct({...editingProduct, stock_quantity: parseInt(e.target.value)})} className="bg-stone-50 border rounded-xl px-4 py-2 text-sm" />
                </div>
                <input type="text" placeholder="Image URL" value={editingProduct.image || ''} onChange={e => setEditingProduct({...editingProduct, image: e.target.value})} className="w-full bg-stone-50 border rounded-xl px-4 py-2 text-sm" />
                <textarea placeholder="Description" value={editingProduct.description || ''} onChange={e => setEditingProduct({...editingProduct, description: e.target.value})} className="w-full bg-stone-50 border rounded-xl px-4 py-2 text-sm" rows={2} />
                <button type="submit" className="w-full bg-amber-900 text-white py-3 rounded-xl font-bold">Save Product</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}