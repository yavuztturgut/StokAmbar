'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Package, ShieldCheck, ArrowRight, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const slides = [
  {
    title: "Stoklarınızı Akıllıca Yönetin",
    description: "Gerçek zamanlı envanter takibi ile işletmenizin verimliliğini artırın.",
    image: "/assets/images/login-carousel-1.png",
    icon: <Package className="w-5 h-5" />
  },
  {
    title: "Güvenli ve Hızlı Altyapı",
    description: "Tüm verileriniz en üst düzey güvenlik standartlarıyla korunur.",
    image: "/assets/images/login-carousel-2.png",
    icon: <ShieldCheck className="w-5 h-5" />
  }
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const router = useRouter();
  const { login } = useAuth();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password, rememberMe);
      toast.success('Giriş başarılı! Hoş geldiniz.');
      router.push('/');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Giriş yapılamadı, lütfen bilgilerinizi kontrol edin.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-white font-sans selection:bg-indigo-100 overflow-hidden">
      {/* Left Side: Form */}
      <div className="flex flex-col justify-center w-full px-8 py-8 lg:w-[35%] md:px-16 lg:px-20 xl:px-24">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-4 group cursor-pointer w-fit">
            <div className="p-2 transition-transform duration-300 bg-indigo-600 rounded-lg shadow-lg group-hover:rotate-12">
              <Package size={24} className="text-white" />
            </div>
            <span className="text-xl font-black tracking-tight text-slate-900">Stok<span className="text-indigo-600">Takip</span></span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-2">Tekrar Hoş Geldiniz</h1>
          <p className="text-base text-slate-500 font-medium">Hesabınıza erişmek için bilgilerinizi girin.</p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <label className="block mb-1 text-sm font-bold text-slate-700">Email Adresiniz</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-indigo-600 focus:bg-white focus:outline-none transition-all duration-200 text-sm text-slate-800 placeholder:text-slate-400"
              placeholder="isim@sirket.com"
              required
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-bold text-slate-700">Şifreniz</label>
              <Link href="/forgot-password" className="px-1 text-xs font-bold text-indigo-600 hover:text-indigo-700">
                Şifremi Unuttum
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-indigo-600 focus:bg-white focus:outline-none transition-all duration-200 text-sm text-slate-800 placeholder:text-slate-400"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute text-slate-400 right-4 top-1/2 -translate-y-1/2 hover:text-indigo-600 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </motion.div>

          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <input
              type="checkbox"
              id="remember"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-600 accent-indigo-600"
            />
            <label htmlFor="remember" className="text-sm font-medium text-slate-500 cursor-pointer">30 gün boyunca beni hatırla</label>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <button
              type="submit"
              disabled={isLoading}
              className="relative w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all duration-200 overflow-hidden flex items-center justify-center gap-2 group cursor-pointer"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Giriş Yap
                  <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <button
              type="button"
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white border-2 border-slate-100 rounded-xl hover:bg-slate-50 hover:border-slate-200 transition-all duration-200 text-sm font-bold text-slate-700 cursor-pointer"
            >
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="h-5 w-5" alt="Google logo" />
              Google ile Giriş Yap
            </button>
          </motion.div>
        </form>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-8 text-center text-sm text-slate-500 font-medium"
        >
          Hesabınız yok mu?{' '}
          <Link href="/register" className="font-bold text-indigo-600 hover:text-indigo-700 border-b-2 border-indigo-100 hover:border-indigo-600 transition-all px-0.5">
            Hemen Kayıt Ol
          </Link>
        </motion.p>
      </div>

      {/* Right Side: Carousel */}
      <div className="hidden lg:flex lg:w-[65%] bg-slate-50 relative overflow-hidden items-center justify-center p-12">
        {/* Animated blobs background */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[600px] h-[600px] bg-indigo-100/50 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-purple-100/50 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />

        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="relative z-10 w-full max-w-lg px-12 text-center"
          >
            <div className="mb-6 flex justify-center">
              <div className="relative group">
                <div className="absolute inset-0 bg-indigo-500 rounded-3xl blur-3xl opacity-10 group-hover:opacity-20 transition-opacity duration-500" />
                <img
                  src={slides[currentSlide].image}
                  alt={slides[currentSlide].title}
                  className="relative rounded-3xl shadow-2xl object-cover w-full aspect-square max-h-[350px]"
                />
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-600 text-white rounded-full text-[10px] font-black tracking-widest mb-4 shadow-md shadow-indigo-100 uppercase">
              {slides[currentSlide].icon}
              <span>ÖZELLİK {currentSlide + 1}</span>
            </div>

            <h2 className="text-3xl font-black text-slate-900 mb-3 tracking-tight leading-tight">{slides[currentSlide].title}</h2>
            <p className="text-base text-slate-500 leading-relaxed mb-8 font-medium">{slides[currentSlide].description}</p>

            <div className="flex justify-center gap-3">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${idx === currentSlide ? 'w-10 bg-indigo-600' : 'w-2 bg-indigo-200 hover:bg-indigo-300'}`}
                />
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

    </div>
  );
}
