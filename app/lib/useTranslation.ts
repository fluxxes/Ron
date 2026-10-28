'use client';

import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';

export type SupportedLang = 'ar' | 'en';

const translations: Record<SupportedLang, Record<string, string>> = {
  ar: {
    brand_subtitle: 'متجر RON',
    nav_home: 'الرئيسية',
    nav_shop: 'المتجر',
    nav_track: 'تتبع الطلب',
    nav_brew: 'أدلة التحضير',
    nav_about: 'من نحن',
    nav_contact: 'تواصل معنا',
    hero_title: 'كل ما تحتاجه لعالم القهوة',
    hero_desc: 'تصفّح حبوبنا الطازجة، القهوة المطحونة، القهوة العربية، وأدوات التحضير المختارة بعناية.',
    search_placeholder: 'ابحث عن محصول، إيحاء، أو أداة تحضير...',
    sort_featured: 'الأكثر تميزاً',
    sort_price_asc: 'السعر: من الأقل للأعلى',
    sort_price_desc: 'السعر: من الأعلى للأقل',
    sort_bestseller: 'الأكثر مبيعاً',
    filter_all: 'الكل',
    filter_crops: 'محاصيل RON',
    filter_boxes: 'بوكسات RON',
    filter_tools: 'أدوات القهوة',
    filter_light: 'حمص فاتح',
    filter_medium: 'حمص متوسط',
    filter_dark: 'حمص داكن',
    roast_suffix: 'الدرجة',
    category_crops: 'محاصيل RON',
    category_boxes: 'بوكسات RON',
    category_tools: 'أدوات القهوة',
    add_to_cart_btn: 'أضف للسلة',
    add_to_cart: 'أضف إلى السلة',
    currency: 'ريال',
    out_of_stock: 'نفد المخزون',
    bestseller_badge: 'الأكثر مبيعاً',
    stock_label: 'المتوفر:',
    bags: 'أكياس',
    altitude: 'الارتفاع:',
    process_label: 'المعالجة:',
    flavor_notes_label: 'الإيحاءات:',
    select_options: 'تخصيص المحصول',
    view_details: 'عرض التفاصيل',
    sold_out: 'نفدت الكمية',
    quantity_label: 'الكمية',
    cart_title: 'سلة تسوق RON',
    cart_empty: 'سلة التسوق فارغة حالياً',
    view_cart_bar: 'عرض السلة وإتمام الطلب',
    free_shipping_unlocked: 'تهانينا! حصلت على شحن مجاني لطلبك',
    free_shipping_remaining: 'أضف بقيمة {amount} ريال للحصول على شحن مجاني',
    subtotal: 'المجموع الفرعي',
    shipping: 'الشحن',
    total: 'الإجمالي',
    proceed_to_checkout: 'إتمام الطلب والدفع',
    staff_dash: 'لوحة الموظفين',
    my_account: 'حسابي',
    sign_in: 'تسجيل الدخول',
    sign_up: 'إنشاء حساب',
    sign_out: 'تسجيل الخروج',
    forgot_password: 'نسيت كلمة المرور؟',
    reset_password: 'إرسال رابط الاستعادة',
    auth_title: 'مرحباً بك في محمصة RON',
    auth_desc: 'سجل دخولك لإدارة عناوينك، بطاقاتك المحفوظة، وتتبع طلباتك بسهولة.',
    email_label: 'البريد الإلكتروني',
    password_label: 'كلمة المرور',
    phone_label: 'رقم الجوال',
    checkout_title: 'إتمام الطلب والدفع الآمن',
    checkout_badge: 'الدفع الآمن من محمصة RON',
    full_name: 'الاسم الكامل',
    email_address: 'البريد الإلكتروني',
    shipping_address: 'الحي، الشارع، ورقم المبنى',
    city: 'المدينة',
    postal_code: 'الرمز البريدي',
    national_address: 'العنوان الوطني المختصر (اختياري)',
    shipping_method_title: 'طريقة الشحن والتوصيل',
    shipping_standard: 'شحن قياسي (2 - 4 أيام عمل)',
    shipping_express: 'توصيل رون السريع (نفس اليوم / اليوم التالي)',
    free_label: 'مجاني',
    payment_method_title: 'اختر وسيلة الدفع',
    pay_paypal: 'PayPal / الدفع الآجل',
    pay_apple: 'Apple Pay',
    pay_card: 'بطاقة ائتمانية / مدى',
    pay_cod: 'الدفع عند الاستلام (+15 ريال)',
    cod_fee_label: 'رسوم الدفع عند الاستلام',
    saved_addresses_title: 'اختر من عناوينك المحفوظة',
    use_new_address: 'إدخال عنوان شحن جديد',
    save_address_Future: 'حفظ هذا العنوان في حسابي للطلبات القادمة',
    saved_cards_title: 'بطاقاتك المحفوظة',
    use_new_card: 'استخدام بطاقة جديدة',
    save_card_future: 'حفظ البطاقة بشكل آمن (مشفّر) للطلبات القادمة',
    card_number: 'رقم البطاقة',
    card_holder: 'اسم حامل البطاقة',
    card_expiry: 'تاريخ الانتهاء (MM/YY)',
    card_cvv: 'رمز الأمان (CVV)',
    confirm_cvv_saved: 'أدخل رمز الأمان (CVV) لتأكيد البطاقة المحفوظة:',
    paypal_desc: 'ادفع بأمان عبر رصيد PayPal أو البطاقات المرتبطة أو خدمة الدفع الآجل.',
    paypal_btn: 'الدفع عبر PayPal',
    processing_payment: 'جاري معالجة الطلب بأمان...',
    complete_order: 'تأكيد الطلب والدفع',
    order_placed: 'تم تأكيد طلبك بنجاح!',
    order_success_desc: 'تم استلام طلبك في محمصة RON وتحديث المخزون تلقائياً.',
    order_number_label: 'رقم الطلب:',
    transaction_id_label: 'رقم العملية:',
    track_your_order: 'تتبع حالة الطلب مباشرة',
    print_invoice: 'طباعة الفاتورة الضريبية',
    back_to_store: 'العودة إلى المتجر',
    bag_size: 'حجم الكيس',
    grind_type: 'نوع الطحنة',
    grind_whole: 'حبوب كاملة (Whole Bean)',
    grind_espresso: 'إسبريسو (Espresso)',
    grind_pourover: 'تقطير / فلتر (V60 / Drip)',
    grind_french: 'فرنش برس (French Press)',
    grind_kit: 'طقم متكامل',
    weight_standard: 'حجم قياسي',
    account_tab_profile: 'الملف الشخصي',
    account_tab_addresses: 'العناوين المحفوظة',
    account_tab_payments: 'البطاقات وطرق الدفع',
    account_tab_orders: 'طلباتي وفواتيري',
    save_changes: 'حفظ التغييرات',
    add_new_address: 'إضافة عنوان جديد',
    add_new_card: 'إضافة بطاقة أو حساب PayPal',
    address_label_placeholder: 'التسمية (المنزل / العمل)',
    default_badge: 'افتراضي',
    reorder_btn: 'إعادة الطلب',
    no_orders_yet: 'لا توجد طلبات سابقة حتى الآن.',
    invoice_header: 'محمصة RON للقهوة المختصة - فاتورة ضريبية',
    customer_label: 'العميل:',
    close_btn: 'إغلاق',
    track_badge: 'نظام التتبع المباشر من المحمصة',
    track_page_title: 'تتبع طلبك من محمصة RON',
    track_page_subtitle: 'أدخل رقم الطلب لمتابعة مراحل التحميص والتغليف والشحن لحظة بلحظة.',
    track_input_placeholder: 'رقم الطلب (مثال: RON-2026-123456)',
    track_contact_placeholder: 'البريد الإلكتروني أو رقم الجوال (اختياري)',
    track_btn: 'تتبع الآن',
    recent_orders_label: 'طلباتك الأخيرة:',
    order_not_found: 'لم يتم العثور على الطلب. يرجى التأكد من رقم الطلب والمحاولة مرة أخرى.',
    roastery_items_label: 'المنتجات في الطلب',
    courier_tracking_label: 'رقم تتبع الشحنة:',
    step_confirmed: 'تم تأكيد الطلب والدفع',
    step_processing: 'قيد التجهيز في المحمصة',
    step_roasted: 'تم التحميص والتغليف الطازج',
    step_shipped: 'تم الشحن / جاري التوصيل',
    step_completed: 'تم التوصيل بنجاح',
    status_Processing: 'قيد التجهيز',
    'status_Roasted & Packed': 'تم التحميص والتغليف',
    status_Shipped: 'تم الشحن',
    status_Completed: 'مكتمل',
    status_Cancelled: 'ملغي',
    roastery_banner_badge: 'محمصة رون للقهوة المختصة',
    roastery_banner_title: 'تحميص طازج يومياً بمعايير عالمية',
    roastery_banner_desc: 'نحمّص حبوب القهوة المختصة بعناية فائقة فور طلبك لنضمن لك أعلى درجات النضارة والإيحاءات العطرية في كل كوب.',
    brew_guides_badge: 'أكاديمية باريستا RON',
    brew_guides_title: 'أدلة التحضير الاحترافية من RON',
    brew_guides_subtitle: 'وصفات معايرة بدقة لاستخلاص أفضل الإيحاءات من محاصيلنا المختصة.',
    about_title: 'قصة محمصة RŌN للقهوة المختصة',
    about_desc: 'نحن في محمصة RON ننتقي أجود المحاصيل من مزارع مستدامة في إثيوبيا وكولومبيا والبرازيل وأوغندا، ونحمّصها بعناية فائقة في دفعات صغيرة لضمان وصولها إليك في قمة نضارتها.',
    contact_title: 'تواصل معنا',
    contact_desc: 'فريق خدمة العملاء ومحمصة RON في خدمتك دائماً للطلبات الخاصة والاستفسارات.',
    rights_reserved: 'جميع الحقوق محفوظة لمحمصة RŌN للقهوة المختصة.',
    staff_verifying: 'جاري التحقق من صلاحيات الموظفين...',
    staff_title: 'إدارة العمليات والطلبات - RŌN',
    kpi_total_orders: 'إجمالي الطلبات',
    kpi_revenue: 'إجمالي المبيعات',
    kpi_roasting_queue: 'طابور التحميص النشط',
    kpi_low_stock: 'تنبيهات نقص المخزون (≤10)',
    tab_orders: 'إدارة الطلبات',
    tab_products: 'الكتالوج والمخزون',
    staff_search_orders: 'ابحث برقم الطلب، اسم العميل، الجوال، أو المدينة...',
    bulk_action_label: 'إجراء جماعي',
    export_csv: 'تصدير CSV',
    courier_input_placeholder: 'رقم بوليصة الشحن (أرامكس / سمسا)',
    add_product_btn: 'إضافة محصول / منتج جديد',
    edit_product_title: 'تعديل بيانات المنتج',
    new_product_title: 'إضافة منتج جديد لمتجر RON',
    col_product: 'المنتج (عربي / إنجليزي)',
    col_category: 'التصنيف والدرجة',
    col_price: 'السعر',
    col_stock: 'التحكم السريع بالمخزون',
    col_actions: 'الإجراءات',
    confirm_delete: 'تأكيد الحذف',
    arabic_name_label: 'اسم المنتج بالعربي',
    english_name_label: 'اسم المنتج بالإنجليزي',
    arabic_desc_label: 'وصف المنتج بالعربي',
    english_desc_label: 'وصف المنتج بالإنجليزي',
    image_url_label: 'رابط صورة المنتج',
    save_product_btn: 'حفظ المنتج في كتالوج RON',
  },
  en: {
    brand_subtitle: 'RON Store',
    nav_home: 'Home',
    nav_shop: 'Shop',
    nav_track: 'Track Order',
    nav_brew: 'Brew Guides',
    nav_about: 'About Us',
    nav_contact: 'Contact Us',
    hero_title: 'Everything You Need for the World of Coffee',
    hero_desc: 'Browse our fresh coffee beans, ground coffee, Arabic coffee, and carefully selected brewing tools.',
    search_placeholder: 'Search by origin, flavor note, or brewing tool...',
    sort_featured: 'Featured',
    sort_price_asc: 'Price: Low to High',
    sort_price_desc: 'Price: High to Low',
    sort_bestseller: 'Best Selling',
    filter_all: 'All',
    filter_crops: 'RON Crops',
    filter_boxes: 'RON Boxes',
    filter_tools: 'Coffee Tools',
    filter_light: 'Light Roast',
    filter_medium: 'Medium Roast',
    filter_dark: 'Dark Roast',
    roast_suffix: 'Roast',
    category_crops: 'RON Crops',
    category_boxes: 'RON Boxes',
    category_tools: 'Coffee Tools',
    add_to_cart_btn: 'Add to Cart',
    add_to_cart: 'Add to Cart',
    currency: 'SAR',
    out_of_stock: 'Out of Stock',
    bestseller_badge: 'Bestseller',
    stock_label: 'Available:',
    bags: 'bags',
    altitude: 'Altitude:',
    process_label: 'Process:',
    flavor_notes_label: 'Flavor Notes:',
    select_options: 'Customize Coffee',
    view_details: 'View Details',
    sold_out: 'Sold Out',
    quantity_label: 'Quantity',
    cart_title: 'RON Shopping Cart',
    cart_empty: 'Your shopping cart is currently empty',
    view_cart_bar: 'View Cart & Checkout',
    free_shipping_unlocked: 'Congratulations! You unlocked FREE shipping',
    free_shipping_remaining: 'Add {amount} SAR more to unlock FREE shipping',
    subtotal: 'Subtotal',
    shipping: 'Shipping',
    total: 'Total',
    proceed_to_checkout: 'Proceed to Checkout',
    staff_dash: 'Staff Dash',
    my_account: 'My Account',
    sign_in: 'Sign In',
    sign_up: 'Create Account',
    sign_out: 'Sign Out',
    forgot_password: 'Forgot Password?',
    reset_password: 'Send Reset Link',
    auth_title: 'Welcome to RON Roastery',
    auth_desc: 'Sign in to manage saved addresses, payment methods, and live order tracking.',
    email_label: 'Email Address',
    password_label: 'Password',
    phone_label: 'Phone Number',
    checkout_title: 'Secure RON Checkout',
    checkout_badge: 'RŌN ROASTERY CHECKOUT',
    full_name: 'Full Name',
    email_address: 'Email Address',
    shipping_address: 'District, Street & Building No.',
    city: 'City',
    postal_code: 'Postal Code',
    national_address: 'National Short Address (Optional)',
    shipping_method_title: 'Delivery Method',
    shipping_standard: 'Standard Delivery (2–4 Business Days)',
    shipping_express: 'Express Roastery Courier (Same/Next Day)',
    free_label: 'FREE',
    payment_method_title: 'Select Payment Method',
    pay_paypal: 'PayPal / Pay Later',
    pay_apple: 'Apple Pay',
    pay_card: 'Credit / Debit Card (Mada / Visa / MC)',
    pay_cod: 'Cash on Delivery (+15 SAR)',
    cod_fee_label: 'Cash on Delivery Fee',
    saved_addresses_title: 'Select a Saved Address',
    use_new_address: 'Use a New Shipping Address',
    save_address_Future: 'Save this address to my profile for future orders',
    saved_cards_title: 'Your Saved Cards',
    use_new_card: 'Use a New Card',
    save_card_future: 'Securely save this tokenized card for future orders',
    card_number: 'Card Number',
    card_holder: 'Cardholder Name',
    card_expiry: 'Expiry Date (MM/YY)',
    card_cvv: 'Security Code (CVV)',
    confirm_cvv_saved: 'Confirm 3-digit CVV for selected card:',
    paypal_desc: 'Pay securely using your PayPal balance, linked bank, or PayPal Pay Later.',
    paypal_btn: 'PayPal Checkout',
    processing_payment: 'Processing Secure Order...',
    complete_order: 'Confirm & Pay Now',
    order_placed: 'RON Order Confirmed!',
    order_success_desc: 'Your order has been queued in our roastery and stock is updated.',
    order_number_label: 'Order Number:',
    transaction_id_label: 'Transaction ID:',
    track_your_order: 'Track Live Order Status',
    print_invoice: 'Print Tax Invoice',
    back_to_store: 'Back to Store',
    bag_size: 'Bag Weight',
    grind_type: 'Grind Type',
    grind_whole: 'Whole Bean',
    grind_espresso: 'Espresso',
    grind_pourover: 'Pour Over / Drip (V60)',
    grind_french: 'French Press',
    grind_kit: 'Complete Kit',
    weight_standard: 'Standard',
    account_tab_profile: 'Profile & Preferences',
    account_tab_addresses: 'Saved Addresses',
    account_tab_payments: 'Payment Vault',
    account_tab_orders: 'Orders & Invoices',
    save_changes: 'Save Changes',
    add_new_address: 'Add New Address',
    add_new_card: 'Add Card or PayPal',
    address_label_placeholder: 'Label (Home / Work)',
    default_badge: 'Default',
    reorder_btn: 'Reorder',
    no_orders_yet: 'No orders placed yet.',
    invoice_header: 'RŌN SPECIALTY COFFEE - TAX INVOICE',
    customer_label: 'Customer:',
    close_btn: 'Close',
    track_badge: 'LIVE ROASTERY TRACKER',
    track_page_title: 'Track Your RON Order',
    track_page_subtitle: 'Enter your order number for real-time roasting, packing, and courier updates.',
    track_input_placeholder: 'Order Number (e.g. RON-2026-123456)',
    track_contact_placeholder: 'Email or Phone Number (Optional)',
    track_btn: 'Track Order',
    recent_orders_label: 'Your Recent Orders:',
    order_not_found: 'Order not found. Please check your Order Number and try again.',
    roastery_items_label: 'Order Items',
    courier_tracking_label: 'Courier Tracking:',
    step_confirmed: 'Order Confirmed & Paid',
    step_processing: 'Queued in Roastery',
    step_roasted: 'Freshly Roasted & Packed',
    step_shipped: 'Shipped / Out for Delivery',
    step_completed: 'Delivered / Completed',
    status_Processing: 'Processing',
    'status_Roasted & Packed': 'Roasted & Packed',
    status_Shipped: 'Shipped',
    status_Completed: 'Completed',
    status_Cancelled: 'Cancelled',
    roastery_banner_badge: 'RŌN SPECIALTY ROASTERY',
    roastery_banner_title: 'Freshly Roasted Daily to World-Class Standards',
    roastery_banner_desc: 'Every single bag is micro-batch roasted to order so your coffee arrives at peak aroma, sweetness, and clarity.',
    brew_guides_badge: 'RŌN BARISTA ACADEMY',
    brew_guides_title: 'RON Master Brew Guides',
    brew_guides_subtitle: 'Precision-calibrated recipes to extract peak aromatics from our specialty beans.',
    about_title: 'The RŌN Specialty Roastery Story',
    about_desc: 'At RON, we source micro-lot specialty coffee from sustainable high-altitude estates across Ethiopia, Colombia, Brazil, and Uganda, roasting in small batches for peak freshness.',
    contact_title: 'Contact Us',
    contact_desc: 'Our roastery team and wholesale specialists are ready to assist you.',
    rights_reserved: 'All rights reserved to RŌN Specialty Roastery.',
    staff_verifying: 'Verifying Secure RŌN Staff Credentials...',
    staff_title: 'RŌN Operations & Fulfillment',
    kpi_total_orders: 'Total Orders',
    kpi_revenue: 'Total Revenue',
    kpi_roasting_queue: 'Active Roasting Queue',
    kpi_low_stock: 'Low Stock Alerts (≤10)',
    tab_orders: 'Orders Fulfillment',
    tab_products: 'Catalog & Stock',
    staff_search_orders: 'Search Order #, Customer, Phone, City...',
    bulk_action_label: 'Bulk Action',
    export_csv: 'Export CSV',
    courier_input_placeholder: 'Courier Tracking # (Aramex/SMSA)',
    add_product_btn: 'Add Product',
    edit_product_title: 'Edit RŌN Product',
    new_product_title: 'Add New RŌN Product',
    col_product: 'Product (AR / EN)',
    col_category: 'Category / Roast',
    col_price: 'Price',
    col_stock: 'Quick Stock',
    col_actions: 'Actions',
    confirm_delete: 'Confirm',
    arabic_name_label: 'Arabic Name (الاسم بالعربي)',
    english_name_label: 'English Name',
    arabic_desc_label: 'Arabic Description',
    english_desc_label: 'English Description',
    image_url_label: 'Image URL',
    save_product_btn: 'Save Product to RŌN Catalog',
  },
};

