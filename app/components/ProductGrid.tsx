import React from 'react';
import { Product } from '../types/coffee';

interface ProductGridProps {
  products: Product[];
  selectedRoast: string;
  onSelectRoast: (roast: string) => void;
  onSelectProduct: (product: Product) => void;
  t: (key: string) => string;
}

export default function ProductGrid({ products, selectedRoast, onSelectRoast, onSelectProduct, t }: ProductGridProps) {
  const roastFilters = [
    { key: 'All', label: t('filter_all') },
    { key: 'Light', label: t('filter_light') },
    { key: 'Medium', label: t('filter_medium') },
    { key: 'Dark', label: t('filter_dark') },
  ];

  return (
    <section id="shop" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
        <div>
          <span className="text-amber-800 font-semibold text-sm uppercase tracking-wider">{t('catalog_subtitle')}</span>
          <h2 className="text-3xl font-bold text-stone-900 mt-1">{t('catalog_title')}</h2>
        </div>
        <div className="mt-4 md:mt-0 flex gap-2">
          {roastFilters.map(roast => (
            <button 
              key={roast.key} 
              onClick={() => onSelectRoast(roast.key)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${selectedRoast === roast.key ? 'bg-amber-900 text-white' : 'bg-white text-stone-600 border border-stone-300'}`}
            >
              {roast.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {products.map(product => (
          <div key={product.id} className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm hover:shadow-xl transition-all flex flex-col justify-between">
            <div>
              <div className="relative h-64 bg-stone-100">
                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                <span className="absolute top-3 right-3 bg-white/90 text-stone-900 text-xs font-bold px-3 py-1 rounded-full">
                  {product.roast_level === 'Light' ? t('filter_light') : product.roast_level === 'Medium' ? t('filter_medium') : t('filter_dark')} {t('roast_suffix')}
                </span>
                {product.stock_quantity <= 0 && (
                  <span className="absolute top-3 left-3 bg-red-600 text-white text-[10px] uppercase font-bold px-2.5 py-1 rounded-full">
                    {t('out_of_stock')}
                  </span>
                )}
              </div>
              <div className="p-6">
                <div className="text-xs font-bold text-amber-800 uppercase mb-1">{product.origin} • {product.region}</div>
                <h3 className="text-xl font-bold text-stone-900 mb-2">{product.name}</h3>
                <p className="text-stone-600 text-sm line-clamp-2 mb-4">{product.description}</p>
                <div className="flex justify-between items-center text-xs text-stone-500 font-medium mb-4">
                  <span>{t('stock_label')} <strong className={product.stock_quantity > 0 ? 'text-emerald-700' : 'text-red-600'}>{product.stock_quantity} {t('bags')}</strong></span>
                  <span>{t('altitude')} {product.altitude}</span>
                </div>
              </div>
            </div>
            <div className="px-6 pb-6 pt-0 flex items-center justify-between border-t border-stone-100 mt-4">
              <span className="text-2xl font-extrabold text-stone-900">${product.price.toFixed(2)}</span>
              <button 
                disabled={product.stock_quantity <= 0}
                onClick={() => onSelectProduct(product)}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  product.stock_quantity > 0 ? 'bg-stone-900 text-white hover:bg-amber-900' : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                }`}
              >
                {product.stock_quantity > 0 ? t('select_options') : t('sold_out')}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}