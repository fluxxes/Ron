// Copyright (c) 2026 (RON). Developed by (fluxes) All rights reserved.
'use client';

import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { useSiteSettings } from './siteSettings';

export type SupportedLang = 'ar' | 'en';

export const DEFAULT_TRANSLATIONS: Record<SupportedLang, Record<string, string>> = {
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
    proceed_to_checkout: 'إتمام الطلب',
    staff_dash: 'لوحة الموظفين',
    edit_website_btn: 'تعديل الموقع',
    tab_edit_website: 'تعديل الموقع (CMS)',
    my_account: 'حسابي',
    sign_in: 'تسجيل الدخول',
    sign_up: 'إنشاء حساب',
    sign_out: 'تسجيل الخروج',
    forgot_password: 'نسيت كلمة المرور؟',
    reset_password: 'إرسال رابط الاستعادة',
    auth_title: 'مرحباً بك في محمصة RON',
    auth_desc: 'سجل دخولك لإدارة عناوينك، وتتبع طلباتك وتذاكر الدعم بسهولة.',
    email_label: 'البريد الإلكتروني',
    password_label: 'كلمة المرور',
    phone_label: 'رقم الجوال',
    checkout_title: 'إتمام الطلب وتأكيد التوصيل',
    checkout_badge: 'طلب مباشر من محمصة RON',
    full_name: 'الاسم الكامل',
    email_address: 'البريد الإلكتروني',
    shipping_address: 'الحي، الشارع، ورقم المبنى',
    city: 'المدينة',
    postal_code: 'الرمز البريدي',
    national_address: 'العنوان الوطني المختصر (مثال: RRRD2929)',
    courier_select_title: 'اختر شركة الشحن والتوصيل',
    courier_smsa: 'سمسا إكسبرس (SMSA Express)',
    courier_spl: 'البريد السعودي سبل (Saudi Post SPL)',
    shipping_method_title: 'سرعة التوصيل',
    shipping_standard: 'شحن قياسي (2 - 4 أيام عمل)',
    shipping_express: 'توصيل رون السريع (نفس اليوم / اليوم التالي)',
    free_label: 'مجاني',
    payment_method_title: 'طريقة الدفع',
    pay_paypal: 'PayPal / الدفع الآجل',
    pay_apple: 'Apple Pay',
    pay_card: 'بطاقة ائتمانية / مدى',
    pay_cod: 'الدفع عند الاستلام',
    cod_only_desc: 'الدفع نقداً أو عبر الشبكة لمندوب التوصيل عند استلام طلبك.',
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
    processing_payment: 'جاري تأكيد الطلب وإصدار بوليصة الشحن آلياً...',
    complete_order: 'تأكيد الطلب الآن',
    order_placed: 'تم تأكيد طلبك وإصدار بوليصة الشحن آلياً!',
    order_success_desc: 'تم خصم المخزون وتجهيز طلبك وإرساله لشركة الشحن تلقائياً.',
    order_number_label: 'رقم الطلب:',
    transaction_id_label: 'رقم العملية:',
    track_your_order: 'تتبع الشحنة مباشرة',
    print_invoice: 'طباعة الفاتورة الضريبية',
    back_to_store: 'العودة إلى المتجر',
    bag_size: 'حجم الكيس',
    grind_type: 'نوع الطحنة',
    account_tab_profile: 'الملف الشخصي',
    account_tab_addresses: 'العناوين المحفوظة',
    account_tab_payments: 'البطاقات وطرق الدفع',
    account_tab_orders: 'طلباتي وفواتيري',
    account_tab_tickets: 'تذاكر الدعم الفني',
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
    new_ticket_btn: 'فتح تذكرة دعم جديدة',
    ticket_subject_placeholder: 'عنوان التذكرة (مثال: استفسار عن شحنة رقم...)',
    ticket_message_placeholder: 'اكتب تفاصيل استفسارك هنا (بحد أقصى 300 كلمة)...',
    ticket_submit_btn: 'إرسال التذكرة',
    ticket_reply_placeholder: 'اكتب ردك هنا...',
    ticket_send_reply: 'إرسال الرد',
    track_badge: 'نظام التتبع الآلي المباشر (SMSA & SPL)',
    track_page_title: 'تتبع طلبك وشحنتك من محمصة RON',
    track_page_subtitle: 'أدخل رقم الطلب أو رقم بوليصة الشحن لمتابعة حالة التوصيل لحظة بلحظة.',
    track_input_placeholder: 'رقم الطلب أو الشحنة (مثال: RON-2026... أو SMSA...)',
    track_contact_placeholder: 'البريد الإلكتروني أو رقم الجوال (اختياري)',
    track_btn: 'تتبع الآن',
    recent_orders_label: 'طلباتك الأخيرة:',
    order_not_found: 'لم يتم العثور على الطلب. يرجى التأكد من رقم الطلب والمحاولة مرة أخرى.',
    roastery_items_label: 'المنتجات في الطلب',
    courier_tracking_label: 'رقم بوليصة الشحن (AWB):',
    step_confirmed: 'تم اعتماد الطلب',
    step_processing: 'قيد التجهيز',
    step_roasted: 'تم التحميص والتغليف',
    step_shipped: 'خرج للتوصيل',
    step_completed: 'تم التسليم للعميل',
    'status_Pending Approval': 'بانتظار الاعتماد',
    status_Approved: 'تم اعتماد الطلب',
    status_Processing: 'قيد التجهيز',
    'status_Roasted & Packed': 'تم التحميص والتغليف',
    status_Shipped: 'تم الشحن',
    'status_Out for Delivery': 'خرج للتوصيل مع المندوب',
    status_Delivered: 'تم التوصيل والتسليم',
    status_Completed: 'مكتمل',
    status_Cancelled: 'ملغي (مسترد المخزون)',
    roastery_banner_badge: 'محمصة رون للقهوة المختصة',
    roastery_banner_title: 'تحميص طازج يومياً وشحن آلي فوري',
    roastery_banner_desc: 'نحمّص حبوب القهوة المختصة فور طلبك ونصدر بوليصة الشحن آلياً عبر سمسا أو البريد السعودي لضمان أعلى درجات النضارة.',
    brew_guides_badge: 'أكاديمية باريستا RON',
    brew_guides_title: 'أدلة التحضير الاحترافية من RON',
    brew_guides_subtitle: 'وصفات معايرة بدقة لاستخلاص أفضل الإيحاءات من محاصيلنا المختصة.',
    about_title: 'قصة محمصة RŌN للقهوة المختصة',
    about_desc: 'نحن في محمصة RON ننتقي أجود المحاصيل من مزارع مستدامة في إثيوبيا وكولومبيا والبرازيل وأوغندا، ونحمّصها بعناية فائقة في دفعات صغيرة.',
    contact_title: 'تواصل معنا',
    contact_desc: 'فريق خدمة العملاء ومحمصة RON في خدمتك دائماً عبر نظام التذاكر المباشر.',
    rights_reserved: 'جميع الحقوق محفوظة لمحمصة RŌN للقهوة المختصة.',
    empty_catalog_msg: 'لا توجد منتجات مضافة في قاعدة بيانات Supabase حالياً.',
    staff_verifying: 'جاري التحقق من صلاحيات الموظفين...',
    staff_title: 'مركز قيادة العمليات والطلبات والمخزون - RŌN',
    kpi_total_orders: 'إجمالي الطلبات',
    kpi_revenue: 'إجمالي المبيعات المؤكدة',
    kpi_open_tickets: 'تذاكر الدعم المفتوحة',
    kpi_low_stock: 'تنبيهات نقص المخزون (≤10)',
    tab_orders: 'إدارة الطلبات والشحن',
    tab_products: 'إدارة المنتجات والمخزون',
    tab_tickets: 'تذاكر خدمة العملاء',
    staff_search_orders: 'ابحث برقم الطلب، البوليصة، اسم العميل، الجوال، أو المدينة...',
    export_csv: 'تصدير CSV',
    courier_input_placeholder: 'رقم بوليصة الشحن (SMSA / SPL)',
    add_product_btn: 'إضافة محصول / منتج جديد',
    edit_product_title: 'تعديل بيانات المنتج في Supabase',
    new_product_title: 'إضافة منتج جديد لقاعدة بيانات RON',
    col_product: 'المنتج (عربي / إنجليزي)',
    col_category: 'التصنيف والدرجة',
    col_price: 'السعر',
    col_stock: 'التحكم السريع بالمخزون',
    col_actions: 'الإجراءات',
    arabic_name_label: 'اسم المنتج بالعربي',
    english_name_label: 'اسم المنتج بالإنجليزي',
    arabic_desc_label: 'وصف المنتج بالعربي',
    english_desc_label: 'وصف المنتج بالإنجليزي',
    image_url_label: 'رابط صورة المنتج',
    save_product_btn: 'حفظ المنتج في قاعدة البيانات',
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
    edit_website_btn: 'Edit Website',
    tab_edit_website: 'Edit Website (CMS)',
    my_account: 'My Account',
    sign_in: 'Sign In',
    sign_up: 'Create Account',
    sign_out: 'Sign Out',
    forgot_password: 'Forgot Password?',
    reset_password: 'Send Reset Link',
    auth_title: 'Welcome to RON Roastery',
    auth_desc: 'Sign in to manage saved addresses, live order tracking, and support tickets.',
    email_label: 'Email Address',
    password_label: 'Password',
    phone_label: 'Phone Number',
    checkout_title: 'Confirm Delivery & Order',
    checkout_badge: 'RŌN DIRECT ROASTERY CHECKOUT',
    full_name: 'Full Name',
    email_address: 'Email Address',
    shipping_address: 'District, Street & Building No.',
    city: 'City',
    postal_code: 'Postal Code',
    national_address: 'National Short Address (e.g. RRRD2929)',
    courier_select_title: 'Select Courier Partner',
    courier_smsa: 'SMSA Express',
    courier_spl: 'Saudi Post (SPL)',
    shipping_method_title: 'Delivery Speed',
    shipping_standard: 'Standard Delivery (2–4 Business Days)',
    shipping_express: 'Express Roastery Courier (Same/Next Day)',
    free_label: 'FREE',
    payment_method_title: 'Payment Method',
    pay_paypal: 'PayPal / Pay Later',
    pay_apple: 'Apple Pay',
    pay_card: 'Credit / Debit Card (Mada / Visa / MC)',
    pay_cod: 'Pay on Delivery',
    cod_only_desc: 'Pay in cash or via POS terminal to the courier when your order arrives.',
    cod_fee_label: 'Pay on Delivery Fee',
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
    processing_payment: 'Confirming Order & Generating Courier Waybill...',
    complete_order: 'Confirm Order Now',
    order_placed: 'RON Order & Waybill Automatically Issued!',
    order_success_desc: 'Your order has been automatically processed and dispatched to the courier.',
    order_number_label: 'Order Number:',
    transaction_id_label: 'Transaction ID:',
    track_your_order: 'Track Live Shipment',
    print_invoice: 'Print Tax Invoice',
    back_to_store: 'Back to Store',
    bag_size: 'Bag Weight',
    grind_type: 'Grind Type',
    account_tab_profile: 'Profile & Preferences',
    account_tab_addresses: 'Saved Addresses',
    account_tab_payments: 'Payment Vault',
    account_tab_orders: 'Orders & Invoices',
    account_tab_tickets: 'Support Tickets',
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
    new_ticket_btn: 'Open New Support Ticket',
    ticket_subject_placeholder: 'Subject (e.g. Question about Order #...)',
    ticket_message_placeholder: 'Describe your request (up to 300 words)...',
    ticket_submit_btn: 'Submit Ticket',
    ticket_reply_placeholder: 'Write a reply...',
    ticket_send_reply: 'Send Reply',
    track_badge: 'AUTOMATED COURIER TRACKER (SMSA & SPL)',
    track_page_title: 'Track Your RON Order & Waybill',
    track_page_subtitle: 'Enter your Order Number or Courier AWB for real-time roasting and delivery updates.',
    track_input_placeholder: 'Order # or AWB (e.g. RON-2026... or SMSA...)',
    track_contact_placeholder: 'Email or Phone Number (Optional)',
    track_btn: 'Track Order',
    recent_orders_label: 'Your Recent Orders:',
    order_not_found: 'Order not found. Please check your Order Number or AWB and try again.',
    roastery_items_label: 'Order Items',
    courier_tracking_label: 'Courier AWB:',
    step_confirmed: 'Order Approved',
    step_processing: 'Processing',
    step_roasted: 'Roasted & Packed',
    step_shipped: 'Out for Delivery',
    step_completed: 'Delivered',
    'status_Pending Approval': 'Pending Approval',
    status_Approved: 'Approved',
    status_Processing: 'Processing',
    'status_Roasted & Packed': 'Roasted & Packed',
    status_Shipped: 'Shipped',
    'status_Out for Delivery': 'Out for Delivery',
    status_Delivered: 'Delivered',
    status_Completed: 'Completed',
    status_Cancelled: 'Cancelled (Restocked)',
    roastery_banner_badge: 'RŌN SPECIALTY ROASTERY',
    roastery_banner_title: 'Freshly Roasted Daily with Automated Courier Dispatch',
    roastery_banner_desc: 'Every bag is micro-batch roasted to order and automatically assigned a SMSA Express or Saudi Post waybill.',
    brew_guides_badge: 'RŌN BARISTA ACADEMY',
    brew_guides_title: 'RON Master Brew Guides',
    brew_guides_subtitle: 'Precision-calibrated recipes to extract peak aromatics from our specialty beans.',
    about_title: 'The RŌN Specialty Roastery Story',
    about_desc: 'At RON, we source micro-lot specialty coffee from sustainable high-altitude estates across Ethiopia, Colombia, Brazil, and Uganda.',
    contact_title: 'Contact Us',
    contact_desc: 'Our roastery team is ready to assist you via our built-in Support Ticket Center.',
    rights_reserved: 'All rights reserved to RŌN Specialty Roastery.',
    empty_catalog_msg: 'No coffee products are currently listed in your Supabase database.',
    staff_verifying: 'Verifying Secure RŌN Staff Credentials...',
    staff_title: 'RŌN Command Center: Orders, Stock & CMS',
    kpi_total_orders: 'Total Orders',
    kpi_revenue: 'Confirmed Revenue',
    kpi_open_tickets: 'Open Support Tickets',
    kpi_low_stock: 'Low Stock Alerts (≤10)',
    tab_orders: 'Order Fulfillment',
    tab_products: 'Catalog & Stock',
    tab_tickets: 'Support Tickets',
    staff_search_orders: 'Search Order #, AWB, Customer, Phone, City...',
    export_csv: 'Export CSV',
    courier_input_placeholder: 'Courier AWB # (SMSA/SPL)',
    add_product_btn: 'Add New Product',
    edit_product_title: 'Edit RŌN Database Product',
    new_product_title: 'Add New Product to Supabase',
    col_product: 'Product (AR / EN)',
    col_category: 'Category / Roast',
    col_price: 'Price',
    col_stock: 'Quick Stock',
    col_actions: 'Actions',
    arabic_name_label: 'Arabic Name (الاسم بالعربي)',
    english_name_label: 'English Name',
    arabic_desc_label: 'Arabic Description',
    english_desc_label: 'English Description',
    image_url_label: 'Image URL',
    save_product_btn: 'Save Product to Supabase',
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
  listeners.forEach(fn => fn(next));
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useSiteSettings();
  const [lang, setLangState] = useState<SupportedLang>('ar');

  useEffect(() => {
    applyDomDirection(globalLang);
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
      const customDict = lang === 'ar' ? settings.translations_ar : settings.translations_en;
      if (customDict && typeof customDict[key] === 'string' && customDict[key].trim() !== '') {
        return customDict[key];
      }
      return DEFAULT_TRANSLATIONS[lang]?.[key] || DEFAULT_TRANSLATIONS['ar'][key] || key;
    },
    [lang, settings.translations_ar, settings.translations_en]
  );

  const translateOption = useCallback(
    (opt: string) => {
      const wMatch = settings.weight_options.find(w => w.key === opt);
      if (wMatch) return lang === 'ar' ? wMatch.label_ar || wMatch.key : wMatch.label_en || wMatch.key;

      const gMatch = settings.grind_options.find(g => g.key === opt);
      if (gMatch) return lang === 'ar' ? gMatch.label_ar || gMatch.key : gMatch.label_en || gMatch.key;

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
    [lang, settings.weight_options, settings.grind_options]
  );

  const translateStatus = useCallback(
    (status: string) => {
      return t(`status_${status}`) || status;
    },
    [t]
  );

  return React.createElement(
    LanguageContext.Provider,
    { value: { lang, t, toggleLanguage, setLang, translateOption, translateStatus } },
    children
  );
}

export function useTranslation(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  const { settings } = useSiteSettings();
  const [localLang, setLocalLang] = useState<SupportedLang>(globalLang);

  useEffect(() => {
    applyDomDirection(globalLang);
    const listener = (next: SupportedLang) => {
      setLocalLang(next);
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  if (ctx) return ctx;

  const t = (key: string) => {
    const customDict = localLang === 'ar' ? settings.translations_ar : settings.translations_en;
    if (customDict && typeof customDict[key] === 'string' && customDict[key].trim() !== '') {
      return customDict[key];
    }
    return DEFAULT_TRANSLATIONS[localLang]?.[key] || DEFAULT_TRANSLATIONS['ar'][key] || key;
  };

  const toggleLanguage = () => {
    const next: SupportedLang = globalLang === 'ar' ? 'en' : 'ar';
    broadcastLangChange(next);
  };

  const setLang = (next: SupportedLang) => {
    broadcastLangChange(next);
  };

  const translateOption = (opt: string) => {
    const wMatch = settings.weight_options.find(w => w.key === opt);
    if (wMatch) return localLang === 'ar' ? wMatch.label_ar : wMatch.label_en;
    const gMatch = settings.grind_options.find(g => g.key === opt);
    if (gMatch) return localLang === 'ar' ? gMatch.label_ar : gMatch.label_en;
    return opt;
  };

  const translateStatus = (status: string) => t(`status_${status}`) || status;

  return {
    lang: localLang,
    t,
    toggleLanguage,
    setLang,
    translateOption,
    translateStatus,
  };
}