import React from 'react';
import { X, Plus, Minus, ChevronRight, ShoppingBag } from 'lucide-react';
import { CartItem } from '../types/coffee';

interface CartDrawerProps {
  isOpen: boolean;
  cart: CartItem[];
  onClose: () => void;
  onUpdateQuantity: (id: string, delta: number) => void;
  onProceedToCheckout: () => void;
}

export default function CartDrawer({ isOpen, cart, onClose, onUpdateQuantity, onProceedToCheckout }: CartDrawerProps) {
  if (!isOpen) return null;

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm flex justify-end">
      <div className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl">
        <div className="p-6 border-b flex items-center justify-between">
          <h3 className="font-bold text-lg flex items-center gap-2"><ShoppingBag className="w-5 h-5 text-amber-900" /> RON Cart ({cart.reduce((s, i) => s + i.quantity, 0)})</h3>
          <button onClick={onClose} className="p-2"><X className="w-5 h-5" /></button>
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
                      <button onClick={() => onUpdateQuantity(item.id, -1)}><Minus className="w-3 h-3" /></button>
                      <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                      <button onClick={() => onUpdateQuantity(item.id, 1)}><Plus className="w-3 h-3" /></button>
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
            <button onClick={onProceedToCheckout} className="w-full bg-amber-900 text-white py-4 rounded-xl font-bold hover:bg-amber-800 flex items-center justify-center gap-2">
              Proceed to Checkout <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}