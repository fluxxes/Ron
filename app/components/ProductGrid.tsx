'use client';

import React, { useState, useMemo } from 'react';
import { Product } from '../types/coffee';
import { Search, SlidersHorizontal, Sparkles, Eye } from 'lucide-react';

interface ProductGridProps {
  products: Product[];
  selectedRoast: string;
  onSelectRoast: (roast: string) => void;
  onSelectProduct: (product: Product) => void;
  onQuickAdd?: (product: Product) => void;
  lang?: 'ar' | 'en';
  t: (key: string) => string;
}

export default function ProductGrid({
  products,
  selectedRoast,
  onSelectRoast,
  onSelectProduct,
  onQuickAdd,
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

  const displayedProducts = useMemo(() => {
    return products
      .filter(p => {
        const cat = p.category || 'Crops';
        const matchesCat = selectedCategory === 'All' || cat === selectedCategory;
        const matchesRoast = selectedRoast === 'All' || p.roast_level === selectedRoast;
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
  }, [products, selectedCategory, selectedRoast, searchQuery, sortBy]);

  const getCategoryLabel = (cat?: string) => {
    if (cat === 'Boxes') return t('category_boxes');
    if (cat === 'Tools') return t('category_tools');
    return t('category_crops');
  };

  return (
    <section id="shop" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      
      {/* Storefront Header matching Reference UI */}
      <div className="text-center max-w-2xl mx-auto mb-8">
        <span className="text-[#C4A484] font-semibold text-xs tracking-wider uppercase block mb-2">
          {t('brand_subtitle')}
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-[#2C2825] mb-4 tracking-tight leading-tight">
          {t('hero_title')}
        </h1>
        <p className="text-stone-500 text-xs sm:text-sm leading-relaxed max-w-xl mx-auto">
          {t('hero_desc')}
        </p>
      </div>

      {/* Primary Category Pill Filters matching Reference Image */}
      <div className="flex items-center justify-center gap-2.5 mb-6 flex-wrap">
        {categories.map(cat => (
          <button
            key={cat.key}
            onClick={() => setSelectedCategory(cat.key)}
            className={`px-5 py-2 rounded-full text-xs font-bold transition-all duration-200 border ${
              selectedCategory === cat.key
                ? 'bg-[#2C2825] text-white border-[#2C2825] shadow-sm'
                : 'bg-white text-stone-700 border-stone-300 hover:border-[#2C2825]'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Search, Roast Filter & Sort Bar */}
      <div className="max-w-4xl mx-auto mb-10 flex flex-col md:flex-row items-center justify-between gap-3 bg-white/80 p-3 rounded-2xl border border-[#EDE6DD] shadow-sm">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-stone-400 absolute top-1/2 -translate-y-1/2 start-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t('search_placeholder')}
            className="w-full bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl ps-9 pe-3 py-2 text-xs text-[#2C2825] focus:outline-none focus:border-[#C4A484]"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap justify-center">
          <span className="text-[11px] font-bold text-stone-400 me-1 flex items-center gap-1">
            <SlidersHorizontal className="w-3 h-3" /> {t('roast_suffix')}:
          </span>
          {roastLevels.map(r => (
            <button
              key={r.key}
              onClick={() => onSelectRoast(r.key)}
              className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                selectedRoast === r.key
                  ? 'bg-[#EAE2D7] text-[#2C2825] border border-[#C4A484]'
                  : 'text-stone-500 hover:text-[#2C2825]'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as any)}
          className="bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3 py-2 text-xs font-bold text-[#2C2825] focus:outline-none"
        >
          <option value="featured">{t('sort_featured')}</option>
          <option value="bestseller">{t('sort_bestseller')}</option>
          <option value="price_asc">{t('sort_price_asc')}</option>
          <option value="price_desc">{t('sort_price_desc')}</option>
        </select>
      </div>

      {/* 5-Column Responsive Product Grid matching Reference Image */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
        {displayedProducts.map(product => {
          const displayTitle = lang === 'ar' && product.name_ar ? product.name_ar : product.name;
          const displayNotes = lang === 'ar' && product.flavor_notes_ar?.length ? product.flavor_notes_ar : product.flavor_notes;

          return (
            <div
              key={product.id}
              className="group bg-white rounded-3xl border border-[#EFECE6] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Rounded Top Image Container */}
                <div
                  onClick={() => onSelectProduct(product)}
                  className="relative h-60 w-full overflow-hidden p-2 cursor-pointer"
                >
                  <img
                    src={product.image}
                    alt={displayTitle}
                    className="w-full h-full object-cover rounded-2xl group-hover:scale-105 transition-transform duration-500"
                  />

                  {product.bestseller && product.stock_quantity > 0 && (
                    <span className="absolute top-4 right-4 bg-[#2C2825]/90 backdrop-blur-sm text-[#EAE2D7] text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5 text-[#C4A484]" />
                      {t('bestseller_badge')}
                    </span>
                  )}

                  {product.stock_quantity <= 0 && (
                    <span className="absolute top-4 left-4 bg-red-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                      {t('out_of_stock')}
                    </span>
                  )}

                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors rounded-2xl m-2 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <span className="bg-white/95 text-[#2C2825] px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1 shadow">
                      <Eye className="w-3.5 h-3.5" /> {t('select_options')}
                    </span>
                  </div>
                </div>

                {/* Card Meta Content */}
                <div
                  onClick={() => onSelectProduct(product)}
                  className="px-4 pt-2 pb-3 text-center cursor-pointer"
                >
                  <span className="text-[11px] font-semibold text-[#C4A484] block mb-1">
                    {getCategoryLabel(product.category)}
                  </span>
                  <h3 className="text-sm font-extrabold text-[#2C2825] line-clamp-2 min-h-[2.5rem] leading-snug">
                    {displayTitle}
                  </h3>
                  {displayNotes && displayNotes.length > 0 && (
                    <p className="text-[10px] text-stone-400 mt-1 line-clamp-1">
                      {displayNotes.slice(0, 3).join(' • ')}
                    </p>
                  )}
                </div>
              </div>

              {/* Card Bottom Row: Pill Add to Cart Button + Price in SAR */}
              <div className="px-4 pb-4 pt-2 flex items-center justify-between gap-2 border-t border-stone-100/80">
                <button
                  disabled={product.stock_quantity <= 0}
                  onClick={() => (onQuickAdd ? onQuickAdd(product) : onSelectProduct(product))}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                    product.stock_quantity > 0
                      ? 'bg-[#2C2825] text-white hover:bg-[#3E3834] active:scale-95 shadow-sm'
                      : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                  }`}
                >
                  {product.stock_quantity > 0 ? t('add_to_cart_btn') : t('sold_out')}
                </button>

                <div className="text-xs font-extrabold text-[#2C2825] whitespace-nowrap">
                  <span>{product.price.toFixed(2)}</span>{' '}
                  <span className="text-[11px] font-bold">{t('currency')}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}