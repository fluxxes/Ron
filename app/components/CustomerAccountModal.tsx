'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  MapPin,
  CreditCard,
  Package,
  Plus,
  Trash2,
  CheckCircle2,
  Printer,
  RefreshCw,
  Truck,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  CustomerProfile,
  CustomerAddress,
  SavedPaymentMethod,
  Order,
  CartItem,
} from '../types/coffee';
import Link from 'next/link';

interface CustomerAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  addresses: CustomerAddress[];
  paymentMethods: SavedPaymentMethod[];
  customerOrders: Order[];
  onRefreshAccountData: () => void;
  onReorder: (items: CartItem[]) => void;
  onNotify: (msg: string, type?: 'success' | 'error') => void;
  t: (key: string) => string;
}

export default function CustomerAccountModal({
  isOpen,
  onClose,
  user,
  addresses,
  paymentMethods,
  customerOrders,
  onRefreshAccountData,
  onReorder,
  onNotify,
  t,
}: CustomerAccountModalProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'addresses' | 'payments' | 'orders'>('profile');
  const [profile, setProfile] = useState<Partial<CustomerProfile>>({
    full_name: '',
    phone: '',
    vat_number: '',
    preferred_weight: '250g',
    preferred_grind: 'Whole Bean',
  });

  // New Address State
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: 'Home',
    recipient_name: '',
    phone: '',
    country: 'Saudi Arabia',
    city: 'الرياض',
    address_line1: '',
    postal_code: '',
    national_address: '',
    is_default_shipping: true,
  });

  // New Payment Method State
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentType, setPaymentType] = useState<'card' | 'paypal'>('card');
  const [cardInput, setCardInput] = useState({
    cardholder_name: '',
    card_number: '',
    exp_month: '12',
    exp_year: '28',
    paypal_email: '',
  });

  // Printable Invoice Order
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (user && isOpen) {
      supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data) setProfile(data);
        });
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email,
        ...profile,
        updated_at: new Date().toISOString(),
      });

    if (error) onNotify(error.message, 'error');
    else {
      onNotify('Profile preferences saved!', 'success');
      onRefreshAccountData();
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('customer_addresses').insert([
      {
        user_id: user.id,
        ...newAddress,
        is_default_billing: newAddress.is_default_shipping,
      },
    ]);
    if (error) onNotify(error.message, 'error');
    else {
      onNotify('Shipping address saved to your account.', 'success');
      setShowAddressForm(false);
      onRefreshAccountData();
    }
  };

  const handleDeleteAddress = async (id: string) => {
    await supabase.from('customer_addresses').delete().eq('id', id);
    onNotify('Address removed.', 'success');
    onRefreshAccountData();
  };

  const detectCardBrand = (num: string) => {
    const clean = num.replace(/\D/g, '');
    if (clean.startsWith('4')) return 'Visa';
    if (clean.startsWith('5')) return 'Mastercard';
    if (clean.startsWith('4406') || clean.startsWith('5888')) return 'Mada';
    return 'Visa / Mada';
  };

  const handleAddPaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDigits = cardInput.card_number.replace(/\D/g, '');
    if (paymentType === 'card' && cleanDigits.length < 12) {
      onNotify('Please enter a valid 16-digit card number.', 'error');
      return;
    }

    const last4 = paymentType === 'card' ? cleanDigits.slice(-4) : '';
    const brand = paymentType === 'card' ? detectCardBrand(cleanDigits) : 'PayPal';
    const token = `tok_ron_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const { error } = await supabase.from('saved_payment_methods').insert([
      {
        user_id: user.id,
        method_type: paymentType,
        card_brand: brand,
        last4,
        exp_month: cardInput.exp_month,
        exp_year: cardInput.exp_year,
        cardholder_name: cardInput.cardholder_name,
        paypal_email: cardInput.paypal_email,
        gateway_token: token,
        is_default: paymentMethods.length === 0,
      },
    ]);

    if (error) onNotify(error.message, 'error');
    else {
      onNotify('Payment method vaulted securely.', 'success');
      setShowPaymentForm(false);
      setCardInput({ cardholder_name: '', card_number: '', exp_month: '12', exp_year: '28', paypal_email: '' });
      onRefreshAccountData();
    }
  };

  const handleDeletePayment = async (id: string) => {
    await supabase.from('saved_payment_methods').delete().eq('id', id);
    onNotify('Saved payment method removed.', 'success');
    onRefreshAccountData();
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#FAF7F2] rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-[#EDE6DD] flex flex-col">
        
        {/* Modal Header */}
        <div className="p-6 bg-white border-b border-[#EDE6DD] flex items-center justify-between">
          <div>
            <h3 className="text-xl font-extrabold text-[#2C2825]">{t('my_account')}</h3>
            <p className="text-xs text-stone-500">{user.email}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-stone-100 text-stone-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto bg-white px-6 border-b border-[#EDE6DD] gap-2">
          {[
            { id: 'profile', label: t('account_tab_profile'), icon: User },
            { id: 'addresses', label: t('account_tab_addresses'), icon: MapPin },
            { id: 'payments', label: t('account_tab_payments'), icon: CreditCard },
            { id: 'orders', label: t('account_tab_orders'), icon: Package },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3.5 px-4 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'border-[#2C2825] text-[#2C2825]'
                    : 'border-transparent text-stone-500 hover:text-[#2C2825]'
                }`}
              >
                <Icon className="w-4 h-4 text-[#C4A484]" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* TAB 1: PROFILE & PREFERENCES */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="bg-white p-6 rounded-2xl border border-[#EDE6DD] space-y-4 max-w-xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1">{t('full_name')}</label>
                  <input
                    type="text"
                    value={profile.full_name || ''}
                    onChange={e => setProfile({ ...profile, full_name: e.target.value })}
                    className="w-full bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-4 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1">{t('phone_label')}</label>
                  <input
                    type="tel"
                    value={profile.phone || ''}
                    onChange={e => setProfile({ ...profile, phone: e.target.value })}
                    className="w-full bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-4 py-2.5 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1">{t('bag_size')}</label>
                  <select
                    value={profile.preferred_weight || '250g'}
                    onChange={e => setProfile({ ...profile, preferred_weight: e.target.value })}
                    className="w-full bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-4 py-2.5 text-sm"
                  >
                    <option value="250g">250g</option>
                    <option value="500g">500g</option>
                    <option value="1kg">1kg</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1">{t('grind_type')}</label>
                  <select
                    value={profile.preferred_grind || 'Whole Bean'}
                    onChange={e => setProfile({ ...profile, preferred_grind: e.target.value })}
                    className="w-full bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-4 py-2.5 text-sm"
                  >
                    <option value="Whole Bean">Whole Bean</option>
                    <option value="Espresso">Espresso</option>
                    <option value="Pour Over / Drip">Pour Over / Drip</option>
                    <option value="French Press">French Press</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="bg-[#2C2825] text-white px-6 py-3 rounded-xl text-xs font-bold hover:bg-[#3E3834] transition-all"
              >
                {t('save_changes')}
              </button>
            </form>
          )}

          {/* TAB 2: SAVED SHIPPING & BILLING ADDRESSES */}
          {activeTab === 'addresses' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-sm text-[#2C2825]">{t('account_tab_addresses')}</h4>
                <button
                  onClick={() => setShowAddressForm(!showAddressForm)}
                  className="bg-[#2C2825] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> {t('add_new_address')}
                </button>
              </div>

              {showAddressForm && (
                <form onSubmit={handleAddAddress} className="bg-white p-5 rounded-2xl border border-[#EDE6DD] space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      required
                      placeholder="Label (Home / Work)"
                      value={newAddress.label}
                      onChange={e => setNewAddress({ ...newAddress, label: e.target.value })}
                      className="bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3 py-2 text-xs"
                    />
                    <input
                      type="text"
                      required
                      placeholder={t('full_name')}
                      value={newAddress.recipient_name}
                      onChange={e => setNewAddress({ ...newAddress, recipient_name: e.target.value })}
                      className="bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3 py-2 text-xs"
                    />
                    <input
                      type="tel"
                      required
                      placeholder={t('phone_label')}
                      value={newAddress.phone}
                      onChange={e => setNewAddress({ ...newAddress, phone: e.target.value })}
                      className="bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3 py-2 text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      required
                      placeholder={t('city')}
                      value={newAddress.city}
                      onChange={e => setNewAddress({ ...newAddress, city: e.target.value })}
                      className="bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3 py-2 text-xs"
                    />
                    <input
                      type="text"
                      required
                      placeholder={t('postal_code')}
                      value={newAddress.postal_code}
                      onChange={e => setNewAddress({ ...newAddress, postal_code: e.target.value })}
                      className="bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3 py-2 text-xs"
                    />
                    <input
                      type="text"
                      placeholder={t('national_address')}
                      value={newAddress.national_address}
                      onChange={e => setNewAddress({ ...newAddress, national_address: e.target.value })}
                      className="bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3 py-2 text-xs"
                    />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder={t('shipping_address')}
                    value={newAddress.address_line1}
                    onChange={e => setNewAddress({ ...newAddress, address_line1: e.target.value })}
                    className="w-full bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3 py-2 text-xs"
                  />
                  <button type="submit" className="bg-[#2C2825] text-white px-5 py-2.5 rounded-xl text-xs font-bold">
                    {t('save_changes')}
                  </button>
                </form>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {addresses.map(addr => (
                  <div key={addr.id} className="bg-white p-5 rounded-2xl border border-[#EDE6DD] flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-extrabold text-sm text-[#2C2825]">{addr.label}</span>
                        {addr.is_default_shipping && (
                          <span className="text-[10px] bg-[#EAE2D7] text-[#5A4D41] px-2 py-0.5 rounded-full font-bold">
                            {t('default_badge')}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-stone-700">{addr.recipient_name} • {addr.phone}</p>
                      <p className="text-xs text-stone-500 mt-1">
                        {addr.address_line1}, {addr.city} ({addr.postal_code})
                      </p>
                      {addr.national_address && (
                        <p className="text-[11px] text-[#C4A484] mt-0.5">National: {addr.national_address}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteAddress(addr.id)}
                      className="text-stone-400 hover:text-red-600 p-1.5"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: SAVED PAYMENT METHODS VAULT */}
          {activeTab === 'payments' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-sm text-[#2C2825]">{t('account_tab_payments')}</h4>
                <button
                  onClick={() => setShowPaymentForm(!showPaymentForm)}
                  className="bg-[#2C2825] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> {t('add_new_card')}
                </button>
              </div>

              {showPaymentForm && (
                <form onSubmit={handleAddPaymentMethod} className="bg-white p-5 rounded-2xl border border-[#EDE6DD] space-y-4">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentType('card')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold ${
                        paymentType === 'card' ? 'bg-[#2C2825] text-white' : 'bg-[#FAF7F2] text-stone-600'
                      }`}
                    >
                      {t('pay_card')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentType('paypal')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold ${
                        paymentType === 'paypal' ? 'bg-[#2C2825] text-white' : 'bg-[#FAF7F2] text-stone-600'
                      }`}
                    >
                      PayPal
                    </button>
                  </div>

                  {paymentType === 'card' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        required
                        placeholder={t('card_holder')}
                        value={cardInput.cardholder_name}
                        onChange={e => setCardInput({ ...cardInput, cardholder_name: e.target.value })}
                        className="bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3 py-2.5 text-xs"
                      />
                      <input
                        type="text"
                        required
                        maxLength={19}
                        placeholder="4XXX XXXX XXXX XXXX"
                        value={cardInput.card_number}
                        onChange={e => setCardInput({ ...cardInput, card_number: e.target.value })}
                        className="bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3 py-2.5 text-xs"
                      />
                      <div className="flex gap-2">
                        <input
                          type="text"
                          required
                          maxLength={2}
                          placeholder="MM"
                          value={cardInput.exp_month}
                          onChange={e => setCardInput({ ...cardInput, exp_month: e.target.value })}
                          className="w-1/2 bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3 py-2.5 text-xs"
                        />
                        <input
                          type="text"
                          required
                          maxLength={2}
                          placeholder="YY"
                          value={cardInput.exp_year}
                          onChange={e => setCardInput({ ...cardInput, exp_year: e.target.value })}
                          className="w-1/2 bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3 py-2.5 text-xs"
                        />
                      </div>
                    </div>
                  ) : (
                    <input
                      type="email"
                      required
                      placeholder="PayPal Account Email"
                      value={cardInput.paypal_email}
                      onChange={e => setCardInput({ ...cardInput, paypal_email: e.target.value })}
                      className="w-full bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl px-3 py-2.5 text-xs"
                    />
                  )}

                  <button type="submit" className="bg-[#2C2825] text-white px-5 py-2.5 rounded-xl text-xs font-bold">
                    {t('save_changes')}
                  </button>
                </form>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {paymentMethods.map(pm => (
                  <div key={pm.id} className="bg-white p-5 rounded-2xl border border-[#EDE6DD] flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#2C2825] text-[#EAE2D7] flex items-center justify-center font-bold text-xs">
                        {pm.method_type === 'paypal' ? 'PP' : pm.card_brand?.slice(0, 4)}
                      </div>
                      <div>
                        {pm.method_type === 'paypal' ? (
                          <p className="text-xs font-extrabold text-[#2C2825]">PayPal • {pm.paypal_email}</p>
                        ) : (
                          <>
                            <p className="text-xs font-extrabold text-[#2C2825]">
                              {pm.card_brand} •••• {pm.last4}
                            </p>
                            <p className="text-[11px] text-stone-500">
                              {pm.cardholder_name} • Exp {pm.exp_month}/{pm.exp_year}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeletePayment(pm.id)}
                      className="text-stone-400 hover:text-red-600 p-1.5"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: MY ORDERS & TAX INVOICES */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              {invoiceOrder ? (
                <div className="bg-white p-6 rounded-2xl border border-[#EDE6DD] space-y-4">
                  <div className="flex justify-between items-center border-b pb-4">
                    <div>
                      <h4 className="font-extrabold text-lg text-[#2C2825]">RŌN SPECIALTY COFFEE - TAX INVOICE</h4>
                      <p className="text-xs text-stone-500">
                        Order: {invoiceOrder.order_number || invoiceOrder.id.slice(0, 8)} • {new Date(invoiceOrder.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => window.print()}
                        className="bg-[#2C2825] text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1"
                      >
                        <Printer className="w-3.5 h-3.5" /> Print
                      </button>
                      <button
                        onClick={() => setInvoiceOrder(null)}
                        className="bg-stone-100 text-stone-700 px-3 py-1.5 rounded-xl text-xs font-bold"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                  <div className="text-xs space-y-1">
                    <p><strong>Customer:</strong> {invoiceOrder.customer_name} ({invoiceOrder.customer_email})</p>
                    <p><strong>Shipping Address:</strong> {invoiceOrder.address}, {invoiceOrder.city} {invoiceOrder.postal_code}</p>
                    <p><strong>Payment Method:</strong> {invoiceOrder.payment_method?.toUpperCase()} ({invoiceOrder.payment_status || 'Paid'})</p>
                  </div>
                  <div className="border-t border-b py-3 space-y-2">
                    {invoiceOrder.items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-xs">
                        <span>{item.quantity}x {item.name} ({item.selectedWeight} / {item.selectedGrind})</span>
                        <span className="font-bold">{(item.price * item.quantity).toFixed(2)} SAR</span>
                      </div>
                    ))}
                  </div>
                  <div className="text-end font-extrabold text-base text-[#2C2825]">
                    Total Paid (Incl. VAT): {invoiceOrder.total_amount.toFixed(2)} SAR
                  </div>
                </div>
              ) : customerOrders.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-[#EDE6DD] text-stone-400 text-sm">
                  No orders placed yet.
                </div>
              ) : (
                customerOrders.map(order => (
                  <div key={order.id} className="bg-white p-5 rounded-2xl border border-[#EDE6DD] flex flex-col sm:flex-row justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-extrabold text-sm text-[#2C2825]">
                          {order.order_number || `#${order.id.slice(0, 8)}`}
                        </span>
                        <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-[#EAE2D7] text-[#5A4D41]">
                          {order.status}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 mb-2">
                        {new Date(order.created_at).toLocaleDateString()} • {order.total_amount.toFixed(2)} {t('currency')}
                      </p>
                      <div className="space-y-0.5">
                        {order.items?.map((item, i) => (
                          <p key={i} className="text-xs text-stone-700">
                            • {item.quantity}x {item.name} ({item.selectedWeight})
                          </p>
                        ))}
                      </div>
                    </div>
                    <div className="flex sm:flex-col justify-end gap-2">
                      <Link
                        href={`/track?order=${encodeURIComponent(order.order_number || order.id)}`}
                        onClick={onClose}
                        className="px-3 py-2 rounded-xl bg-[#2C2825] text-white text-xs font-bold flex items-center justify-center gap-1.5"
                      >
                        <Truck className="w-3.5 h-3.5" /> {t('nav_track')}
                      </Link>
                      <button
                        onClick={() => onReorder(order.items)}
                        className="px-3 py-2 rounded-xl bg-[#EAE2D7] text-[#2C2825] text-xs font-bold flex items-center justify-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> {t('reorder_btn')}
                      </button>
                      <button
                        onClick={() => setInvoiceOrder(order)}
                        className="px-3 py-2 rounded-xl border border-stone-300 text-stone-700 text-xs font-bold flex items-center justify-center gap-1.5"
                      >
                        <Printer className="w-3.5 h-3.5" /> {t('print_invoice')}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}