interface LanguageContextValue {
  lang: SupportedLang;
  t: (key: string) => string;
  toggleLanguage: () => void;
  setLang: (lang: SupportedLang) => void;
  translateOption: (opt: string) => string;
  translateStatus: (status: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

let globalLang: SupportedLang = 'ar';
const listeners = new Set<(l: SupportedLang) => void>();

function applyDomDirection(targetLang: SupportedLang) {
  if (typeof document !== 'undefined') {
    document.documentElement.dir = targetLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = targetLang;
  }
}

function broadcastLangChange(next: SupportedLang) {
  globalLang = next;
  applyDomDirection(next);
  if (typeof window !== 'undefined') {
    localStorage.setItem('ron_lang', next);
  }
  listeners.forEach(fn => fn(next));
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<SupportedLang>('ar');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ron_lang') as SupportedLang | null;
      const initial: SupportedLang = saved === 'en' || saved === 'ar' ? saved : 'ar';
      if (!saved) {
        localStorage.setItem('ron_lang', 'ar');
      }
      globalLang = initial;
      setLangState(initial);
      applyDomDirection(initial);
    }

    const listener = (next: SupportedLang) => {
      setLangState(next);
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const setLang = useCallback((next: SupportedLang) => {
    broadcastLangChange(next);
  }, []);

  const toggleLanguage = useCallback(() => {
    const next: SupportedLang = globalLang === 'ar' ? 'en' : 'ar';
    broadcastLangChange(next);
  }, []);

  const t = useCallback(
    (key: string) => {
      return translations[lang]?.[key] || translations['ar'][key] || key;
    },
    [lang]
  );

  const translateOption = useCallback(
    (opt: string) => {
      if (lang === 'en') return opt;
      const map: Record<string, string> = {
        'Whole Bean': 'حبوب كاملة',
        Espresso: 'إسبريسو',
        'Pour Over / Drip': 'تقطير V60 / فلتر',
        'French Press': 'فرنش برس',
        Kit: 'طقم متكامل',
        Standard: 'حجم قياسي',
        '250g': '250 جرام',
        '500g': '500 جرام',
        '1kg': '1 كيلو',
      };
      return map[opt] || opt;
    },
    [lang]
  );

  const translateStatus = useCallback(
    (status: string) => {
      return translations[lang]?.[`status_${status}`] || status;
    },
    [lang]
  );

  return React.createElement(
    LanguageContext.Provider,
    { value: { lang, t, toggleLanguage, setLang, translateOption, translateStatus } },
    children
  );
}

export function useTranslation(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  const [localLang, setLocalLang] = useState<SupportedLang>(globalLang);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ron_lang') as SupportedLang | null;
      const initial: SupportedLang = saved === 'en' || saved === 'ar' ? saved : 'ar';
      if (!saved) {
        localStorage.setItem('ron_lang', 'ar');
      }
      globalLang = initial;
      setLocalLang(initial);
      applyDomDirection(initial);
    }

    const listener = (next: SupportedLang) => {
      setLocalLang(next);
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  if (ctx) return ctx;

  const t = (key: string) =>
    translations[localLang]?.[key] || translations['ar'][key] || key;

  const toggleLanguage = () => {
    const next: SupportedLang = globalLang === 'ar' ? 'en' : 'ar';
    broadcastLangChange(next);
  };

  const setLang = (next: SupportedLang) => {
    broadcastLangChange(next);
  };

  const translateOption = (opt: string) => {
    if (localLang === 'en') return opt;
    const map: Record<string, string> = {
      'Whole Bean': 'حبوب كاملة',
      Espresso: 'إسبريسو',
      'Pour Over / Drip': 'تقطير V60 / فلتر',
      'French Press': 'فرنش برس',
      Kit: 'طقم متكامل',
      Standard: 'حجم قياسي',
      '250g': '250 جرام',
      '500g': '500 جرام',
      '1kg': '1 كيلو',
    };
    return map[opt] || opt;
  };

  const translateStatus = (status: string) =>
    translations[localLang]?.[`status_${status}`] || status;

  return {
    lang: localLang,
    t,
    toggleLanguage,
    setLang,
    translateOption,
    translateStatus,
  };
}