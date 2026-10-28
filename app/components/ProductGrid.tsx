'use client';

import React, { useState, useMemo } from 'react';
import { Product, CartItem } from '../types/coffee';
import { localizeProduct } from '../data/products';
import { Plus, Minus } from 'lucide-react';

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
  onSelectProduct,
  onQuickAdd,
  onUpdateCartQuantity,
  lang = 'ar',
  t,
}: ProductGridProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = [
    { key: 'All', label: t('filter_all') },
    { key: 'Crops', label: t('filter_crops') },
    { key: 'Boxes', label: t('filter_boxes') },
    { key: 'Tools', label: t('filter_tools') },
  ];

  // Localize every product so even raw Supabase products display full Arabic/English text
  const localizedProducts = useMemo(() => {
    return products.map(p => localizeProduct(p));
  }, [products]);

  const displayedProducts = useMemo(() => {
    return localizedProducts.filter(p => {
      const cat = p.category || 'Crops';
      const matchesCat = selectedCategory === 'All' || cat === selectedCategory;
      const matchesRoast =
        selectedRoast === 'All' || cat === 'Tools' || p.roast_level === selectedRoast;
      return matchesCat && matchesRoast;
    });
  }, [localizedProducts, selectedCategory, selectedRoast]);

  const getCategoryLabel = (cat?: string) => {
    if (cat === 'Boxes') return t('category_boxes');
    if (cat === 'Tools') return t('category_tools');
    return t('category_crops');
  };

  return (
    <section id="shop" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-14">
      
      {/* Centered Storefront Header matching Reference Image */}
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

      {/* Category Filter Pills matching Reference Image */}
      <div className="flex items-center justify-center gap-2.5 sm:gap-3 mb-12 flex-wrap">
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

      {/* 5-Column Product Cards Grid matching Reference Image */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5">
        {displayedProducts.map(product => {
          const displayTitle =
            lang === 'ar' ? product.name_ar || product.name : product.name;

          const matchingCartItems = cart.filter(c => c.productId === product.id);
          const totalInCart = matchingCartItems.reduce((s, i) => s + i.quantity, 0);
          const primaryCartItem = matchingCartItems[0];

          return (
            <div
              key={product.id}
              className="group bg-white rounded-[26px] border border-[#ECE6DF] overflow-hidden shadow-[0_8px_26px_rgba(35,31,30,0.05)] hover:shadow-[0_14px_34px_rgba(35,31,30,0.10)] transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Full-Bleed Top Image matching Reference Screenshot */}
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
                </div>

                {/* Card Title & Category Meta matching Reference Screenshot */}
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

              {/* Card Bottom Footer: Price + Pill Add to Cart Button matching Reference Screenshot */}
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
                      className="p-0.5 hover:text-[#C4A484]"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-extrabold min-w-[16px] text-center">
                      {totalInCart}
                    </span>
                    <button
                      type="button"
                      onClick={() => onUpdateCartQuantity(primaryCartItem.id, 1)}
                      className="p-0.5 hover:text-[#C4A484]"
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
    </section>
  );
}