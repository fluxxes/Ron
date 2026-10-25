import React from 'react';
import { Coffee, User, ShoppingBag, LayoutDashboard, LogOut } from 'lucide-react';

interface NavbarProps {
  user: any;
  userRole: string;
  cartCount: number;
  onOpenAuth: () => void;
  onOpenCart: () => void;
  onOpenStaffDash: () => void;
  onSignOut: () => void;
}

export default function Navbar({ user, userRole, cartCount, onOpenAuth, onOpenCart, onOpenStaffDash, onSignOut }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 bg-[#FBF9F5]/90 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-amber-900 text-white p-2 rounded-xl">
            <Coffee className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xl font-extrabold tracking-wider text-stone-900">RON</span>
            <span className="block text-[9px] tracking-widest text-amber-800 font-bold uppercase">Specialty Coffee</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              {userRole === 'staff' && (
                <button 
                  onClick={onOpenStaffDash}
                  className="bg-amber-900 text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 hover:bg-amber-800 transition-all shadow-md"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" /> Staff Management Dash
                </button>
              )}
              <span className="text-xs font-semibold text-stone-600 hidden sm:inline">{user.email}</span>
              <button onClick={onSignOut} className="p-2 text-stone-600 hover:text-red-600 transition-colors" title="Sign Out">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button 
              onClick={onOpenAuth}
              className="text-xs font-bold bg-stone-200 text-stone-800 px-4 py-2 rounded-full hover:bg-stone-300 transition-all flex items-center gap-1.5"
            >
              <User className="w-3.5 h-3.5" /> Sign In / Account
            </button>
          )}

          <button 
            onClick={onOpenCart}
            className="relative bg-stone-900 text-white px-4 py-2.5 rounded-full flex items-center gap-2 text-sm font-medium hover:bg-amber-900 transition-all"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Cart</span>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}