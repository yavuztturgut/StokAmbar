'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { UserPlus, Package, ArrowRight, Eye, EyeOff, Building, Phone, Mail, User, Zap } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const slides = [
  {
    title: 'Isletmenizi Buyutmeye Baslayin',
    description: 'Hemen kayit olun ve stok yonetimi sureclerinizi dijitallestirerek zaman kazanin.',
    image: '/assets/images/login-carousel-1.png',
    icon: <UserPlus className="h-5 w-5" />,
  },
  {
    title: 'Kolay ve Hizli Entegrasyon',
    description: 'Kullanici dostu arayuz ve hizli kurulum ile saniyeler icinde kullanmaya baslayin.',
    image: '/assets/images/login-carousel-2.png',
    icon: <Zap className="h-5 w-5" />,
  },
];

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    accountName: '',
    accountEmail: '',
    phone: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const router = useRouter();
  const { register } = useAuth();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      if (formData.password !== formData.confirmPassword) {
        toast.error('Sifreler uyusmuyor');
        setIsLoading(false);
        return;
      }

      if (formData.password.length < 6) {
        toast.error('Sifre en az 6 karakter olmali');
        setIsLoading(false);
        return;
      }

      await register({
        email: formData.email,
        username: formData.username,
        password: formData.password,
        accountName: formData.accountName,
        accountEmail: formData.accountEmail,
        phone: formData.phone,
      });

      toast.success('Kayit basarili. Hos geldiniz.');
      router.push('/');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Kayit basarisiz');
    } finally {
      setIsLoading(false);
    }
  };

  const inputClassName = 'w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-2 text-sm text-slate-800 transition-all duration-200 placeholder:text-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-none';

  return (
    <div className="flex overflow-hidden bg-white font-sans selection:bg-indigo-100 xl:h-screen">
      <div className="flex w-full flex-col justify-center overflow-y-auto px-8 py-0 md:px-16 lg:w-[50%] lg:px-20">
        <div className="mx-auto w-full max-w-2xl pb-0">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-4 mt-0"
          >
            <div className="group mb-4 flex w-fit cursor-pointer items-center gap-2">
              <div className="rounded-lg bg-indigo-600 p-2 shadow-lg transition-transform duration-300 group-hover:rotate-12">
                <Package size={24} className="text-white" />
              </div>
              <span className="text-xl font-black tracking-tight text-slate-900">
                Stok<span className="text-indigo-600">Takip</span>
              </span>
            </div>

            <h1 className="mb-1 text-3xl font-extrabold tracking-tight text-slate-900">Yeni Hesap Olustur</h1>
            <p className="text-base font-medium text-slate-500">Sistemimizi kullanmaya baslamak icin bilgilerinizi girin.</p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-indigo-600">Kullanici Bilgileri</h3>
              <div className="grid grid-cols-1 gap-x-4 gap-y-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-bold text-slate-700">Email Adresiniz</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`${inputClassName} pl-10`}
                      placeholder="isim@sirket.com"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-bold text-slate-700">Kullanici Adi</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      className={`${inputClassName} pl-10`}
                      placeholder="kullaniciadi"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-bold text-slate-700">Sifre</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={inputClassName}
                      placeholder="........"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-indigo-600"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-bold text-slate-700">Sifre Tekrar</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={inputClassName}
                      placeholder="........"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((value) => !value)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-indigo-600"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="pt-1"
            >
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-indigo-600">Hesap Bilgileri</h3>
              <div className="grid grid-cols-1 gap-x-4 gap-y-3 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-bold text-slate-700">Isletme/Kisi Adi</label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      name="accountName"
                      value={formData.accountName}
                      onChange={handleChange}
                      className={`${inputClassName} pl-10`}
                      placeholder="ABC Gida Ltd."
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-bold text-slate-700">Hesap Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      name="accountEmail"
                      value={formData.accountEmail}
                      onChange={handleChange}
                      className={`${inputClassName} pl-10`}
                      placeholder="info@isletme.com"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-bold text-slate-700">
                    Telefon <span className="font-normal text-slate-400">(Istege bagli)</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className={`${inputClassName} pl-10`}
                      placeholder="+90 (555) 123 45 67"
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="pt-1"
            >
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className="group relative flex w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition-all duration-200 hover:bg-indigo-700 disabled:bg-indigo-300"
              >
                {isLoading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <>
                    Kayit Ol
                    <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </motion.button>
            </motion.div>
          </form>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-6 text-center text-sm font-medium text-slate-500"
          >
            Zaten hesabiniz var mi?{' '}
            <Link href="/login" className="border-b-2 border-indigo-100 px-0.5 font-bold text-indigo-600 transition-all hover:border-indigo-600 hover:text-indigo-700">
              Giris Yap
            </Link>
          </motion.p>
        </div>
      </div>

      <div className="sticky top-0 hidden h-screen items-center justify-center overflow-hidden bg-slate-50 p-12 lg:flex lg:w-[55%]">
        <div className="absolute right-0 top-0 h-[600px] w-[600px] translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-indigo-100/50 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-[600px] w-[600px] -translate-x-1/2 translate-y-1/2 animate-pulse rounded-full bg-purple-100/50 blur-3xl" style={{ animationDelay: '2s' }} />

        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            className="relative z-10 w-full max-w-lg px-8 text-center"
          >
            <div className="mb-6 flex justify-center">
              <div className="group relative">
                <div className="absolute inset-0 rounded-3xl bg-indigo-500 opacity-10 blur-3xl transition-opacity duration-500 group-hover:opacity-20" />
                <img
                  src={slides[currentSlide].image}
                  alt={slides[currentSlide].title}
                  className="relative aspect-square max-h-[350px] w-full rounded-3xl object-cover shadow-2xl"
                />
              </div>
            </div>

            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-white shadow-md shadow-indigo-100">
              {slides[currentSlide].icon}
              <span>Hos Geldiniz</span>
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
