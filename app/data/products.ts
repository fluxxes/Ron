// Copyright (c) 2026 (RON). Developed by (fluxes) All rights reserved.

import { Product } from '../types/coffee';

const FALLBACK_ORIGIN_AR: Record<string, string> = {
  Ethiopia: 'إثيوبيا',
  Colombia: 'كولومبيا',
  Brazil: 'البرازيل',
  Uganda: 'أوغندا',
  Indonesia: 'إندونيسيا',
  Guatemala: 'غواتيمالا',
};

/**
 * Sanitizes and normalizes a product row coming from Supabase `public.products`
 * so no null/undefined array or string fields can ever crash the UI.
 */
export function localizeProduct(raw: Partial<Product> & { id: string }): Product {
  const safePrice = Number(raw.price);
  const safeStock = Number(raw.stock_quantity);

  return {
    id: String(raw.id),
    name: raw.name?.trim() || raw.name_ar?.trim() || 'RON Specialty Coffee',
    name_ar: raw.name_ar?.trim() || raw.name?.trim() || 'قهوة رون المختصة',
    category: raw.category || 'Crops',
    origin: raw.origin?.trim() || 'Ethiopia',
    origin_ar:
      raw.origin_ar?.trim() ||
      (raw.origin ? FALLBACK_ORIGIN_AR[raw.origin] : '') ||
      raw.origin?.trim() ||
      'إثيوبيا',
    region: raw.region?.trim() || '',
    region_ar: raw.region_ar?.trim() || raw.region?.trim() || '',
    process: raw.process?.trim() || 'Washed',
    process_ar: raw.process_ar?.trim() || 'مغسولة',
    altitude: raw.altitude?.trim() || '1,800m',
    flavor_notes: Array.isArray(raw.flavor_notes) ? raw.flavor_notes : [],
    flavor_notes_ar:
      Array.isArray(raw.flavor_notes_ar) && raw.flavor_notes_ar.length > 0
        ? raw.flavor_notes_ar
        : Array.isArray(raw.flavor_notes)
        ? raw.flavor_notes
        : [],
    roast_level:
      raw.roast_level === 'Light' || raw.roast_level === 'Medium' || raw.roast_level === 'Dark'
        ? raw.roast_level
        : 'Medium',
    description: raw.description?.trim() || '',
    description_ar: raw.description_ar?.trim() || raw.description?.trim() || '',
    price: Number.isFinite(safePrice) && safePrice >= 0 ? safePrice : 50.0,
    stock_quantity: Number.isFinite(safeStock) && safeStock >= 0 ? Math.floor(safeStock) : 0,
    image:
      raw.image?.trim() ||
      'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=800&auto=format&fit=crop',
    weight_options:
      Array.isArray(raw.weight_options) && raw.weight_options.length > 0
        ? raw.weight_options
        : ['250g', '500g', '1kg'],
    grind_options:
      Array.isArray(raw.grind_options) && raw.grind_options.length > 0
        ? raw.grind_options
        : ['Whole Bean', 'Espresso', 'Pour Over / Drip', 'French Press'],
    bestseller: Boolean(raw.bestseller),
    created_at: raw.created_at,
  };
}

export const BREW_GUIDES = [
  {
    method: 'Pour Over (V60)',
    method_ar: 'التقطير اليدوي (V60)',
    ratio: '1:16 (e.g., 20g coffee to 320g water)',
    ratio_ar: '1:16 (مثال: 20 جرام قهوة إلى 320 مل ماء)',
    grind: 'Medium-Fine (like table salt)',
    grind_ar: 'ناعمة إلى متوسطة (مثل ملح الطعام)',
    time: '2:30 - 3:00 minutes',
    time_ar: '2:30 - 3:00 دقائق',
    steps: [
      'Rinse paper filter with hot water and discard water.',
      'Add 20g of medium-fine coffee and tare scale.',
      'Pour 60g water for a 30-second bloom.',
      'Pour in concentric circles up to 320g in stages. Enjoy!',
    ],
    steps_ar: [
      'اغسل الفلتر الورقي بالماء الساخن ثم تخلص من ماء الشطف.',
      'أضف 20 جرام من القهوة المطحونة وصفر الميزان.',
      'صب 60 مل من الماء للترطيب واتركها لمدة 30 ثانية.',
      'صب الماء بحركة دائرية على دفعات حتى تصل إلى 320 مل واستمتع بقهوتك!',
    ],
  },
  {
    method: 'Espresso',
    method_ar: 'إسبريسو (Espresso)',
    ratio: '1:2 (e.g., 18g coffee to 36g espresso out)',
    ratio_ar: '1:2 (مثال: 18 جرام قهوة لاستخلاص 36 جرام إسبريسو)',
    grind: 'Fine (powdery)',
    grind_ar: 'ناعمة جداً',
    time: '25 - 30 seconds',
    time_ar: '25 - 30 ثانية',
    steps: [
      'Dose 18g freshly ground coffee into your portafilter and distribute evenly.',
      'Tamp firmly and level.',
      'Lock in and immediately start extraction. Aim for 36g liquid espresso in 28 seconds.',
    ],
    steps_ar: [
      'ضع 18 جرام من القهوة المطحونة الطازجة في البورتافلتر ووزعها بالتساوي.',
      'اكبس القهوة بشكل مستوٍ ومتوازن.',
      'ركّب البورتافلتر وابدأ الاستخلاص فوراً للحصول على 36 جرام خلال 28 ثانية.',
    ],
  },

];