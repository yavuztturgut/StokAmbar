'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { ArrowLeft, Mail } from 'lucide-react';
import { clientRequest } from '@/lib/clientApi';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await clientRequest<{ message: string }>(
        '/api/auth/forgot-password',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        },
        'Sifre sifirlama istegi gonderilemedi'
      );

      toast.success(result.message);
      setEmail('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sifre sifirlama istegi gonderilemedi';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-8 shadow-xl shadow-slate-100">
        <Link href="/login" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700">
          <ArrowLeft size={16} />
          Girise don
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Sifreni yenile</h1>
          <p className="mt-2 text-sm text-slate-500">
            Hesabina bagli e-posta adresini gir. Gecerliyse sana sifre sifirlama baglantisi yollariz.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-bold text-slate-700">E-posta</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-800 outline-none transition-all focus:border-indigo-600 focus:bg-white"
                placeholder="isim@sirket.com"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700 disabled:bg-indigo-300"
          >
            {isSubmitting ? 'Gonderiliyor...' : 'Baglanti gonder'}
          </button>
        </form>
      </div>
    </div>
  );
}
