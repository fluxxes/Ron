import React, { useState } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import { CartItem } from '../types/coffee';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  subtotal: number;
  orderComplete: boolean;
  onCheckoutSubmit: (formData: { name: string; email: string; address: string; city: string; postalCode: string }) => void;
  onResetCheckout: () => void;
  t: (key: string) => string;
}

export default function CheckoutModal({ isOpen, onClose, subtotal, orderComplete, onCheckoutSubmit, onResetCheckout, t }: CheckoutModalProps) {
  const [formData, setFormData] = useState({ name: '', email: '', address: '', city: '', postalCode: '' });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full p-8 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-6 right-6"><X className="w-5 h-5" /></button>
        {orderComplete ? (
          <div className="text-center py-12">
            <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">{t('order_placed')}</h3>
            <p className="text-stone-600 text-sm mb-6">{t('order_success_desc')}</p>
            <button onClick={onResetCheckout} className="bg-amber-900 text-white px-8 py-3.5 rounded-xl font-bold">{t('back_to_store')}</button>
          </div>
        ) : (
          <form onSubmit={e => { e.preventDefault(); onCheckoutSubmit(formData); }} className="space-y-4">
            <h3 className="text-2xl font-bold mb-6">{t('checkout_title')}</h3>
            <input type="text" required placeholder={t('full_name')} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-stone-50 border rounded-xl px-4 py-3 text-sm" />
            <input type="email" required placeholder={t('email_address')} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-stone-50 border rounded-xl px-4 py-3 text-sm" />
            <input type="text" required placeholder={t('shipping_address')} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full bg-stone-50 border rounded-xl px-4 py-3 text-sm" />
            <div className="grid grid-cols-2 gap-4">
              <input type="text" required placeholder={t('city')} value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full bg-stone-50 border rounded-xl px-4 py-3 text-sm" />
              <input type="text" required placeholder={t('postal_code')} value={formData.postalCode} onChange={e => setFormData({...formData, postalCode: e.target.value})} className="w-full bg-stone-50 border rounded-xl px-4 py-3 text-sm" />
            </div>
            <button type="submit" className="w-full bg-amber-900 text-white py-4 rounded-xl font-bold">{t('complete_order')} (${subtotal.toFixed(2)})</button>
          </form>
        )}
      </div>
    </div>
  );
}