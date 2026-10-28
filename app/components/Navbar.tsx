'use client';

import React from 'react';
import { ShoppingBag, ShieldCheck, User as UserIcon, LogOut, Globe, Truck } from 'lucide-react';
import Link from 'next/link';

interface NavbarProps {
  user: any;
  userRole: string;
  cartCount: number;
  lang: 'en' | 'ar';
  onToggleLang: () => void;
  onOpenAuth: () => void;
  onOpenAccount?: () => void;
  onOpenCart: () => void;
  onSignOut: () => void;
  t: (key: string) => string;
}

export default function Navbar({
  user,
  userRole,
  cartCount,
  lang,
  onToggleLang,
  onOpenAuth,
  onOpenAccount,
  onOpenCart,
  onSignOut,
  t,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#EDE6DD]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Left Controls (Cart, Language, Track, Account, Staff Shield) */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <button
            onClick={onOpenCart}
            className="relative p-2.5 rounded-xl bg-white border border-[#EDE6DD] text-[#2C2825] hover:bg-[#EAE2D7]/50 transition-all flex items-center justify-center shadow-sm"
            aria-label={t('cart_title')}
          >
            <ShoppingBag className="w-5 h-5 text-[#2C2825]" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-[#2C2825] text-white text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#FAF7F2]">
                {cartCount}
              </span>
            )}
          </button>

          <button
            onClick={onToggleLang}
            className="bg-white text-[#2C2825] hover:bg-[#EAE2D7]/50 text-xs font-bold px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 border border-[#EDE6DD] shadow-sm"
          >
            <Globe className="w-3.5 h-3.5 text-[#C4A484]" />
            {lang === 'ar' ? 'EN' : 'عربي'}
          </button>

          <Link
            href="/track"
            className="hidden sm:flex items-center gap-1.5 bg-white text-[#2C2825] hover:bg-[#EAE2D7]/50 text-xs font-bold px-3 py-2 rounded-xl border border-[#EDE6DD] shadow-sm transition-all"
          >
            <Truck className="w-3.5 h-3.5 text-[#C4A484]" />
            <span>{t('nav_track')}</span>
          </Link>

          {user ? (
            <div className="flex items-center gap-2">
              {userRole === 'staff' && (
                <Link
                  href="/staff"
                  className="bg-[#2C2825] text-[#EAE2D7] px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-[#3E3834] transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <ShieldCheck className="w-4 h-4 text-[#C4A484]" />
                  <span className="hidden md:inline">{t('staff_dash')}</span>
                </Link>
              )}

              <button
                onClick={onOpenAccount}
                className="bg-white border border-[#EDE6DD] text-[#2C2825] px-3 py-2 rounded-xl text-xs font-bold hover:bg-[#EAE2D7]/40 transition-all flex items-center gap-1.5 shadow-sm"
              >
                <UserIcon className="w-3.5 h-3.5 text-[#C4A484]" />
                <span className="hidden sm:inline">{t('my_account')}</span>
              </button>

              <button
                onClick={onSignOut}
                className="p-2 rounded-xl bg-stone-200/70 text-stone-700 hover:bg-red-100 hover:text-red-700 transition-all"
                title={t('sign_out')}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="bg-[#2C2825] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#3E3834] transition-all flex items-center gap-1.5 shadow-sm"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>{t('sign_in')}</span>
            </button>
          )}
        </div>

        {/* Center Navigation Links matching Reference UI */}
        <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-stone-700">
          <Link href="/" className="hover:text-[#2C2825] font-bold text-[#2C2825] transition-colors">
            {t('nav_home')}
          </Link>
          <a href="#shop" className="hover:text-[#2C2825] transition-colors">
            {t('nav_shop')}
          </a>
          <Link href="/track" className="hover:text-[#2C2825] transition-colors">
            {t('nav_track')}
          </Link>
          <a href="#brew-guides" className="hover:text-[#2C2825] transition-colors">
            {t('nav_brew')}
          </a>
          <a href="#about" className="hover:text-[#2C2825] transition-colors">
            {t('nav_about')}
          </a>
          <a href="#contact" className="hover:text-[#2C2825] transition-colors">
            {t('nav_contact')}
          </a>
        </nav>

        {/* Right Brand Logo Box matching Reference Image */}
        <Link href="/" className="flex items-center group">
          <div className="w-11 h-11 rounded-xl bg-[#EAE2D7] border border-[#DDD2C4] flex flex-col items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
            <span className="font-serif font-extrabold tracking-widest text-[#5A4D41] text-xs leading-none">
              RŌN
            </span>
            <span className="text-[7px] uppercase tracking-widest text-[#8C7A6B] mt-0.5">
              COFFEE
            </span>
          </div>
        </Link>

      </div>
    </header>
  );
}