'use client';

import React, { useState } from 'react';
import { X, Lock, Mail, User, Phone, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSubmit: (email: string, pass: string) => void;
  onAuthSuccess?: (user: any) => void;
  authError: string;
  t: (key: string) => string;
}

export default function AuthModal({
  isOpen,
  onClose,
  onAuthSubmit,
  onAuthSuccess,
  authError,
  t,
}: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [localError, setLocalError] = useState('');
  const [localSuccess, setLocalSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    setLocalSuccess('');

    if (mode === 'signin') {
      onAuthSubmit(email, password);
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              phone,
              role: 'customer',
            },
          },
        });
        if (error) {
          setLocalError(error.message);
        } else if (data.user) {
          await supabase.from('profiles').upsert([
            {
              id: data.user.id,
              email,
              full_name: fullName,
              phone,
              role: 'customer',
            },
          ]);
          setLocalSuccess('Account created successfully! You are now signed in.');
          if (onAuthSuccess) onAuthSuccess(data.user);
          setTimeout(() => onClose(), 900);
        }
      } else if (mode === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) setLocalError(error.message);
        else setLocalSuccess('Password reset instructions have been sent to your email.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl relative border border-[#EDE6DD]">
        <button
          onClick={onClose}
          className="absolute top-6 end-6 p-2 rounded-full hover:bg-stone-100 text-stone-500"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-[#EAE2D7] border border-[#DDD2C4] flex items-center justify-center mb-4">
          <span className="font-serif font-extrabold text-[#5A4D41] text-sm">RŌN</span>
        </div>

        <h3 className="text-2xl font-extrabold text-[#2C2825] mb-1">{t('auth_title')}</h3>
        <p className="text-xs text-stone-500 mb-6">{t('auth_desc')}</p>

        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-[#FAF7F2] rounded-2xl border border-[#EDE6DD] mb-6">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setLocalError('');
              setLocalSuccess('');
            }}
            className={`py-2 rounded-xl text-xs font-bold transition-all ${
              mode === 'signin' ? 'bg-[#2C2825] text-white shadow-sm' : 'text-stone-600'
            }`}
          >
            {t('sign_in')}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setLocalError('');
              setLocalSuccess('');
            }}
            className={`py-2 rounded-xl text-xs font-bold transition-all ${
              mode === 'signup' ? 'bg-[#2C2825] text-white shadow-sm' : 'text-stone-600'
            }`}
          >
            {t('sign_up')}
          </button>
        </div>

        {(authError || localError) && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium mb-4">
            {localError || authError}
          </div>
        )}

        {localSuccess && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{localSuccess}</span>
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-4">
          {mode === 'signup' && (
            <>
              <div>
                <label className="block text-xs font-bold text-stone-600 mb-1">
                  {t('full_name')}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-400 absolute top-1/2 -translate-y-1/2 start-3.5" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="w-full bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl ps-10 pe-4 py-3 text-sm"
                    placeholder="Abdullah Al-..."
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-600 mb-1">
                  {t('phone_label')}
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-stone-400 absolute top-1/2 -translate-y-1/2 start-3.5" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl ps-10 pe-4 py-3 text-sm"
                    placeholder="+966 5X XXX XXXX"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold text-stone-600 mb-1">
              {t('email_label')}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-stone-400 absolute top-1/2 -translate-y-1/2 start-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl ps-10 pe-4 py-3 text-sm"
                placeholder="you@ron.sa"
              />
            </div>
          </div>

          {mode !== 'reset' && (
            <div>
              <label className="block text-xs font-bold text-stone-600 mb-1">
                {t('password_label')}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute top-1/2 -translate-y-1/2 start-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-[#FAF7F2] border border-[#EDE6DD] rounded-xl ps-10 pe-4 py-3 text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#2C2825] text-white py-3.5 rounded-xl font-bold hover:bg-[#3E3834] transition-all shadow-md"
          >
            {mode === 'signin'
              ? t('sign_in')
              : mode === 'signup'
              ? t('sign_up')
              : t('reset_password')}
          </button>

          <div className="text-center pt-2">
            {mode !== 'reset' ? (
              <button
                type="button"
                onClick={() => setMode('reset')}
                className="text-xs text-[#C4A484] hover:underline font-semibold"
              >
                {t('forgot_password')}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setMode('signin')}
                className="text-xs text-stone-600 hover:underline font-semibold"
              >
                {t('sign_in')}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}