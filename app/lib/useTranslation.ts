'use client';

import { useState, useEffect, createContext, useContext } from 'react';

const translations: Record<string, Record<string, string>> = {
  en: {
    brand_subtitle: 'Specialty Coffee',
    hero_badge: 'RON Specialty Micro-Batch Roastery',
    hero_title_1: 'Exceptional Beans',
    hero_title_2: 'Roasted by RON',
    hero_desc: 'Hand-selected from sustainable estates worldwide, freshly roasted to order, and shipped straight to your cup.',
    explore_btn: 'Explore RON Selection',
    catalog_subtitle: 'RON Catalog',
    catalog_title: 'Available Coffee Inventory',
    filter_all: 'All',
    filter_light: 'Light',
    filter_medium: 'Medium',
    filter_dark: 'Dark',
    roast_suffix: 'Roast',
    out_of_stock: 'Out of Stock',
    stock_label: 'Stock:',
    bags: 'bags',
    altitude: 'Altitude:',
    select_options: 'Select Options',
    sold_out: 'Sold Out',
    cart_title: 'RON Cart',
    cart_empty: 'Your cart is empty',
    total: 'Total',
    proceed_to_checkout: 'Proceed to Checkout',
    staff_dash: 'Staff Management Dash',
    sign_in: 'Sign In',
    sign_out: 'Sign Out',
    auth_title: 'Sign In to RON',
    auth_desc: 'Access customer checkout or log into the staff dashboard.',
    email_label: 'Email',
    password_label: 'Password',
    checkout_title: 'RON Checkout',
    full_name: 'Full Name',
    email_address: 'Email Address',
    shipping_address: 'Shipping Address',
    city: 'City',
    postal_code: 'Postal Code',
    complete_order: 'Complete Order',
    order_placed: 'RON Order Placed!',
    order_success_desc: 'Order saved and stock updated automatically.',
    back_to_store: 'Back to Store',
    bag_size: 'Bag Size',
    grind_type: 'Grind Type',
    add_to_cart: 'Add to Cart',
  },
  ar: {
    brand_subtitle: 'قهوة مختصة',
    hero_badge: 'محمصة رون للقهوة المختصة الدقيقة',
    hero_title_1: 'حبوب استثنائية',
    hero_title_2: 'محمصة بواسطة رون',
    hero_desc: 'منتقاة بعناية من مزارع مستدامة حول العالم، تُحمّص طازجة حسب الطلب وتُشحن مباشرة إلى كوبك.',
    explore_btn: 'استكشف تشكيلة رون',
    catalog_subtitle: 'كتالوج رون',
    catalog_title: 'مخزون القهوة المتاح',
    filter_all: 'الكل',
    filter_light: 'فاتح',
    filter_medium: 'متوسط',
    filter_dark: 'داكن',
    roast_suffix: 'تحميص',
    out_of_stock: 'نفذ المخزون',
    stock_label: 'المخزون:',
    bags: 'أكياس',
    altitude: 'الارتفاع:',
    select_options: 'اختر الخيارات',
    sold_out: 'نفدت',
    cart_title: 'سلة تسوق رون',
    cart_empty: 'سلة التسوق فارغة',
    total: 'الإجمالي',
    proceed_to_checkout: 'إتمام الطلب',
    staff_dash: 'لوحة تحكم الموظفين',
    sign_in: 'تسجيل الدخول',
    sign_out: 'تسجيل الخروج',
    auth_title: 'تسجيل الدخول إلى رون',
    auth_desc: 'الوصول إلى إتمام طلبات العملاء أو تسجيل الدخول إلى لوحة تحكم الموظفين.',
    email_label: 'البريد الإلكتروني',
    password_label: 'كلمة المرور',
    checkout_title: 'إتمام الطلب من رون',
    full_name: 'الاسم الكامل',
    email_address: 'عنوان البريد الإلكتروني',
    shipping_address: 'عنوان الشحن',
    city: 'المدينة',
    postal_code: 'الرمز البريدي',
    complete_order: 'إتمام الطلب',
    order_placed: 'تم تقديم طلبك بنجاح!',
    order_success_desc: 'تم حفظ الطلب وتحديث المخزون تلقائياً.',
    back_to_store: 'العودة إلى المتجر',
    bag_size: 'حجم الكيس',
    grind_type: 'نوع الطحنة',
    add_to_cart: 'أضف إلى السلة',
  }
};

export function useTranslation() {
  const [lang, setLang] = useState<'en' | 'ar'>('en');

  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  const t = (key: string) => {
    return translations[lang]?.[key] || translations['en'][key] || key;
  };

  const toggleLanguage = () => {
    setLang(prev => (prev === 'en' ? 'ar' : 'en'));
  };

  return { lang, t, toggleLanguage };
}