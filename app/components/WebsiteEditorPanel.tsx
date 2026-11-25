// Copyright (c) 2026 (RON). Developed by (fluxes) All rights reserved.
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Save,
  RotateCcw,
  Plus,
  Trash2,
  Sliders,
  Coffee,
  Truck,
  Languages,
  Search,
  AlertTriangle,
  Palette,
  Megaphone,
  LayoutGrid,
  Banknote,
  BookOpen,
  PhoneCall,
  ShieldCheck,
  Edit3,
  X,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import {
  SiteSettings,
  SiteFeatureFlags,
  WeightOptionConfig,
  GrindOptionConfig,
  BrewGuideItem,
} from '../types/coffee';
import { useSiteSettings, DEFAULT_SITE_SETTINGS } from '../lib/siteSettings';
import { DEFAULT_TRANSLATIONS } from '../lib/useTranslation';
import { TRANSLATION_GROUPS } from '../lib/translationGroups';

interface WebsiteEditorPanelProps {
  userId?: string;
  lang: 'ar' | 'en';
  onNotify: (msg: string) => void;
}

type EditorModalId =
  | null
  | 'brand_theme'
  | 'announcement'
  | 'hero_filters'
  | 'weights_grinds'
  | 'roastery_banner'
  | 'brew_guides'
  | 'footer_contact'
  | 'payments_cod'
  | 'shipping_couriers'
  | 'tracking_accounts';

