// Copyright (c) 2026 (RON). Developed by (fluxes) All rights reserved.
'use client';

import React, { useState, useMemo } from 'react';
import { Product, CartItem } from '../types/coffee';
import { localizeProduct } from '../data/products';
import { Plus, Minus, Search, SlidersHorizontal, Sparkles, Package } from 'lucide-react';

interface ProductGridProps {
  products: Product[];
  cart?: CartItem[];
  selectedRoast: string;
  onSelectRoast: (roast: string) => void;
  onSelectProduct: (product: Product) => void;
  onQuickAdd?: (product: Product) => void;
  onUpdateCartQuantity?: (cartItemId: string, delta: number) => void;
  lang?: 'ar' | 'en';
  t: (key: string) => string;
}

export default function ProductGrid({
  products,
  cart = [],
  selectedRoast,
  onSelectRoast,
  onSelectProduct,
  onQuickAdd,
  onUpdateCartQuantity,
  lang = 'ar',
  t,
}: ProductGridProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'featured' | 'price_asc' | 'price_desc' | 'bestseller'>('featured');

  const categories = [
    { key: 'All', label: t('filter_all') },
    { key: 'Crops', label: t('filter_crops') },
    { key: 'Boxes', label: t('filter_boxes') },
    { key: 'Tools', label: t('filter_tools') },
  ];

  const roastLevels = [
    { key: 'All', label: t('filter_all') },
    { key: 'Light', label: t('filter_light') },
    { key: 'Medium', label: t('filter_medium') },
    { key: 'Dark', label: t('filter_dark') },
  ];

  const localizedProducts = useMemo(() => {
    return products.map(p => localizeProduct(p as any));
  }, [products]);

  const displayedProducts = useMemo(() => {
    return localizedProducts
      .filter(p => {
        const cat = p.category || 'Crops';
        const matchesCat = selectedCategory === 'All' || cat === selectedCategory;
        const matchesRoast =
          selectedRoast === 'All' || cat === 'Tools' || p.roast_level === selectedRoast;
        const q = searchQuery.trim().toLowerCase();
        const matchesSearch =
          !q ||
          p.name.toLowerCase().includes(q) ||
          (p.name_ar && p.name_ar.toLowerCase().includes(q)) ||
          p.origin.toLowerCase().includes(q) ||
          (p.origin_ar && p.origin_ar.toLowerCase().includes(q)) ||
          p.flavor_notes?.some(n => n.toLowerCase().includes(q)) ||
          p.flavor_notes_ar?.some(n => n.toLowerCase().includes(q));
        return matchesCat && matchesRoast && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'price_asc') return a.price - b.price;
        if (sortBy === 'price_desc') return b.price - a.price;
        if (sortBy === 'bestseller') return (b.bestseller ? 1 : 0) - (a.bestseller ? 1 : 0);
        return 0;
      });
  }, [localizedProducts, selectedCategory, selectedRoast, searchQuery, sortBy]);

  const getCategoryLabel = (cat?: string) => {
    if (cat === 'Boxes') return t('category_boxes');
    if (cat === 'Tools') return t('category_tools');
    return t('category_crops');
  };

  return (
    <section id="shop" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-14">
      <div className="text-center max-w-3xl mx-auto mb-7">
        <span className="text-[#B89F86] font-bold text-xs tracking-wide block mb-2">
          {t('brand_subtitle')}
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-[#231F1E] mb-4 tracking-tight leading-tight">
          {t('hero_title')}
        </h1>
        <p className="text-[#787069] text-xs sm:text-base font-medium leading-relaxed max-w-2xl mx-auto">
          {t('hero_desc')}
        </p>
      </div>

      <div className="flex items-center justify-center gap-2.5 sm:gap-3 mb-8 flex-wrap">
        {categories.map(cat => {
          const isActive = selectedCategory === cat.key;
          return (
            <button
              type="button"
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-5 sm:px-6 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 border ${
                isActive
                  ? 'bg-[#231F1E] text-white border-[#231F1E] shadow-md'
                  : 'bg-[#FAF7F2] text-[#3D3734] border-[#D5CCC0] hover:border-[#231F1E] hover:bg-white'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      <div className="max-w-4xl mx-auto mb-10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white/90 p-3 rounded-2xl border border-[#D5CCC0] shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-stone-400 absolute top-1/2 -translate-y-1/2 start-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t('search_placeholder')}
            className="w-full bg-[#FAF7F2] border border-[#D5CCC0] rounded-xl ps-9 pe-3 py-2.5 text-xs text-[#231F1E] focus:outline-none focus:border-[#B89F86]"
          />
        </div>

        <div className="flex items-center justify-between sm:justify-center gap-2 overflow-x-auto py-0.5 no-scrollbar">
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[11px] font-bold text-stone-400 me-1 hidden sm:flex items-center gap-1">
              <SlidersHorizontal className="w-3 h-3" /> {t('roast_suffix')}:
            </span>
            {roastLevels.map(r => (
              <button
                type="button"
                key={r.key}
                onClick={() => onSelectRoast(r.key)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all whitespace-nowrap ${
                  selectedRoast === r.key
                    ? 'bg-[#EAE2D7] text-[#231F1E] border border-[#B89F86]'
                    : 'text-stone-500 hover:text-[#231F1E]'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="bg-[#FAF7F2] border border-[#D5CCC0] rounded-xl px-2.5 py-2 text-[11px] sm:text-xs font-bold text-[#231F1E] focus:outline-none shrink-0"
          >
            <option value="featured">{t('sort_featured')}</option>
            <option value="bestseller">{t('sort_bestseller')}</option>
            <option value="price_asc">{t('sort_price_asc')}</option>
            <option value="price_desc">{t('sort_price_desc')}</option>
          </select>
        </div>
      </div>

      {displayedProducts.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-[#D5CCC0] shadow-sm">
          <Package className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <p className="text-stone-500 font-bold text-sm">{t('empty_catalog_msg')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5">
          {displayedProducts.map(product => {
            const displayTitle = lang === 'ar' ? product.name_ar || product.name : product.name;
            const matchingCartItems = cart.filter(c => c.productId === product.id);
            const totalInCart = matchingCartItems.reduce((s, i) => s + i.quantity, 0);
            const primaryCartItem = matchingCartItems[0];

            return (
              <div
                key={product.id}
                className="group bg-white rounded-[26px] border border-[#ECE6DF] overflow-hidden shadow-[0_8px_26px_rgba(35,31,30,0.05)] hover:shadow-[0_14px_34px_rgba(35,31,30,0.10)] transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div
                    onClick={() => onSelectProduct(product)}
                    className="relative h-48 sm:h-60 w-full overflow-hidden bg-[#EAE2D7] cursor-pointer"
                  >
                    <img
                      src={product.image}
                      alt={displayTitle}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {product.stock_quantity <= 0 && (
                      <span className="absolute top-3 start-3 bg-red-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                        {t('out_of_stock')}
                      </span>
                    )}
                    {product.bestseller && product.stock_quantity > 0 && (
                      <span className="absolute top-3 end-3 bg-[#231F1E]/90 backdrop-blur-sm text-[#EAE2D7] text-[9px] sm:text-[10px] font-bold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5 text-[#B89F86]" />
                        {t('bestseller_badge')}
                      </span>
                    )}
                  </div>
                  <div
                    onClick={() => onSelectProduct(product)}
                    className="px-4 sm:px-5 pt-4 pb-3 text-start cursor-pointer"
                  >
                    <span className="text-[11px] font-bold text-[#B5A191] block mb-1">
                      {getCategoryLabel(product.category)}
                    </span>
                    <h3 className="text-sm sm:text-lg font-extrabold text-[#231F1E] line-clamp-2 min-h-[2.75rem] leading-snug">
                      {displayTitle}
                    </h3>
                  </div>
                </div>

                <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-2 flex items-center justify-between gap-2">
                  <div className="text-xs sm:text-sm font-extrabold text-[#231F1E] whitespace-nowrap">
                    <span>{product.price.toFixed(2)}</span>
                    <span className="text-[11px] font-bold ms-0.5">{t('currency')}</span>
                  </div>

                  {totalInCart > 0 && primaryCartItem && onUpdateCartQuantity ? (
                    <div className="flex items-center gap-1.5 bg-[#231F1E] text-white rounded-full px-3 py-2 shadow-sm">
                      <button
                        type="button"
                        onClick={() => onUpdateCartQuantity(primaryCartItem.id, -1)}
                        className="p-0.5 hover:text-[#B89F86]"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-extrabold min-w-[16px] text-center">
                        {totalInCart}
                      </span>
                      <button
                        type="button"
                        onClick={() => onUpdateCartQuantity(primaryCartItem.id, 1)}
                        className="p-0.5 hover:text-[#B89F86]"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={product.stock_quantity <= 0}
                      onClick={() => (onQuickAdd ? onQuickAdd(product) : onSelectProduct(product))}
                      className={`px-4 sm:px-5 py-2 rounded-full text-[11px] sm:text-xs font-bold leading-tight transition-all ${
                        product.stock_quantity > 0
                          ? 'bg-[#231F1E] text-white hover:bg-[#3A3331] active:scale-95 shadow-sm'
                          : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                      }`}
                    >
                      {product.stock_quantity > 0 ? t('add_to_cart_btn') : t('sold_out')}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}