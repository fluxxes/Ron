// Copyright (c) 2026 (RON). Developed by (fluxes) All rights reserved.
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';
import {
  SiteSettings,
  WeightOptionConfig,
  GrindOptionConfig,
  Product,
} from '../types/coffee';

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  id: 'main',
  features: {
    show_announcement_bar: false,
    show_roast_filters: false,
    show_search_bar: true,
    show_category_filters: true,
    show_roastery_banner: true,
    show_brew_guides: true,
    show_track_order: true,
    show_customer_accounts: true,
    show_footer: true,
    enable_cod: true,
    enable_card: false,
    enable_paypal: false,
    enable_apple_pay: false,
    enable_smsa: true,
    enable_saudi_post: true,
  },
  pricing: {
    free_shipping_threshold: 200,
    standard_shipping_cost: 25,
    express_shipping_cost: 45,
    cod_fee: 0,
  },
  theme: {
    brand_logo_text: 'RŌN',
    brand_logo_sub: 'ROASTERY',
    bg_color: '#FAF7F2',
    primary_dark: '#231F1E',
    accent_gold: '#C4A484',
    card_bg: '#FFFFFF',
  },
  content: {
    announcement_ar: 'شحن مجاني للطلبات فوق 200 ريال • تحميص طازج يومياً',
    announcement_en: 'Free shipping on orders over 200 SAR • Freshly roasted daily',
    contact_email: 'support@roncoffee.sa',
    contact_phone: '+966 50 000 0000',
    whatsapp_number: '966500000000',
    instagram_url: '',
    banner_cta_link: '/track',
  },
  cod_config: {
    max_order_amount: 1500,
    require_phone_validation: true,
    allow_mada_on_delivery: true,
    require_confirmation_checkbox: true,
    instructions_ar:
      'يمكنك الدفع نقداً أو عبر جهاز مدى مع مندوب التوصيل عند استلام الطلب. يرجى التأكد من صحة رقم الجوال للتنسيق قبل التوصيل.',
    instructions_en:
      'Pay in cash or via Mada POS machine directly to the courier upon delivery. Please ensure your mobile number is reachable.',
  },
  weight_options: [
    { key: '250g', label_en: '250g', label_ar: '250 جرام', multiplier: 1.0, enabled: true },
    { key: '500g', label_en: '500g', label_ar: '500 جرام', multiplier: 1.85, enabled: false },
    { key: '1kg', label_en: '1kg', label_ar: '1 كيلو', multiplier: 3.4, enabled: false },
  ],
  grind_options: [
    { key: 'Whole Bean', label_en: 'Whole Bean', label_ar: 'حبوب كاملة', extra_price: 1.0, enabled: true },
    { key: 'Espresso', label_en: 'Espresso', label_ar: 'إسبريسو', extra_price: 1.0, enabled: true },
    { key: 'Pour Over / Drip', label_en: 'Pour Over / Drip', label_ar: 'تقطير V60 / فلتر', extra_price: 1.0, enabled: true },
    { key: 'French Press', label_en: 'French Press', label_ar: 'فرنش برس', extra_price: 1.0, enabled: false },
  ],
  brew_guides: [
    {
      id: 'v60',
      method: 'Pour Over (V60)',
      method_ar: 'التقطير اليدوي (V60)',
      ratio: '1:16 (20g coffee to 320g water)',
      ratio_ar: '1:16 (20 جرام قهوة إلى 320 مل ماء)',
      grind: 'Medium-Fine',
      grind_ar: 'ناعمة إلى متوسطة',
      time: '2:30 - 3:00 min',
      time_ar: '2:30 - 3:00 دقائق',
      steps: [
        'Rinse paper filter with hot water and discard.',
        'Add 20g coffee and tare scale.',
        'Pour 60g water for a 30-second bloom.',
        'Pour in concentric circles up to 320g. Enjoy!',
      ],
      steps_ar: [
        'اغسل الفلتر الورقي بالماء الساخن ثم تخلص من ماء الشطف.',
        'أضف 20 جرام من القهوة المطحونة وصفر الميزان.',
        'صب 60 مل من الماء للترطيب واتركها لمدة 30 ثانية.',
        'صب الماء بحركة دائرية على دفعات حتى 320 مل واستمتع بقهوتك!',
      ],
    },
    {
      id: 'espresso',
      method: 'Espresso',
      method_ar: 'إسبريسو (Espresso)',
      ratio: '1:2 (18g coffee to 36g espresso)',
      ratio_ar: '1:2 (18 جرام قهوة لاستخلاص 36 جرام)',
      grind: 'Fine',
      grind_ar: 'ناعمة جداً',
      time: '25 - 30 sec',
      time_ar: '25 - 30 ثانية',
      steps: [
        'Dose 18g freshly ground coffee and distribute evenly.',
        'Tamp firmly and level.',
        'Extract 36g liquid espresso in 28 seconds.',
      ],
      steps_ar: [
        'ضع 18 جرام من القهوة المطحونة الطازجة ووزعها بالتساوي.',
        'اكبس القهوة بشكل مستوٍ ومتوازن.',
        'ابدأ الاستخلاص فوراً للحصول على 36 جرام خلال 28 ثانية.',
      ],
    },
  ],
  translations_ar: {},
  translations_en: {},
};

