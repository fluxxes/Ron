'use client';

import React from 'react';
import { X, Plus, Minus, ChevronRight, ShoppingBag, Truck, Trash2 } from 'lucide-react';
import { CartItem } from '../types/coffee';

interface CartDrawerProps {
  isOpen: boolean;
  cart: CartItem[];
  onClose: () => void;
  onUpdateQuantity: (id: string, delta: number) => void;
  onProceedToCheckout: () => void;
  lang?: 'ar' | 'en';
  t: (key: string) => string;
}

export default function CartDrawer({
  isOpen,
  cart,
  onClose,
  onUpdateQuantity,
  onProceedToCheckout,
  lang = 'ar',
  t,
}: CartDrawerProps) {
  if (!isOpen) return null;

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const freeShippingThreshold = 200;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const progressPercent = Math.min(100, (subtotal / freeShippingThreshold) * 100);

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-sm flex justify-end">
      <div className="bg-[#FAF7F2] w-full max-w-md h-full flex flex-col shadow-2xl border-s border-[#EDE6DD]">
        
        {/* Drawer Header */}
        <div className="p-6 bg-white border-b border-[#EDE6DD] flex items-center justify-between">
          <h3 className="font-extrabold text-lg text-[#2C2825] flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#C4A484]" />
            <span>{t('cart_title')}</span>
            <span className="text-xs bg-[#EAE2D7] text-[#5A4D41] px-2.5 py-0.5 rounded-full">
              {cart.reduce((s, i) => s + i.quantity, 0)}
            </span>
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-stone-100 text-stone-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Shipping Progress Bar */}
        <div className="px-6 py-3 bg-[#EAE2D7]/50 border-b border-[#EDE6DD]">
          <div className="flex items-center gap-2 text-xs font-bold text-[#2C2825] mb-1.5">
            <Truck className="w-4 h-4 text-[#5A4D41]" />
            {remainingForFreeShipping === 0 ? (
              <span className="text-emerald-800">{t('free_shipping_unlocked')}</span>
            ) : (
              <span>
                {t('free_shipping_remaining').replace('{amount}', remainingForFreeShipping.toFixed(2))}
              </span>
            )}
          </div>
          <div className="w-full h-1.5 bg-white rounded-full overflow-hidden">
            <div
              className="h-full bg-[#2C2825] transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {cart.length === 0 ? (
            <div className="text-center py-24">
              <ShoppingBag className="w-12 h-12 text-stone-300 mx-auto mb-3" />
              <p className="text-stone-400 text-sm font-medium">{t('cart_empty')}</p>
            </div>
          ) : (
            cart.map(item => {
              const itemTitle = lang === 'ar' && item.name_ar ? item.name_ar : item.name;
              return (
                <div
                  key={item.id}
                  className="flex gap-4 p-4 bg-white rounded-2xl border border-[#EFECE6] shadow-sm"
                >
                  <img
                    src={item.image}
                    alt={itemTitle}
                    className="w-20 h-20 object-cover rounded-xl bg-stone-100"
                  />
                  <div className="flex-1">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-bold text-sm text-[#2C2825] leading-snug">{itemTitle}</h4>
                      <button
                        onClick={() => onUpdateQuantity(item.id, -item.quantity)}
                        className="text-stone-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-xs text-[#C4A484] font-semibold mt-0.5">
                      {item.selectedWeight} • {item.selectedGrind}
                    </p>
                    <div className="flex justify-between items-center mt-3">
                      <span className="font-extrabold text-sm text-[#2C2825]">
                        {(item.price * item.quantity).toFixed(2)} {t('currency')}
                      </span>
                      <div className="flex items-center gap-2 bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-2.5 py-1">
                        <button
                          onClick={() => onUpdateQuantity(item.id, -1)}
                          className="p-0.5 hover:text-amber-900"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-extrabold w-5 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(item.id, 1)}
                          className="p-0.5 hover:text-amber-900"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Drawer Footer */}
        {cart.length > 0 && (
          <div className="p-6 border-t border-[#EDE6DD] bg-white space-y-4">
            <div className="flex justify-between font-extrabold text-lg text-[#2C2825]">
              <span>{t('subtotal')}</span>
              <span>
                {subtotal.toFixed(2)} {t('currency')}
              </span>
            </div>
            <button
              onClick={onProceedToCheckout}
              className="w-full bg-[#2C2825] text-white py-4 rounded-2xl font-bold hover:bg-[#3E3834] transition-all flex items-center justify-center gap-2 shadow-md"
            >
              <span>{t('proceed_to_checkout')}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}