export default function WebsiteEditorPanel({
  userId,
  lang,
  onNotify,
}: WebsiteEditorPanelProps) {
  const { settings, saveSettings } = useSiteSettings();
  const [draft, setDraft] = useState<SiteSettings>(settings);
  const [viewMode, setViewMode] = useState<'sections' | 'texts'>('sections');
  const [openModal, setOpenModal] = useState<EditorModalId>(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [textSearch, setTextSearch] = useState('');
  const [activeTextGroup, setActiveTextGroup] = useState<string>('all');

  // New Weight / Grind Draft Inputs
  const [newWeight, setNewWeight] = useState<WeightOptionConfig>({
    key: '',
    label_en: '',
    label_ar: '',
    multiplier: 1.0,
    enabled: true,
  });
  const [newGrind, setNewGrind] = useState<GrindOptionConfig>({
    key: '',
    label_en: '',
    label_ar: '',
    extra_price: 1.0,
    enabled: true,
  });

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  const handleSaveAll = async (closeModalAfter = false) => {
    setSaving(true);
    setErrorMsg('');
    try {
      const { error } = await saveSettings(draft, userId);
      if (error) {
        setErrorMsg(error);
      } else {
        onNotify(
          lang === 'ar'
            ? 'تم حفظ ونشر إعدادات الموقع بنجاح!'
            : 'Website settings saved and published live!'
        );
        if (closeModalAfter) setOpenModal(null);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setDraft(DEFAULT_SITE_SETTINGS);
    onNotify(
      lang === 'ar'
        ? 'تمت استعادة الإعدادات الافتراضية (اضغط حفظ لتطبيقها)'
        : 'Reset to defaults (click Save & Publish to apply)'
    );
  };

  const toggleFeature = (key: keyof SiteFeatureFlags) => {
    setDraft(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [key]: !prev.features[key],
      },
    }));
  };

  const getTranslationValue = (key: string, targetLang: 'ar' | 'en') => {
    const dict = targetLang === 'ar' ? draft.translations_ar : draft.translations_en;
    if (dict && dict[key] !== undefined) return dict[key];
    return DEFAULT_TRANSLATIONS[targetLang]?.[key] || '';
  };

  const setTranslationValue = (key: string, targetLang: 'ar' | 'en', value: string) => {
    setDraft(prev => ({
      ...prev,
      [targetLang === 'ar' ? 'translations_ar' : 'translations_en']: {
        ...(targetLang === 'ar' ? prev.translations_ar : prev.translations_en),
        [key]: value,
      },
    }));
  };

  const updateWeightOption = (idx: number, patch: Partial<WeightOptionConfig>) => {
    setDraft(prev => ({
      ...prev,
      weight_options: prev.weight_options.map((w, i) => (i === idx ? { ...w, ...patch } : w)),
    }));
  };

  const removeWeightOption = (idx: number) => {
    setDraft(prev => ({
      ...prev,
      weight_options: prev.weight_options.filter((_, i) => i !== idx),
    }));
  };

  const addWeightOption = () => {
    const cleanKey = newWeight.key.trim();
    if (!cleanKey) return;
    setDraft(prev => ({
      ...prev,
      weight_options: [
        ...prev.weight_options,
        {
          ...newWeight,
          key: cleanKey,
          label_en: newWeight.label_en.trim() || cleanKey,
          label_ar: newWeight.label_ar.trim() || cleanKey,
          multiplier: Number(newWeight.multiplier) || 1.0,
        },
      ],
    }));
    setNewWeight({ key: '', label_en: '', label_ar: '', multiplier: 1.0, enabled: true });
  };

  const updateGrindOption = (idx: number, patch: Partial<GrindOptionConfig>) => {
    setDraft(prev => ({
      ...prev,
      grind_options: prev.grind_options.map((g, i) => (i === idx ? { ...g, ...patch } : g)),
    }));
  };

  const removeGrindOption = (idx: number) => {
    setDraft(prev => ({
      ...prev,
      grind_options: prev.grind_options.filter((_, i) => i !== idx),
    }));
  };

  const addGrindOption = () => {
    const cleanKey = newGrind.key.trim();
    if (!cleanKey) return;
    setDraft(prev => ({
      ...prev,
      grind_options: [
        ...prev.grind_options,
        {
          ...newGrind,
          key: cleanKey,
          label_en: newGrind.label_en.trim() || cleanKey,
          label_ar: newGrind.label_ar.trim() || cleanKey,
          extra_price: Number(newGrind.extra_price) || 0,
        },
      ],
    }));
    setNewGrind({ key: '', label_en: '', label_ar: '', extra_price: 1.0, enabled: true });
  };

  const updateBrewGuide = (idx: number, patch: Partial<BrewGuideItem>) => {
    setDraft(prev => ({
      ...prev,
      brew_guides: prev.brew_guides.map((bg, i) => (i === idx ? { ...bg, ...patch } : bg)),
    }));
  };

  const addBrewGuide = () => {
    const item: BrewGuideItem = {
      id: `guide-${Date.now()}`,
      method: 'New Brew Method',
      method_ar: 'طريقة تحضير جديدة',
      ratio: '1:15',
      ratio_ar: '1:15',
      grind: 'Medium',
      grind_ar: 'متوسطة',
      time: '3:00 min',
      time_ar: '3:00 دقائق',
      steps: ['Step 1'],
      steps_ar: ['الخطوة 1'],
    };
    setDraft(prev => ({ ...prev, brew_guides: [...prev.brew_guides, item] }));
  };

  const removeBrewGuide = (idx: number) => {
    setDraft(prev => ({
      ...prev,
      brew_guides: prev.brew_guides.filter((_, i) => i !== idx),
    }));
  };

  const sectionCards: {
    id: Exclude<EditorModalId, null>;
    icon: any;
    badge_ar: string;
    badge_en: string;
    title_ar: string;
    title_en: string;
    desc_ar: string;
    desc_en: string;
    toggleKey?: keyof SiteFeatureFlags;
    summary_ar: string;
    summary_en: string;
  }[] = [
    {
      id: 'brand_theme',
      icon: Palette,
      badge_ar: 'الهوية والألوان',
      badge_en: 'Brand & Theme',
      title_ar: 'الشعار والألوان العامة للموقع',
      title_en: 'Brand Logo & Storefront Colors',
      desc_ar: 'تعديل نص الشعار (RŌN)، العنوان الفرعي، ولون الخلفية واللون الأساسي والذهبي.',
      desc_en: 'Customize logo text, subtitle, background cream, primary dark, and gold accent.',
      summary_ar: `الشعار: ${draft.theme.brand_logo_text} • اللون: ${draft.theme.primary_dark}`,
      summary_en: `Logo: ${draft.theme.brand_logo_text} • Primary: ${draft.theme.primary_dark}`,
    },
    {
      id: 'announcement',
      icon: Megaphone,
      badge_ar: 'الشريط العلوي',
      badge_en: 'Top Bar',
      title_ar: 'شريط الإعلانات والعروض العلوي',
      title_en: 'Top Announcement Bar',
      desc_ar: 'إظهار أو إخفاء شريط العروض أعلى الموقع وتعديل نصه بالعربي والإنجليزي.',
      desc_en: 'Toggle the announcement banner above the navbar and edit AR/EN text.',
      toggleKey: 'show_announcement_bar',
      summary_ar: draft.features.show_announcement_bar ? 'ظاهر للعملاء' : 'مخفي حالياً',
      summary_en: draft.features.show_announcement_bar ? 'Visible live' : 'Hidden',
    },
    {
      id: 'hero_filters',
      icon: LayoutGrid,
      badge_ar: 'الواجهة الرئيسية',
      badge_en: 'Storefront Hero',
      title_ar: 'العنوان الرئيسي، التصنيفات، والفلاتر',
      title_en: 'Hero Header, Categories & Filters',
      desc_ar: 'تعديل العنوان الرئيسي والوصف، وتفعيل/تعطيل شريط البحث والتصنيفات وأزرار التحميص.',
      desc_en: 'Edit hero headline/subtitle and toggle Search Bar, Category Chips, and Roast Buttons.',
      summary_ar: `أزرار التحميص: ${draft.features.show_roast_filters ? 'مفعلة' : 'مخفية'} • البحث: ${draft.features.show_search_bar ? 'مفعل' : 'مخفي'}`,
      summary_en: `Roast Buttons: ${draft.features.show_roast_filters ? 'On' : 'Off'} • Search: ${draft.features.show_search_bar ? 'On' : 'Off'}`,
    },
    {
      id: 'weights_grinds',
      icon: Coffee,
      badge_ar: 'خيارات المنتجات',
      badge_en: 'Product Options',
      title_ar: 'أوزان الأكياس وخيارات الطحن (+ريال)',
      title_en: 'Bag Weights & Grind Surcharges (+SAR)',
      desc_ar: 'التحكم في الأوزان المتاحة (250g وغيرها) وإضافة أو إخفاء الطحنات وتعديل السعر الإضافي لكل طحنة.',
      desc_en: 'Manage enabled bag weights (250g, etc.), grind types, and exact +SAR surcharges.',
      summary_ar: `${draft.weight_options.filter(w => w.enabled).length} وزن مفعل • ${draft.grind_options.filter(g => g.enabled).length} طحنات مفعلة`,
      summary_en: `${draft.weight_options.filter(w => w.enabled).length} weight(s) • ${draft.grind_options.filter(g => g.enabled).length} grind(s) active`,
    },
    {
      id: 'payments_cod',
      icon: Banknote,
      badge_ar: 'الدفع والتحصيل',
      badge_en: 'Payments & COD',
      title_ar: 'الدفع عند الاستلام وطرق الدفع',
      title_en: 'Pay on Delivery (COD) & Online Payments',
      desc_ar: 'إدارة قواعد الدفع عند الاستلام (الحد الأقصى، رسوم COD، مدى عند الاستلام، نص التعليمات) وتفعيل الدفع الإلكتروني مستقبلاً.',
      desc_en: 'Configure Pay on Delivery limits, fees, instructions, and toggle Card/PayPal/Apple Pay.',
      toggleKey: 'enable_cod',
      summary_ar: `الحد الأقصى COD: ${draft.cod_config.max_order_amount} ريال • الرسوم: ${draft.pricing.cod_fee} ريال`,
      summary_en: `COD Max: ${draft.cod_config.max_order_amount} SAR • Fee: ${draft.pricing.cod_fee} SAR`,
    },
    {
      id: 'shipping_couriers',
      icon: Truck,
      badge_ar: 'الشحن والتوصيل',
      badge_en: 'Shipping & Couriers',
      title_ar: 'شركات الشحن (سمسا / سبل) والأسعار',
      title_en: 'Courier Partners & Shipping Pricing',
      desc_ar: 'تفعيل/تعطيل سمسا والبريد السعودي، وتعديل حد الشحن المجاني وأسعار الشحن القياسي والسريع.',
      desc_en: 'Toggle SMSA / Saudi Post SPL and edit Free Shipping Threshold & courier costs.',
      summary_ar: `مجاني فوق ${draft.pricing.free_shipping_threshold} ريال • قياسي ${draft.pricing.standard_shipping_cost} ريال`,
      summary_en: `Free ≥ ${draft.pricing.free_shipping_threshold} SAR • Std ${draft.pricing.standard_shipping_cost} SAR`,
    },
    {
      id: 'roastery_banner',
      icon: Sparkles,
      badge_ar: 'البانر التعريفي',
      badge_en: 'Feature Banner',
      title_ar: 'بانر المحمصة والشحن الآلي',
      title_en: 'Roastery Highlight Banner',
      desc_ar: 'تعديل نصوص ورابط الزر في البانر الداكن أسفل المنتجات أو إخفاء القسم بالكامل.',
      desc_en: 'Edit dark banner badge, headline, description, CTA link, or disable the section.',
      toggleKey: 'show_roastery_banner',
      summary_ar: draft.features.show_roastery_banner ? 'مفعّل في الصفحة الرئيسية' : 'مخفي',
      summary_en: draft.features.show_roastery_banner ? 'Visible on storefront' : 'Hidden',
    },
    {
      id: 'brew_guides',
      icon: BookOpen,
      badge_ar: 'أكاديمية القهوة',
      badge_en: 'Brew Guides',
      title_ar: 'أدلة ووصفات التحضير',
      title_en: 'Brew Guides & Recipes Manager',
      desc_ar: 'إضافة، تعديل، أو حذف وصفات التحضير (V60، إسبريسو، إلخ) بالكامل بالعربي والإنجليزي.',
      desc_en: 'Add, edit, or delete coffee brew recipes (ratio, grind, time, steps) in AR & EN.',
      toggleKey: 'show_brew_guides',
      summary_ar: `${draft.brew_guides.length} وصفات تحضير مضافة`,
      summary_en: `${draft.brew_guides.length} brew guide(s) configured`,
    },
    {
      id: 'footer_contact',
      icon: PhoneCall,
      badge_ar: 'التواصل والفوتر',
      badge_en: 'Footer & Contact',
      title_ar: 'قسم من نحن، التواصل، وواتساب',
      title_en: 'Footer, About Us & Contact Details',
      desc_ar: 'تعديل البريد الإلكتروني، رقم الجوال، زر واتساب المباشر، ونصوص من نحن وحقوق النشر.',
      desc_en: 'Edit support email, phone number, WhatsApp link, About Us copy, and copyright.',
      toggleKey: 'show_footer',
      summary_ar: draft.content.contact_phone || draft.content.contact_email,
      summary_en: draft.content.contact_email || draft.content.contact_phone,
    },
    {
      id: 'tracking_accounts',
      icon: ShieldCheck,
      badge_ar: 'ميزات النظام',
      badge_en: 'System Modules',
      title_ar: 'تتبع الطلبات وحسابات العملاء',
      title_en: 'Order Tracking & Customer Accounts',
      desc_ar: 'تفعيل أو تعطيل روابط صفحة التتبع (/track) وحسابات العملاء ونظام تذاكر الدعم.',
      desc_en: 'Enable or disable /track links, Customer Account hub, and Support Tickets.',
      summary_ar: `التتبع: ${draft.features.show_track_order ? 'مفعل' : 'معطل'} • الحسابات: ${draft.features.show_customer_accounts ? 'مفعلة' : 'معطلة'}`,
      summary_en: `Tracking: ${draft.features.show_track_order ? 'On' : 'Off'} • Accounts: ${draft.features.show_customer_accounts ? 'On' : 'Off'}`,
    },
  ];

  const filteredTranslationGroups = useMemo(() => {
    const q = textSearch.trim().toLowerCase();
    return TRANSLATION_GROUPS.filter(
      g => activeTextGroup === 'all' || g.id === activeTextGroup
    )
      .map(g => ({
        ...g,
        keys: g.keys.filter(k => {
          if (!q) return true;
          const arVal = getTranslationValue(k.key, 'ar').toLowerCase();
          const enVal = getTranslationValue(k.key, 'en').toLowerCase();
          return (
            k.key.toLowerCase().includes(q) ||
            k.label_ar.toLowerCase().includes(q) ||
            k.label_en.toLowerCase().includes(q) ||
            arVal.includes(q) ||
            enVal.includes(q)
          );
        }),
      }))
      .filter(g => g.keys.length > 0);
  }, [activeTextGroup, textSearch, draft.translations_ar, draft.translations_en]);

  return (
    <div className="space-y-6">
      {/* Top CMS Action Bar */}
      <div className="bg-white p-5 rounded-3xl border border-[#EDE6DD] shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-[#231F1E]">
            {lang === 'ar'
              ? 'مركز تعديل الموقع الشامل (بدون كود)'
              : 'Complete Storefront & Website CMS'}
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            {lang === 'ar'
              ? 'اضغط على زر "تعديل الإعدادات" في أي بطاقة لفتح نافذة التحكم الكاملة الخاصة بها، أو انتقل لمحرر جميع النصوص.'
              : 'Click "Edit Settings" on any storefront card to customize it, or switch to the organized All Texts editor.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#EDE6DD] text-xs font-bold text-stone-700 hover:bg-stone-100 flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'استعادة الافتراضي' : 'Reset Defaults'}</span>
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSaveAll(false)}
            className="px-6 py-2.5 rounded-xl bg-[#231F1E] text-white text-xs font-extrabold hover:bg-[#3A3331] flex items-center gap-2 shadow-md"
          >
            <Save className="w-4 h-4 text-[#C4A484]" />
            <span>
              {saving
                ? lang === 'ar'
                  ? 'جاري الحفظ...'
                  : 'Saving...'
                : lang === 'ar'
                ? 'حفظ ونشر التعديلات'
                : 'Save & Publish Live'}
            </span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 font-bold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Mode Switcher: Visual Section Cards vs Organized All Website Texts */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setViewMode('sections')}
          className={`px-5 py-3 rounded-2xl text-xs font-extrabold flex items-center gap-2 border transition-all ${
            viewMode === 'sections'
              ? 'bg-[#231F1E] text-white border-[#231F1E] shadow-sm'
              : 'bg-white text-stone-700 border-[#EDE6DD]'
          }`}
        >
          <Sliders className="w-4 h-4 text-[#C4A484]" />
          <span>
            {lang === 'ar'
              ? 'أقسام المتجر والنظام (بطاقات التحكم)'
              : 'Storefront & System Sections (Cards)'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setViewMode('texts')}
          className={`px-5 py-3 rounded-2xl text-xs font-extrabold flex items-center gap-2 border transition-all ${
            viewMode === 'texts'
              ? 'bg-[#231F1E] text-white border-[#231F1E] shadow-sm'
              : 'bg-white text-stone-700 border-[#EDE6DD]'
          }`}
        >
          <Languages className="w-4 h-4 text-[#C4A484]" />
          <span>
            {lang === 'ar'
              ? 'تعديل جميع نصوص الموقع (مقسمة حسب القسم - عربي / إنجليزي)'
              : 'All Website Texts Editor (Grouped AR / EN)'}
          </span>
        </button>
      </div>

      {/* ===================================================================== */}
      {/* VIEW 1: DEDICATED SECTION CARDS WITH EDIT BUTTONS                     */}
      {/* ===================================================================== */}
      {viewMode === 'sections' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sectionCards.map(card => {
            const Icon = card.icon;
            const isEnabled = card.toggleKey ? Boolean(draft.features[card.toggleKey]) : true;

            return (
              <div
                key={card.id}
                className="bg-white rounded-3xl p-5 border border-[#EDE6DD] shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-[#FAF7F2] border border-[#EDE6DD] flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-[#9C7E5E]" />
                    </div>

                    {card.toggleKey ? (
                      <button
                        type="button"
                        onClick={() => toggleFeature(card.toggleKey!)}
                        className={`px-3 py-1 rounded-full text-[11px] font-extrabold transition-all ${
                          isEnabled
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-stone-100 text-stone-500 border border-stone-200'
                        }`}
                      >
                        {isEnabled
                          ? lang === 'ar'
                            ? 'مفعّل'
                            : 'Active'
                          : lang === 'ar'
                          ? 'معطّل'
                          : 'Disabled'}
                      </button>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#FAF7F2] text-[#9C7E5E] border border-[#EDE6DD]">
                        {lang === 'ar' ? card.badge_ar : card.badge_en}
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base text-[#231F1E]">
                      {lang === 'ar' ? card.title_ar : card.title_en}
                    </h3>
                    <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                      {lang === 'ar' ? card.desc_ar : card.desc_en}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-100 space-y-3">
                  <p className="text-[11px] font-bold text-[#8C735B] truncate">
                    {lang === 'ar' ? card.summary_ar : card.summary_en}
                  </p>
                  <button
                    type="button"
                    onClick={() => setOpenModal(card.id)}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#231F1E] text-white text-xs font-extrabold hover:bg-[#3A3331] flex items-center justify-center gap-2 transition-all"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-[#C4A484]" />
                    <span>{lang === 'ar' ? 'تعديل إعدادات القسم' : 'Edit Section Settings'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ===================================================================== */}
      {/* VIEW 2: ORGANIZED ALL WEBSITE TEXTS (AR / EN) BY SECTION              */}
      {/* ===================================================================== */}
      {viewMode === 'texts' && (
        <div className="space-y-5">
          <div className="bg-white p-4 rounded-3xl border border-[#EDE6DD] shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-stone-400 absolute top-1/2 -translate-y-1/2 start-3.5" />
              <input
                type="text"
                value={textSearch}
                onChange={e => setTextSearch(e.target.value)}
                placeholder={
                  lang === 'ar'
                    ? 'ابحث عن أي كلمة أو عنوان في الموقع...'
                    : 'Search any word, label, or button text...'
                }
                className="w-full bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl ps-9 pe-4 py-2.5 text-xs"
              />
            </div>

            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              <button
                type="button"
                onClick={() => setActiveTextGroup('all')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap border ${
                  activeTextGroup === 'all'
                    ? 'bg-[#231F1E] text-white border-[#231F1E]'
                    : 'bg-[#FAF7F2] text-stone-600 border-[#EDE6DD]'
                }`}
              >
                {lang === 'ar' ? 'كل الأقسام' : 'All Sections'}
              </button>
              {TRANSLATION_GROUPS.map(g => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setActiveTextGroup(g.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap border ${
                    activeTextGroup === g.id
                      ? 'bg-[#231F1E] text-white border-[#231F1E]'
                      : 'bg-[#FAF7F2] text-stone-600 border-[#EDE6DD]'
                  }`}
                >
                  {lang === 'ar' ? g.title_ar : g.title_en}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            {filteredTranslationGroups.map(group => (
              <div
                key={group.id}
                className="bg-white rounded-3xl p-6 border border-[#EDE6DD] shadow-sm space-y-4"
              >
                <div className="border-b border-stone-100 pb-3">
                  <h3 className="font-extrabold text-base text-[#231F1E]">
                    {lang === 'ar' ? group.title_ar : group.title_en}
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {lang === 'ar' ? group.desc_ar : group.desc_en}
                  </p>
                </div>

                <div className="space-y-3">
                  {group.keys.map(item => (
                    <div
                      key={item.key}
                      className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 items-center bg-[#FAF7F2] p-3.5 rounded-2xl border border-[#EDE6DD] text-xs"
                    >
                      <div className="lg:col-span-3">
                        <p className="font-extrabold text-[#231F1E]">
                          {lang === 'ar' ? item.label_ar : item.label_en}
                        </p>
                        <span className="text-[10px] font-mono text-stone-400">{item.key}</span>
                      </div>
                      <div className="lg:col-span-4">
                        <label className="block text-[10px] font-bold text-stone-400 mb-1">
                          العربية (AR)
                        </label>
                        <input
                          type="text"
                          dir="rtl"
                          value={getTranslationValue(item.key, 'ar')}
                          onChange={e => setTranslationValue(item.key, 'ar', e.target.value)}
                          className="w-full bg-white border border-[#EDE6DD] rounded-xl px-3 py-2 text-xs"
                        />
                      </div>
                      <div className="lg:col-span-4">
                        <label className="block text-[10px] font-bold text-stone-400 mb-1">
                          English (EN)
                        </label>
                        <input
                          type="text"
                          dir="ltr"
                          value={getTranslationValue(item.key, 'en')}
                          onChange={e => setTranslationValue(item.key, 'en', e.target.value)}
                          className="w-full bg-white border border-[#EDE6DD] rounded-xl px-3 py-2 text-xs"
                        />
                      </div>
                      <div className="lg:col-span-1 text-end">
                        <button
                          type="button"
                          onClick={() => {
                            setTranslationValue(
                              item.key,
                              'ar',
                              DEFAULT_TRANSLATIONS.ar[item.key] || ''
                            );
                            setTranslationValue(
                              item.key,
                              'en',
                              DEFAULT_TRANSLATIONS.en[item.key] || ''
                            );
                          }}
                          className="p-2 text-stone-400 hover:text-[#231F1E]"
                          title="Reset field to default"
                        >
                          <RotateCcw className="w-3.5 h-3.5 inline" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* DEDICATED SECTION EDIT MODALS                                         */}
      {/* ===================================================================== */}
      {openModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-[#EDE6DD] flex flex-col">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-[#EDE6DD] flex items-center justify-between bg-[#FAF7F2]">
              <h3 className="font-black text-base sm:text-lg text-[#231F1E]">
                {lang === 'ar'
                  ? sectionCards.find(c => c.id === openModal)?.title_ar
                  : sectionCards.find(c => c.id === openModal)?.title_en}
              </h3>
              <button
                type="button"
                onClick={() => setOpenModal(null)}
                className="p-2 rounded-full hover:bg-stone-200 text-stone-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              {/* MODAL 1: BRAND & THEME COLORS */}
              {openModal === 'brand_theme' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-stone-600 mb-1">
                        {lang === 'ar' ? 'نص الشعار الرئيسي' : 'Brand Logo Text'}
                      </label>
                      <input
                        type="text"
                        value={draft.theme.brand_logo_text}
                        onChange={e =>
                          setDraft(prev => ({
                            ...prev,
                            theme: { ...prev.theme, brand_logo_text: e.target.value },
                          }))
                        }
                        className="w-full bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3.5 py-2.5 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-stone-600 mb-1">
                        {lang === 'ar' ? 'النص الفرعي للشعار' : 'Logo Subtitle'}
                      </label>
                      <input
                        type="text"
                        value={draft.theme.brand_logo_sub}
                        onChange={e =>
                          setDraft(prev => ({
                            ...prev,
                            theme: { ...prev.theme, brand_logo_sub: e.target.value },
                          }))
                        }
                        className="w-full bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3.5 py-2.5"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block font-bold text-stone-600 mb-1">
                        {lang === 'ar' ? 'لون خلفية الموقع' : 'Background Color'}
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={draft.theme.bg_color}
                          onChange={e =>
                            setDraft(prev => ({
                              ...prev,
                              theme: { ...prev.theme, bg_color: e.target.value },
                            }))
                          }
                          className="w-10 h-10 rounded-lg border cursor-pointer"
                        />
                        <input
                          type="text"
                          value={draft.theme.bg_color}
                          onChange={e =>
                            setDraft(prev => ({
                              ...prev,
                              theme: { ...prev.theme, bg_color: e.target.value },
                            }))
                          }
                          className="flex-1 bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3 py-2 font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-stone-600 mb-1">
                        {lang === 'ar' ? 'اللون الأساسي (الأزرار والبانر)' : 'Primary Dark Color'}
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={draft.theme.primary_dark}
                          onChange={e =>
                            setDraft(prev => ({
                              ...prev,
                              theme: { ...prev.theme, primary_dark: e.target.value },
                            }))
                          }
                          className="w-10 h-10 rounded-lg border cursor-pointer"
                        />
                        <input
                          type="text"
                          value={draft.theme.primary_dark}
                          onChange={e =>
                            setDraft(prev => ({
                              ...prev,
                              theme: { ...prev.theme, primary_dark: e.target.value },
                            }))
                          }
                          className="flex-1 bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3 py-2 font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-stone-600 mb-1">
                        {lang === 'ar' ? 'اللون الذهبي الثانوي' : 'Accent Gold Color'}
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={draft.theme.accent_gold}
                          onChange={e =>
                            setDraft(prev => ({
                              ...prev,
                              theme: { ...prev.theme, accent_gold: e.target.value },
                            }))
                          }
                          className="w-10 h-10 rounded-lg border cursor-pointer"
                        />
                        <input
                          type="text"
                          value={draft.theme.accent_gold}
                          onChange={e =>
                            setDraft(prev => ({
                              ...prev,
                              theme: { ...prev.theme, accent_gold: e.target.value },
                            }))
                          }
                          className="flex-1 bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3 py-2 font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* MODAL 2: ANNOUNCEMENT BAR */}
              {openModal === 'announcement' && (
                <div className="space-y-4">
                  <label className="flex items-center justify-between p-4 rounded-2xl bg-[#FAF7F2] border border-[#EDE6DD] cursor-pointer">
                    <span className="font-extrabold text-[#231F1E]">
                      {lang === 'ar' ? 'تفعيل شريط الإعلانات العلوي' : 'Show Top Announcement Bar'}
                    </span>
                    <input
                      type="checkbox"
                      checked={draft.features.show_announcement_bar}
                      onChange={() => toggleFeature('show_announcement_bar')}
                    />
                  </label>
                  <div>
                    <label className="block font-bold text-stone-600 mb-1">
                      {lang === 'ar' ? 'نص الإعلان بالعربية' : 'Announcement Text (Arabic)'}
                    </label>
                    <input
                      type="text"
                      dir="rtl"
                      value={draft.content.announcement_ar}
                      onChange={e =>
                        setDraft(prev => ({
                          ...prev,
                          content: { ...prev.content, announcement_ar: e.target.value },
                        }))
                      }
                      className="w-full bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3.5 py-2.5"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-stone-600 mb-1">
                      {lang === 'ar' ? 'نص الإعلان بالإنجليزية' : 'Announcement Text (English)'}
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      value={draft.content.announcement_en}
                      onChange={e =>
                        setDraft(prev => ({
                          ...prev,
                          content: { ...prev.content, announcement_en: e.target.value },
                        }))
                      }
                      className="w-full bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3.5 py-2.5"
                    />
                  </div>
                </div>
              )}

              {/* MODAL 3: HERO & STOREFRONT FILTERS */}
              {openModal === 'hero_filters' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      {
                        key: 'show_category_filters' as const,
                        ar: 'أزرار التصنيفات',
                        en: 'Category Chips',
                      },
                      {
                        key: 'show_search_bar' as const,
                        ar: 'شريط البحث والترتيب',
                        en: 'Search & Sort Bar',
                      },
                      {
                        key: 'show_roast_filters' as const,
                        ar: 'أزرار درجة التحميص',
                        en: 'Roast Filter Buttons',
                      },
                    ].map(f => (
                      <label
                        key={f.key}
                        className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#EDE6DD] cursor-pointer font-bold"
                      >
                        <span>{lang === 'ar' ? f.ar : f.en}</span>
                        <input
                          type="checkbox"
                          checked={draft.features[f.key]}
                          onChange={() => toggleFeature(f.key)}
                        />
                      </label>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-stone-600 mb-1">
                        العنوان الرئيسي (عربي)
                      </label>
                      <input
                        type="text"
                        dir="rtl"
                        value={getTranslationValue('hero_title', 'ar')}
                        onChange={e => setTranslationValue('hero_title', 'ar', e.target.value)}
                        className="w-full bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3.5 py-2.5"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-stone-600 mb-1">
                        Hero Title (English)
                      </label>
                      <input
                        type="text"
                        dir="ltr"
                        value={getTranslationValue('hero_title', 'en')}
                        onChange={e => setTranslationValue('hero_title', 'en', e.target.value)}
                        className="w-full bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3.5 py-2.5"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-stone-600 mb-1">الوصف (عربي)</label>
                      <textarea
                        rows={2}
                        dir="rtl"
                        value={getTranslationValue('hero_desc', 'ar')}
                        onChange={e => setTranslationValue('hero_desc', 'ar', e.target.value)}
                        className="w-full bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3.5 py-2"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-stone-600 mb-1">
                        Hero Subtitle (English)
                      </label>
                      <textarea
                        rows={2}
                        dir="ltr"
                        value={getTranslationValue('hero_desc', 'en')}
                        onChange={e => setTranslationValue('hero_desc', 'en', e.target.value)}
                        className="w-full bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3.5 py-2"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* MODAL 4: WEIGHTS & GRIND SURCHARGES */}
              {openModal === 'weights_grinds' && (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <h4 className="font-extrabold text-sm text-[#231F1E]">
                      {lang === 'ar'
                        ? 'خيارات الطحن والسعر الإضافي (+ريال)'
                        : 'Grind Options & Extra Price (+SAR)'}
                    </h4>
                    {draft.grind_options.map((g, idx) => (
                      <div
                        key={`${g.key}-${idx}`}
                        className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-[#FAF7F2] p-3 rounded-2xl border border-[#EDE6DD]"
                      >
                        <div className="sm:col-span-2 flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={g.enabled}
                            onChange={e => updateGrindOption(idx, { enabled: e.target.checked })}
                          />
                          <span className="font-mono font-bold truncate">{g.key}</span>
                        </div>
                        <input
                          type="text"
                          value={g.label_ar}
                          onChange={e => updateGrindOption(idx, { label_ar: e.target.value })}
                          className="sm:col-span-3 bg-white border border-[#EDE6DD] rounded-xl px-3 py-2"
                        />
                        <input
                          type="text"
                          value={g.label_en}
                          onChange={e => updateGrindOption(idx, { label_en: e.target.value })}
                          className="sm:col-span-3 bg-white border border-[#EDE6DD] rounded-xl px-3 py-2"
                        />
                        <div className="sm:col-span-3 flex items-center gap-1.5">
                          <span className="font-bold text-stone-500">+SAR</span>
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            value={g.extra_price}
                            onChange={e =>
                              updateGrindOption(idx, {
                                extra_price: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-full bg-white border border-[#EDE6DD] rounded-xl px-3 py-2 font-bold"
                          />
                        </div>
                        <div className="sm:col-span-1 text-end">
                          <button
                            type="button"
                            onClick={() => removeGrindOption(idx)}
                            className="p-1.5 text-stone-400 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                      <input
                        type="text"
                        placeholder="Key (Turkish)"
                        value={newGrind.key}
                        onChange={e => setNewGrind({ ...newGrind, key: e.target.value })}
                        className="bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3 py-2"
                      />
                      <input
                        type="text"
                        placeholder="الاسم بالعربي"
                        value={newGrind.label_ar}
                        onChange={e => setNewGrind({ ...newGrind, label_ar: e.target.value })}
                        className="bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3 py-2"
                      />
                      <input
                        type="text"
                        placeholder="English Label"
                        value={newGrind.label_en}
                        onChange={e => setNewGrind({ ...newGrind, label_en: e.target.value })}
                        className="bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3 py-2"
                      />
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={newGrind.extra_price}
                        onChange={e =>
                          setNewGrind({ ...newGrind, extra_price: parseFloat(e.target.value) || 0 })
                        }
                        className="bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3 py-2"
                      />
                      <button
                        type="button"
                        onClick={addGrindOption}
                        className="bg-[#231F1E] text-white rounded-xl px-3 py-2 font-bold flex items-center justify-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{lang === 'ar' ? 'إضافة' : 'Add'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-stone-100">
                    <h4 className="font-extrabold text-sm text-[#231F1E]">
                      {lang === 'ar' ? 'أوزان الأكياس ومعامل السعر' : 'Bag Weights & Multipliers'}
                    </h4>
                    {draft.weight_options.map((w, idx) => (
                      <div
                        key={`${w.key}-${idx}`}
                        className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-[#FAF7F2] p-3 rounded-2xl border border-[#EDE6DD]"
                      >
                        <div className="sm:col-span-2 flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={w.enabled}
                            onChange={e => updateWeightOption(idx, { enabled: e.target.checked })}
                          />
                          <span className="font-mono font-bold">{w.key}</span>
                        </div>
                        <input
                          type="text"
                          value={w.label_ar}
                          onChange={e => updateWeightOption(idx, { label_ar: e.target.value })}
                          className="sm:col-span-3 bg-white border border-[#EDE6DD] rounded-xl px-3 py-2"
                        />
                        <input
                          type="text"
                          value={w.label_en}
                          onChange={e => updateWeightOption(idx, { label_en: e.target.value })}
                          className="sm:col-span-3 bg-white border border-[#EDE6DD] rounded-xl px-3 py-2"
                        />
                        <div className="sm:col-span-3 flex items-center gap-1.5">
                          <span className="font-bold text-stone-500">xMult</span>
                          <input
                            type="number"
                            step="0.05"
                            min="0.1"
                            value={w.multiplier}
                            onChange={e =>
                              updateWeightOption(idx, {
                                multiplier: parseFloat(e.target.value) || 1,
                              })
                            }
                            className="w-full bg-white border border-[#EDE6DD] rounded-xl px-3 py-2 font-bold"
                          />
                        </div>
                        <div className="sm:col-span-1 text-end">
                          <button
                            type="button"
                            onClick={() => removeWeightOption(idx)}
                            className="p-1.5 text-stone-400 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                      <input
                        type="text"
                        placeholder="Key (125g)"
                        value={newWeight.key}
                        onChange={e => setNewWeight({ ...newWeight, key: e.target.value })}
                        className="bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3 py-2"
                      />
                      <input
                        type="text"
                        placeholder="الاسم بالعربي"
                        value={newWeight.label_ar}
                        onChange={e => setNewWeight({ ...newWeight, label_ar: e.target.value })}
                        className="bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3 py-2"
                      />
                      <input
                        type="text"
                        placeholder="English Label"
                        value={newWeight.label_en}
                        onChange={e => setNewWeight({ ...newWeight, label_en: e.target.value })}
                        className="bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3 py-2"
                      />
                      <input
                        type="number"
                        step="0.05"
                        min="0.1"
                        value={newWeight.multiplier}
                        onChange={e =>
                          setNewWeight({
                            ...newWeight,
                            multiplier: parseFloat(e.target.value) || 1,
                          })
                        }
                        className="bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3 py-2"
                      />
                      <button
                        type="button"
                        onClick={addWeightOption}
                        className="bg-[#231F1E] text-white rounded-xl px-3 py-2 font-bold flex items-center justify-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{lang === 'ar' ? 'إضافة' : 'Add'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* MODAL 5: PAYMENTS & PROPER PAY ON DELIVERY */}
              {openModal === 'payments_cod' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      { key: 'enable_cod' as const, label: 'Pay on Delivery' },
                      { key: 'enable_card' as const, label: 'Card / Mada' },
                      { key: 'enable_paypal' as const, label: 'PayPal' },
                      { key: 'enable_apple_pay' as const, label: 'Apple Pay' },
                    ].map(pm => (
                      <label
                        key={pm.key}
                        className="flex items-center justify-between p-3 rounded-2xl bg-[#FAF7F2] border border-[#EDE6DD] font-bold cursor-pointer"
                      >
                        <span>{pm.label}</span>
                        <input
                          type="checkbox"
                          checked={draft.features[pm.key]}
                          onChange={() => toggleFeature(pm.key)}
                        />
                      </label>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-stone-600 mb-1">
                        {lang === 'ar'
                          ? 'رسوم الدفع عند الاستلام (ريال - 0 مجاني)'
                          : 'Pay on Delivery Fee (SAR)'}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={draft.pricing.cod_fee}
                        onChange={e =>
                          setDraft(prev => ({
                            ...prev,
                            pricing: { ...prev.pricing, cod_fee: parseFloat(e.target.value) || 0 },
                          }))
                        }
                        className="w-full bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3.5 py-2.5 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-stone-600 mb-1">
                        {lang === 'ar'
                          ? 'الحد الأقصى لطلب الدفع عند الاستلام (ريال)'
                          : 'Max COD Order Limit (SAR)'}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={draft.cod_config.max_order_amount}
                        onChange={e =>
                          setDraft(prev => ({
                            ...prev,
                            cod_config: {
                              ...prev.cod_config,
                              max_order_amount: parseFloat(e.target.value) || 0,
                            },
                          }))
                        }
                        className="w-full bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3.5 py-2.5 font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <label className="flex items-center justify-between p-3 rounded-xl bg-[#FAF7F2] border border-[#EDE6DD] cursor-pointer font-bold">
                      <span>{lang === 'ar' ? 'التحقق من رقم الجوال' : 'Require Valid Phone'}</span>
                      <input
                        type="checkbox"
                        checked={draft.cod_config.require_phone_validation}
                        onChange={e =>
                          setDraft(prev => ({
                            ...prev,
                            cod_config: {
                              ...prev.cod_config,
                              require_phone_validation: e.target.checked,
                            },
                          }))
                        }
                      />
                    </label>
                    <label className="flex items-center justify-between p-3 rounded-xl bg-[#FAF7F2] border border-[#EDE6DD] cursor-pointer font-bold">
                      <span>{lang === 'ar' ? 'شارة شبكة مدى عند الاستلام' : 'Mada POS Badge'}</span>
                      <input
                        type="checkbox"
                        checked={draft.cod_config.allow_mada_on_delivery}
                        onChange={e =>
                          setDraft(prev => ({
                            ...prev,
                            cod_config: {
                              ...prev.cod_config,
                              allow_mada_on_delivery: e.target.checked,
                            },
                          }))
                        }
                      />
                    </label>
                    <label className="flex items-center justify-between p-3 rounded-xl bg-[#FAF7F2] border border-[#EDE6DD] cursor-pointer font-bold">
                      <span>{lang === 'ar' ? 'مربع تأكيد الاستلام' : 'Require Confirmation Box'}</span>
                      <input
                        type="checkbox"
                        checked={draft.cod_config.require_confirmation_checkbox}
                        onChange={e =>
                          setDraft(prev => ({
                            ...prev,
                            cod_config: {
                              ...prev.cod_config,
                              require_confirmation_checkbox: e.target.checked,
                            },
                          }))
                        }
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-stone-600 mb-1">
                        تعليمات الدفع عند الاستلام (عربي)
                      </label>
                      <textarea
                        rows={3}
                        dir="rtl"
                        value={draft.cod_config.instructions_ar}
                        onChange={e =>
                          setDraft(prev => ({
                            ...prev,
                            cod_config: { ...prev.cod_config, instructions_ar: e.target.value },
                          }))
                        }
                        className="w-full bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl p-3"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-stone-600 mb-1">
                        COD Instructions (English)
                      </label>
                      <textarea
                        rows={3}
                        dir="ltr"
                        value={draft.cod_config.instructions_en}
                        onChange={e =>
                          setDraft(prev => ({
                            ...prev,
                            cod_config: { ...prev.cod_config, instructions_en: e.target.value },
                          }))
                        }
                        className="w-full bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl p-3"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* MODAL 6: SHIPPING & COURIERS */}
              {openModal === 'shipping_couriers' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="flex items-center justify-between p-4 rounded-2xl bg-[#FAF7F2] border border-[#EDE6DD] font-bold cursor-pointer">
                      <span>SMSA Express</span>
                      <input
                        type="checkbox"
                        checked={draft.features.enable_smsa}
                        onChange={() => toggleFeature('enable_smsa')}
                      />
                    </label>
                    <label className="flex items-center justify-between p-4 rounded-2xl bg-[#FAF7F2] border border-[#EDE6DD] font-bold cursor-pointer">
                      <span>Saudi Post (SPL)</span>
                      <input
                        type="checkbox"
                        checked={draft.features.enable_saudi_post}
                        onChange={() => toggleFeature('enable_saudi_post')}
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block font-bold text-stone-600 mb-1">
                        {lang === 'ar' ? 'حد الشحن المجاني (ريال)' : 'Free Shipping ≥ (SAR)'}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={draft.pricing.free_shipping_threshold}
                        onChange={e =>
                          setDraft(prev => ({
                            ...prev,
                            pricing: {
                              ...prev.pricing,
                              free_shipping_threshold: parseFloat(e.target.value) || 0,
                            },
                          }))
                        }
                        className="w-full bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3.5 py-2.5 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-stone-600 mb-1">
                        {lang === 'ar' ? 'سعر الشحن القياسي' : 'Standard Shipping'}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={draft.pricing.standard_shipping_cost}
                        onChange={e =>
                          setDraft(prev => ({
                            ...prev,
                            pricing: {
                              ...prev.pricing,
                              standard_shipping_cost: parseFloat(e.target.value) || 0,
                            },
                          }))
                        }
                        className="w-full bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3.5 py-2.5 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-stone-600 mb-1">
                        {lang === 'ar' ? 'سعر الشحن السريع' : 'Express Shipping'}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={draft.pricing.express_shipping_cost}
                        onChange={e =>
                          setDraft(prev => ({
                            ...prev,
                            pricing: {
                              ...prev.pricing,
                              express_shipping_cost: parseFloat(e.target.value) || 0,
                            },
                          }))
                        }
                        className="w-full bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3.5 py-2.5 font-bold"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* MODAL 7: ROASTERY BANNER */}
              {openModal === 'roastery_banner' && (
                <div className="space-y-4">
                  <label className="flex items-center justify-between p-4 rounded-2xl bg-[#FAF7F2] border border-[#EDE6DD] font-bold cursor-pointer">
                    <span>{lang === 'ar' ? 'إظهار بانر المحمصة' : 'Show Roastery Banner'}</span>
                    <input
                      type="checkbox"
                      checked={draft.features.show_roastery_banner}
                      onChange={() => toggleFeature('show_roastery_banner')}
                    />
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      dir="rtl"
                      placeholder="عنوان البانر بالعربي"
                      value={getTranslationValue('roastery_banner_title', 'ar')}
                      onChange={e =>
                        setTranslationValue('roastery_banner_title', 'ar', e.target.value)
                      }
                      className="bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3.5 py-2.5"
                    />
                    <input
                      type="text"
                      dir="ltr"
                      placeholder="Banner Title (EN)"
                      value={getTranslationValue('roastery_banner_title', 'en')}
                      onChange={e =>
                        setTranslationValue('roastery_banner_title', 'en', e.target.value)
                      }
                      className="bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3.5 py-2.5"
                    />
                    <textarea
                      rows={2}
                      dir="rtl"
                      placeholder="وصف البانر بالعربي"
                      value={getTranslationValue('roastery_banner_desc', 'ar')}
                      onChange={e =>
                        setTranslationValue('roastery_banner_desc', 'ar', e.target.value)
                      }
                      className="bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3.5 py-2"
                    />
                    <textarea
                      rows={2}
                      dir="ltr"
                      placeholder="Banner Description (EN)"
                      value={getTranslationValue('roastery_banner_desc', 'en')}
                      onChange={e =>
                        setTranslationValue('roastery_banner_desc', 'en', e.target.value)
                      }
                      className="bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3.5 py-2"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-stone-600 mb-1">
                      {lang === 'ar' ? 'رابط الزر (مثال: /track أو #shop)' : 'CTA Link (/track)'}
                    </label>
                    <input
                      type="text"
                      value={draft.content.banner_cta_link}
                      onChange={e =>
                        setDraft(prev => ({
                          ...prev,
                          content: { ...prev.content, banner_cta_link: e.target.value },
                        }))
                      }
                      className="w-full bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3.5 py-2.5 font-mono"
                    />
                  </div>
                </div>
              )}

              {/* MODAL 8: BREW GUIDES MANAGER */}
              {openModal === 'brew_guides' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={draft.features.show_brew_guides}
                        onChange={() => toggleFeature('show_brew_guides')}
                      />
                      <span>
                        {lang === 'ar' ? 'إظهار قسم أدلة التحضير' : 'Show Brew Guides Section'}
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={addBrewGuide}
                      className="bg-[#231F1E] text-white px-4 py-2 rounded-xl font-bold flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{lang === 'ar' ? 'إضافة وصفة' : 'Add Guide'}</span>
                    </button>
                  </div>

                  {draft.brew_guides.map((bg, idx) => (
                    <div
                      key={bg.id || idx}
                      className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EDE6DD] space-y-2.5"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-[#231F1E]">
                          #{idx + 1} {lang === 'ar' ? bg.method_ar : bg.method}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeBrewGuide(idx)}
                          className="text-red-600 hover:underline flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          dir="rtl"
                          value={bg.method_ar}
                          onChange={e => updateBrewGuide(idx, { method_ar: e.target.value })}
                          placeholder="اسم الطريقة بالعربي"
                          className="bg-white border border-[#EDE6DD] rounded-xl px-3 py-2"
                        />
                        <input
                          type="text"
                          dir="ltr"
                          value={bg.method}
                          onChange={e => updateBrewGuide(idx, { method: e.target.value })}
                          placeholder="Method Name (EN)"
                          className="bg-white border border-[#EDE6DD] rounded-xl px-3 py-2"
                        />
                        <input
                          type="text"
                          dir="rtl"
                          value={bg.ratio_ar}
                          onChange={e => updateBrewGuide(idx, { ratio_ar: e.target.value })}
                          placeholder="النسبة بالعربي"
                          className="bg-white border border-[#EDE6DD] rounded-xl px-3 py-2"
                        />
                        <input
                          type="text"
                          dir="ltr"
                          value={bg.ratio}
                          onChange={e => updateBrewGuide(idx, { ratio: e.target.value })}
                          placeholder="Ratio (EN)"
                          className="bg-white border border-[#EDE6DD] rounded-xl px-3 py-2"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <textarea
                          rows={3}
                          dir="rtl"
                          value={(bg.steps_ar || []).join('\n')}
                          onChange={e =>
                            updateBrewGuide(idx, {
                              steps_ar: e.target.value.split('\n').filter(Boolean),
                            })
                          }
                          placeholder="الخطوات بالعربي (كل خطوة في سطر)"
                          className="bg-white border border-[#EDE6DD] rounded-xl p-2.5"
                        />
                        <textarea
                          rows={3}
                          dir="ltr"
                          value={(bg.steps || []).join('\n')}
                          onChange={e =>
                            updateBrewGuide(idx, {
                              steps: e.target.value.split('\n').filter(Boolean),
                            })
                          }
                          placeholder="Steps in English (one per line)"
                          className="bg-white border border-[#EDE6DD] rounded-xl p-2.5"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* MODAL 9: FOOTER & CONTACT INFO */}
              {openModal === 'footer_contact' && (
                <div className="space-y-4">
                  <label className="flex items-center justify-between p-4 rounded-2xl bg-[#FAF7F2] border border-[#EDE6DD] font-bold cursor-pointer">
                    <span>{lang === 'ar' ? 'إظهار الفوتر وقسم التواصل' : 'Show Footer Section'}</span>
                    <input
                      type="checkbox"
                      checked={draft.features.show_footer}
                      onChange={() => toggleFeature('show_footer')}
                    />
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-stone-600 mb-1">Contact Email</label>
                      <input
                        type="email"
                        value={draft.content.contact_email}
                        onChange={e =>
                          setDraft(prev => ({
                            ...prev,
                            content: { ...prev.content, contact_email: e.target.value },
                          }))
                        }
                        className="w-full bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-stone-600 mb-1">Contact Phone</label>
                      <input
                        type="text"
                        value={draft.content.contact_phone}
                        onChange={e =>
                          setDraft(prev => ({
                            ...prev,
                            content: { ...prev.content, contact_phone: e.target.value },
                          }))
                        }
                        className="w-full bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-stone-600 mb-1">
                        WhatsApp (e.g. 9665...)
                      </label>
                      <input
                        type="text"
                        value={draft.content.whatsapp_number}
                        onChange={e =>
                          setDraft(prev => ({
                            ...prev,
                            content: { ...prev.content, whatsapp_number: e.target.value },
                          }))
                        }
                        className="w-full bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3 py-2 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <textarea
                      rows={3}
                      dir="rtl"
                      placeholder="نص من نحن بالعربي"
                      value={getTranslationValue('about_desc', 'ar')}
                      onChange={e => setTranslationValue('about_desc', 'ar', e.target.value)}
                      className="bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl p-3"
                    />
                    <textarea
                      rows={3}
                      dir="ltr"
                      placeholder="About Us (English)"
                      value={getTranslationValue('about_desc', 'en')}
                      onChange={e => setTranslationValue('about_desc', 'en', e.target.value)}
                      className="bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl p-3"
                    />
                  </div>
                </div>
              )}

              {/* MODAL 10: TRACKING & CUSTOMER ACCOUNTS */}
              {openModal === 'tracking_accounts' && (
                <div className="space-y-3">
                  <label className="flex items-center justify-between p-4 rounded-2xl bg-[#FAF7F2] border border-[#EDE6DD] font-bold cursor-pointer">
                    <span>
                      {lang === 'ar'
                        ? 'تفعيل صفحة تتبع الطلبات (/track)'
                        : 'Enable Live Order Tracking (/track)'}
                    </span>
                    <input
                      type="checkbox"
                      checked={draft.features.show_track_order}
                      onChange={() => toggleFeature('show_track_order')}
                    />
                  </label>
                  <label className="flex items-center justify-between p-4 rounded-2xl bg-[#FAF7F2] border border-[#EDE6DD] font-bold cursor-pointer">
                    <span>
                      {lang === 'ar'
                        ? 'تفعيل حسابات العملاء وتذاكر الدعم'
                        : 'Enable Customer Accounts & Support Tickets'}
                    </span>
                    <input
                      type="checkbox"
                      checked={draft.features.show_customer_accounts}
                      onChange={() => toggleFeature('show_customer_accounts')}
                    />
                  </label>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-[#EDE6DD] bg-[#FAF7F2] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpenModal(null)}
                className="px-5 py-2.5 rounded-xl border border-stone-300 bg-white text-xs font-bold text-stone-700"
              >
                {lang === 'ar' ? 'إغلاق' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void handleSaveAll(true)}
                className="px-6 py-2.5 rounded-xl bg-[#231F1E] text-white text-xs font-extrabold hover:bg-[#3A3331] flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-[#C4A484]" />
                <span>
                  {saving
                    ? lang === 'ar'
                      ? 'جاري الحفظ...'
                      : 'Saving...'
                    : lang === 'ar'
                    ? 'حفظ وإغلاق'
                    : 'Save & Apply'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}