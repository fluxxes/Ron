// Copyright (c) 2026 (RON). Developed by (fluxes) All rights reserved.
'use client';

import React, { useState } from 'react';
import {
  ShoppingBag,
  ShieldCheck,
  User as UserIcon,
  LogOut,
  Globe,
  Truck,
  Menu,
  X,
} from 'lucide-react';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#E6DFD5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 h-20 flex items-center justify-between gap-4">
        
        <div className="flex items-center gap-2.5">
          <Link href="/" className="flex items-center group">
            <div className="w-12 h-12 rounded-md bg-[#DFD3C3] border border-[#D0C2B0] flex flex-col items-center justify-center shadow-sm group-hover:opacity-90 transition-all">
              <span className="font-serif font-bold tracking-widest text-[#5C4938] text-xs leading-none">
                RŌN
              </span>
              <span className="text-[6px] uppercase tracking-[0.2em] text-[#7D6855] mt-1">
                ROASTERY
              </span>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl bg-white border border-[#E6DFD5] text-[#231F1E]"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        <nav className="hidden lg:flex items-center gap-8 text-xs sm:text-sm font-bold text-[#3D3734]">
          <Link href="/" className="hover:text-black transition-colors">
            {t('nav_home')}
          </Link>
          <a href="#shop" className="hover:text-black transition-colors">
            {t('nav_shop')}
          </a>
          <a href="#about" className="hover:text-black transition-colors">
            {t('nav_about')}
          </a>
          <a href="#contact" className="hover:text-black transition-colors">
            {t('nav_contact')}
          </a>
          <Link
            href="/track"
            className="text-[#8C735B] hover:text-[#231F1E] transition-colors flex items-center gap-1"
          >
            <Truck className="w-3.5 h-3.5" />
            <span>{t('nav_track')}</span>
          </Link>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onToggleLang}
            className="bg-white text-[#231F1E] hover:bg-[#EAE2D7] text-xs font-extrabold px-3 py-2 rounded-full transition-all flex items-center gap-1.5 border border-[#D8D0C5] shadow-sm cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-[#9C7E5E]" />
            <span>{lang === 'ar' ? 'English' : 'العربية'}</span>
          </button>

          {user ? (
            <div className="flex items-center gap-1.5">
              {userRole === 'staff' && (
                <Link
                  href="/staff"
                  className="bg-[#231F1E] text-[#EAE2D7] px-3 py-2 rounded-full text-xs font-bold hover:opacity-90 transition-all flex items-center gap-1.5 shadow-sm"
                  title={t('staff_dash')}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#C4A484]" />
                  <span className="hidden md:inline">{t('staff_dash')}</span>
                </Link>
              )}

              <button
                type="button"
                onClick={onOpenAccount}
                className="bg-white border border-[#D8D0C5] text-[#231F1E] px-3 py-2 rounded-full text-xs font-bold hover:bg-[#EAE2D7]/40 transition-all flex items-center gap-1.5 shadow-sm"
              >
                <UserIcon className="w-3.5 h-3.5 text-[#9C7E5E]" />
                <span className="hidden sm:inline">{t('my_account')}</span>
              </button>

              <button
                type="button"
                onClick={onSignOut}
                className="p-2 rounded-full bg-stone-200/70 text-stone-700 hover:bg-red-100 hover:text-red-700 transition-all hidden sm:flex"
                title={t('sign_out')}
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="p-2 rounded-full text-[#231F1E] hover:bg-[#EAE2D7]/60 transition-all flex items-center gap-1 text-xs font-bold"
              title={t('sign_in')}
            >
              <UserIcon className="w-4 h-4" />
              <span className="hidden sm:inline">{t('sign_in')}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenCart}
            className="relative p-2 text-[#231F1E] hover:opacity-75 transition-all flex items-center justify-center"
            aria-label={t('cart_title')}
          >
            <ShoppingBag className="w-5 h-5 fill-[#231F1E] text-[#231F1E]" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -end-1 bg-[#9C7E5E] text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-[#E6DFD5] px-4 py-4 space-y-2 shadow-lg">
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="p-3 rounded-xl bg-[#FAF7F2] text-xs font-extrabold text-[#231F1E]"
            >
              {t('nav_home')}
            </Link>
            <a
              href="#shop"
              onClick={() => setMobileMenuOpen(false)}
              className="p-3 rounded-xl bg-[#FAF7F2] text-xs font-bold text-stone-700"
            >
              {t('nav_shop')}
            </a>
            <Link
              href="/track"
              onClick={() => setMobileMenuOpen(false)}
              className="p-3 rounded-xl bg-[#FAF7F2] text-xs font-bold text-[#231F1E] flex items-center gap-1.5"
            >
              <Truck className="w-3.5 h-3.5 text-[#9C7E5E]" />
              <span>{t('nav_track')}</span>
            </Link>
            <a
              href="#brew-guides"
              onClick={() => setMobileMenuOpen(false)}
              className="p-3 rounded-xl bg-[#FAF7F2] text-xs font-bold text-stone-700"
            >
              {t('nav_brew')}
            </a>
            <a
              href="#about"
              onClick={() => setMobileMenuOpen(false)}
              className="p-3 rounded-xl bg-[#FAF7F2] text-xs font-bold text-stone-700"
            >
              {t('nav_about')}
            </a>
            <a
              href="#contact"
              onClick={() => setMobileMenuOpen(false)}
              className="p-3 rounded-xl bg-[#FAF7F2] text-xs font-bold text-stone-700"
            >
              {t('nav_contact')}
            </a>
          </div>
        </div>
      )}
    </header>
  );
}