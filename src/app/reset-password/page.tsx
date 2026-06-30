'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { ArrowLeft, Eye, EyeOff, Lock } from 'lucide-react';
import { clientRequest } from '@/lib/clientApi';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = useMemo(() => searchParams.get('token') || '', [searchParams]);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!token) {
      toast.error('Gecersiz sifirlama baglantisi');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Sifreler uyusmuyor');
      return;
    }

    setIsSubmitting(true);

    try {
      await clientRequest(
        '/api/auth/reset-password',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, password }),
        },
        'Sifre yenilenemedi'
      );

      toast.success('Sifren yenilendi. Giris yapabilirsin.');
      router.push('/login');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sifre yenilenemedi';
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
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Yeni sifre belirle</h1>
          <p className="mt-2 text-sm text-slate-500">
            Yeni sifreni gir. Guclu ve daha once kullanmadigin bir sifre sec.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-bold text-slate-700">Yeni sifre</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 py-3 pl-10 pr-12 text-sm text-slate-800 outline-none transition-all focus:border-indigo-600 focus:bg-white"
                placeholder="Yeni sifren"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-bold text-slate-700">Sifre tekrar</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 py-3 pl-10 pr-12 text-sm text-slate-800 outline-none transition-all focus:border-indigo-600 focus:bg-white"
                placeholder="Sifreyi tekrar et"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((value) => !value)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700 disabled:bg-indigo-300"
          >
            {isSubmitting ? 'Yenileniyor...' : 'Sifreyi yenile'}
          </button>
        </form>
      </div>
    </div>
  );
}
