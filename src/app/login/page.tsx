'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ArrowRight, Eye, EyeOff, Package, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';

const slides = [
  {
    title: 'Stoklarinizi Akillica Yonetin',
    description: 'Gercek zamanli envanter takibi ile isletmenizin verimliligini artirin.',
    image: '/assets/images/login-carousel-1.png',
    icon: <Package className="h-5 w-5" />,
  },
  {
    title: 'Guvenli ve Hizli Altyapi',
    description: 'Tum verileriniz ust duzey guvenlik standartlariyla korunur.',
    image: '/assets/images/login-carousel-2.png',
    icon: <ShieldCheck className="h-5 w-5" />,
  },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const router = useRouter();
  const { login, pendingSelection, selectCompany } = useAuth();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await login(email, password, rememberMe);

      if (result && result.requiresCompanySelection) {
        toast.success('Giris dogrulandi. Sirket secimi yapin.');
      } else {
        toast.success('Giris basarili. Hos geldiniz.');
        router.push('/');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Giris yapilamadi.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectCompany = async (accountId: number) => {
    setIsSubmitting(true);
    try {
      await selectCompany(accountId);
      toast.success('Sirket secildi.');
      router.push('/');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sirket secilemedi.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-white font-sans selection:bg-indigo-100">
      <div className="flex w-full flex-col justify-center px-8 py-8 md:px-16 lg:w-[35%] lg:px-20 xl:px-24">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="group mb-4 flex w-fit cursor-pointer items-center gap-2">
            <div className="rounded-lg bg-indigo-600 p-2 shadow-lg transition-transform duration-300 group-hover:rotate-12">
              <Package size={24} className="text-white" />
            </div>
            <span className="text-xl font-black tracking-tight text-slate-900">
              Stok<span className="text-indigo-600">Takip</span>
            </span>
          </div>

          <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-slate-900">
            {pendingSelection ? 'Sirket Secin' : 'Tekrar Hos Geldiniz'}
          </h1>
          <p className="text-base font-medium text-slate-500">
            {pendingSelection
              ? 'Bu kullaniciya bagli sirketlerden birini secerek devam edin.'
              : 'Hesabiniza erismek icin bilgilerinizi girin.'}
          </p>
        </motion.div>

        {pendingSelection ? (
          <div className="space-y-3">
            {pendingSelection.accounts.map((item) => (
              <button
                key={item.id}
                type="button"
                disabled={isSubmitting}
                onClick={() => void handleSelectCompany(item.id)}
                className="w-full rounded-2xl border-2 border-slate-100 bg-white px-4 py-4 text-left transition hover:border-indigo-200 hover:bg-indigo-50/50 disabled:opacity-60"
              >
                <p className="font-bold text-slate-800">{item.name}</p>
                <p className="mt-1 text-sm text-slate-500">{item.email}</p>
                {item.phone && <p className="mt-1 text-xs text-slate-400">{item.phone}</p>}
              </button>
            ))}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-bold text-slate-700">Email Adresiniz</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 transition-all duration-200 placeholder:text-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-none"
                placeholder="isim@sirket.com"
                required
              />
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="text-sm font-bold text-slate-700">Sifreniz</label>
                <Link href="/forgot-password" className="px-1 text-xs font-bold text-indigo-600 hover:text-indigo-700">
                  Sifremi Unuttum
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 transition-all duration-200 placeholder:text-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-none"
                  placeholder="........"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-indigo-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 accent-indigo-600 focus:ring-indigo-600"
              />
              <label htmlFor="remember" className="cursor-pointer text-sm font-medium text-slate-500">
                30 gun boyunca beni hatirla
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition-all duration-200 hover:bg-indigo-700 disabled:bg-indigo-300"
            >
              {isSubmitting ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  Giris Yap
                  <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>
        )}

        <p className="mt-8 text-center text-sm font-medium text-slate-500">
          Hesabiniz yok mu?{' '}
          <Link href="/register" className="border-b-2 border-indigo-100 px-0.5 font-bold text-indigo-600 transition-all hover:border-indigo-600 hover:text-indigo-700">
            Hemen Kayit Ol
          </Link>
        </p>
      </div>

      <div className="relative hidden items-center justify-center overflow-hidden bg-slate-50 p-12 lg:flex lg:w-[65%]">
        <div className="absolute right-0 top-0 h-[600px] w-[600px] translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-indigo-100/50 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-[600px] w-[600px] -translate-x-1/2 translate-y-1/2 animate-pulse rounded-full bg-purple-100/50 blur-3xl" style={{ animationDelay: '2s' }} />

        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            className="relative z-10 w-full max-w-lg px-12 text-center"
          >
            <div className="mb-6 flex justify-center">
              <div className="group relative">
                <div className="absolute inset-0 rounded-3xl bg-indigo-500 opacity-10 blur-3xl transition-opacity duration-500 group-hover:opacity-20" />
                <img src={slides[currentSlide].image} alt={slides[currentSlide].title} className="relative aspect-square max-h-[350px] w-full rounded-3xl object-cover shadow-2xl" />
              </div>
            </div>

            <h2 className="mb-3 text-3xl font-black leading-tight tracking-tight text-slate-900">{slides[currentSlide].title}</h2>
            <p className="mb-8 text-base font-medium leading-relaxed text-slate-500">{slides[currentSlide].description}</p>

            <div className="flex justify-center gap-3">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-2 cursor-pointer rounded-full transition-all duration-300 ${idx === currentSlide ? 'w-10 bg-indigo-600' : 'w-2 bg-indigo-200 hover:bg-indigo-300'}`}
                />
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