function mergeSiteSettings(raw: Partial<SiteSettings> | null | undefined): SiteSettings {
  if (!raw) return DEFAULT_SITE_SETTINGS;
  return {
    id: raw.id || 'main',
    features: {
      ...DEFAULT_SITE_SETTINGS.features,
      ...(raw.features || {}),
    },
    pricing: {
      ...DEFAULT_SITE_SETTINGS.pricing,
      ...(raw.pricing || {}),
    },
    theme: {
      ...DEFAULT_SITE_SETTINGS.theme,
      ...(raw.theme || {}),
    },
    content: {
      ...DEFAULT_SITE_SETTINGS.content,
      ...(raw.content || {}),
    },
    cod_config: {
      ...DEFAULT_SITE_SETTINGS.cod_config,
      ...(raw.cod_config || {}),
    },
    weight_options:
      Array.isArray(raw.weight_options) && raw.weight_options.length > 0
        ? raw.weight_options
        : DEFAULT_SITE_SETTINGS.weight_options,
    grind_options:
      Array.isArray(raw.grind_options) && raw.grind_options.length > 0
        ? raw.grind_options
        : DEFAULT_SITE_SETTINGS.grind_options,
    brew_guides:
      Array.isArray(raw.brew_guides) && raw.brew_guides.length > 0
        ? raw.brew_guides
        : DEFAULT_SITE_SETTINGS.brew_guides,
    translations_ar: raw.translations_ar || {},
    translations_en: raw.translations_en || {},
    updated_at: raw.updated_at,
  };
}

export function getEnabledWeights(settings: SiteSettings): WeightOptionConfig[] {
  const active = settings.weight_options.filter(w => w.enabled);
  return active.length > 0 ? active : [DEFAULT_SITE_SETTINGS.weight_options[0]];
}

export function getEnabledGrinds(settings: SiteSettings): GrindOptionConfig[] {
  const active = settings.grind_options.filter(g => g.enabled);
  return active.length > 0 ? active : [DEFAULT_SITE_SETTINGS.grind_options[0]];
}

export function calculateConfiguredUnitPrice(
  product: Product,
  selectedWeight: string,
  selectedGrind: string,
  settings: SiteSettings
): number {
  const isTool = product.category === 'Tools';
  if (isTool) return Number(product.price.toFixed(2));

  let mult = 1.0;
  if ((product.category || 'Crops') === 'Crops') {
    const wCfg = settings.weight_options.find(w => w.key === selectedWeight);
    if (wCfg && Number.isFinite(Number(wCfg.multiplier))) {
      mult = Number(wCfg.multiplier);
    }
  }

  let grindExtra = 0;
  const gCfg = settings.grind_options.find(g => g.key === selectedGrind);
  if (gCfg && Number.isFinite(Number(gCfg.extra_price))) {
    grindExtra = Number(gCfg.extra_price);
  }

  return Number((product.price * mult + grindExtra).toFixed(2));
}

interface SiteSettingsContextValue {
  settings: SiteSettings;
  loadingSettings: boolean;
  refreshSettings: () => Promise<void>;
  saveSettings: (next: SiteSettings, userId?: string) => Promise<{ error: string | null }>;
}

const SiteSettingsContext = createContext<SiteSettingsContextValue | null>(null);

export function SiteSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [loadingSettings, setLoadingSettings] = useState<boolean>(true);

  const refreshSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('id', 'main')
        .maybeSingle();

      if (!error && data) {
        setSettings(mergeSiteSettings(data as Partial<SiteSettings>));
      }
    } catch {
      // Fallback to defaults if table hasn't been created yet
    } finally {
      setLoadingSettings(false);
    }
  }, []);

  useEffect(() => {
    void refreshSettings();

    const channel = supabase
      .channel('site-settings-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'site_settings', filter: 'id=eq.main' },
        payload => {
          if (payload.new) {
            setSettings(mergeSiteSettings(payload.new as Partial<SiteSettings>));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshSettings]);

  // Apply live theme CSS variables whenever settings.theme updates
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--bg-cream', settings.theme.bg_color || '#FAF7F2');
      document.documentElement.style.setProperty('--text-espresso', settings.theme.primary_dark || '#231F1E');
      document.body.style.backgroundColor = settings.theme.bg_color || '#FAF7F2';
    }
  }, [settings.theme]);

  const saveSettings = useCallback(
    async (next: SiteSettings, userId?: string): Promise<{ error: string | null }> => {
      const merged = mergeSiteSettings(next);
      const { error } = await supabase.from('site_settings').upsert([
        {
          id: 'main',
          features: merged.features,
          pricing: merged.pricing,
          theme: merged.theme,
          content: merged.content,
          cod_config: merged.cod_config,
          weight_options: merged.weight_options,
          grind_options: merged.grind_options,
          brew_guides: merged.brew_guides,
          translations_ar: merged.translations_ar,
          translations_en: merged.translations_en,
          updated_at: new Date().toISOString(),
          updated_by: userId || null,
        },
      ]);

      if (error) {
        return { error: error.message };
      }
      setSettings(merged);
      return { error: null };
    },
    []
  );

  return React.createElement(
    SiteSettingsContext.Provider,
    { value: { settings, loadingSettings, refreshSettings, saveSettings } },
    children
  );
}

export function useSiteSettings(): SiteSettingsContextValue {
  const ctx = useContext(SiteSettingsContext);
  if (ctx) return ctx;
  return {
    settings: DEFAULT_SITE_SETTINGS,
    loadingSettings: false,
    refreshSettings: async () => {},
    saveSettings: async () => ({ error: 'SiteSettingsProvider missing' }),
  };
}