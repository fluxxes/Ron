import React from 'react';
import { ShoppingBag, ShieldCheck, User as UserIcon, LogOut } from 'lucide-react';
import Link from 'next/link';

interface NavbarProps {
  user: any;
  userRole: string;
  cartCount: number;
  onOpenAuth: () => void;
  onOpenCart: () => void;
  onSignOut: () => void;
}

export default function Navbar({ user, userRole, cartCount, onOpenAuth, onOpenCart, onSignOut }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 bg-[#FBF9F5]/90 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-black tracking-tighter text-stone-900">RON</span>
          <span className="text-xs font-bold uppercase tracking-widest text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">Coffee</span>
        </Link>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              {userRole === 'staff' && (
                <Link 
                  href="/staff" 
                  className="bg-stone-900 text-amber-400 px-4 py-2 rounded-xl text-xs font-bold hover:bg-stone-800 transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <ShieldCheck className="w-4 h-4" /> Staff Management Dash
                </Link>
              )}
              <span className="text-xs font-medium text-stone-600 hidden sm:inline">{user.email}</span>
              <button 
                onClick={onSignOut}
                className="p-2 rounded-xl bg-stone-100 text-stone-700 hover:bg-stone-200 transition-all"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button 
              onClick={onOpenAuth}
              className="bg-stone-900 text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-stone-800 transition-all flex items-center gap-2"
            >
              <UserIcon className="w-4 h-4" /> Sign In
            </button>
          )}

          <button 
            onClick={onOpenCart}
            className="relative bg-amber-900 text-white p-3 rounded-2xl hover:bg-amber-800 transition-all shadow-md flex items-center justify-center"
          >
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-stone-900 text-amber-400 text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}