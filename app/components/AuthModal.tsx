import React, { useState } from 'react';
import { X } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSubmit: (email: string, pass: string) => void;
  authError: string;
  t: (key: string) => string;
}

export default function AuthModal({ isOpen, onClose, onAuthSubmit, authError, t }: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-6 right-6 p-2"><X className="w-5 h-5" /></button>
        <h3 className="text-2xl font-bold mb-2">{t('auth_title')}</h3>
        <p className="text-xs text-stone-500 mb-6">{t('auth_desc')}</p>
        
        {authError && <p className="text-xs text-red-600 mb-4">{authError}</p>}
        
        <form onSubmit={(e) => { e.preventDefault(); onAuthSubmit(email, password); }} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-stone-500 mb-1">{t('email_label')}</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-stone-50 border rounded-xl px-4 py-3 text-sm" placeholder="staff@ron.com" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-stone-500 mb-1">{t('password_label')}</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-stone-50 border rounded-xl px-4 py-3 text-sm" placeholder="••••••••" />
          </div>
          <button type="submit" className="w-full bg-amber-900 text-white py-3.5 rounded-xl font-bold hover:bg-amber-800 transition-all">
            {t('sign_in')}
          </button>
        </form>
      </div>
    </div>
  );
}