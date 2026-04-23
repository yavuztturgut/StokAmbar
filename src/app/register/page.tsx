'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { UserPlus, Package, ArrowRight, Eye, EyeOff, Building, Phone, Mail, User, Zap } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const slides = [
  {
    title: "İşletmenizi Büyütmeye Başlayın",
    description: "Hemen kayıt olun ve stok yönetimi süreçlerinizi dijitalleştirerek zaman kazanın.",
    image: "/assets/images/login-carousel-1.png",
    icon: <UserPlus className="w-5 h-5" />
  },
  {
    title: "Kolay ve Hızlı Entegrasyon",
    description: "Kullanıcı dostu arayüz ve hızlı kurulum ile saniyeler içinde kullanmaya başlayın.",
    image: "/assets/images/login-carousel-2.png",
    icon: <Zap className="w-5 h-5" />
  }
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (formData.password !== formData.confirmPassword) {
        toast.error('Şifreler uyuşmuyor');
        setIsLoading(false);
        return;
      }

      if (formData.password.length < 6) {
        toast.error('Şifre en az 6 karakter olmalı');
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

      toast.success('Kayıt başarılı! Hoş geldiniz');
      router.push('/');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Kayıt başarısız';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const inputClassName = "w-full px-4 py-2 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-indigo-600 focus:bg-white focus:outline-none transition-all duration-200 text-sm text-slate-800 placeholder:text-slate-400";

  return (
    <div className="flex xl:h-screen bg-white font-sans selection:bg-indigo-100 overflow-hidden">
      {/* Left Side: Form */}
      <div className="flex flex-col justify-center w-full px-8 py-0 lg:w-[50%] md:px-16 lg:px-20 overflow-y-auto">
        <div className="max-w-2xl w-full mx-auto pb-0">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-4 mt-0"
          >
            <div className="flex items-center gap-2 mb-4 group cursor-pointer w-fit">
              <div className="p-2 transition-transform duration-300 bg-indigo-600 rounded-lg shadow-lg group-hover:rotate-12">
                <Package size={24} className="text-white" />
              </div>
              <span className="text-xl font-black tracking-tight text-slate-900">Stok<span className="text-indigo-600">Takip</span></span>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-1">Yeni Hesap Oluştur</h1>
            <p className="text-base text-slate-500 font-medium">Sistemimizi kullanmaya başlamak için bilgilerinizi girin.</p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <h3 className="text-sm font-bold text-indigo-600 mb-3 uppercase tracking-wider">Kullanıcı Bilgileri</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
                <div>
                  <label className="block mb-1 text-sm font-bold text-slate-700">Email Adresiniz</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
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
                  <label className="block mb-1 text-sm font-bold text-slate-700">Kullanıcı Adı</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
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
                  <label className="block mb-1 text-sm font-bold text-slate-700">Şifre</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={inputClassName}
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute text-slate-400 right-3 top-1/2 -translate-y-1/2 hover:text-indigo-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block mb-1 text-sm font-bold text-slate-700">Şifre Tekrar</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={inputClassName}
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute text-slate-400 right-3 top-1/2 -translate-y-1/2 hover:text-indigo-600 transition-colors"
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
              <h3 className="text-sm font-bold text-indigo-600 mb-3 uppercase tracking-wider">Hesap Bilgileri</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
                <div className="md:col-span-2">
                  <label className="block mb-1 text-sm font-bold text-slate-700">İşletme/Kişi Adı</label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                      type="text"
                      name="accountName"
                      value={formData.accountName}
                      onChange={handleChange}
                      className={`${inputClassName} pl-10`}
                      placeholder="ABC Gıda Ltd."
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block mb-1 text-sm font-bold text-slate-700">Hesap Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
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
                  <label className="block mb-1 text-sm font-bold text-slate-700">Telefon <span className="text-slate-400 font-normal">(İsteğe bağlı)</span></label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
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
                className="relative w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all duration-200 overflow-hidden flex items-center justify-center gap-2 group cursor-pointer"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Kayıt Ol
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
            className="mt-6 text-center text-sm text-slate-500 font-medium"
          >
            Zaten hesabınız var mı?{' '}
            <Link href="/login" className="font-bold text-indigo-600 hover:text-indigo-700 border-b-2 border-indigo-100 hover:border-indigo-600 transition-all px-0.5">
              Giriş Yap
            </Link>
          </motion.p>
        </div>
      </div>

      {/* Right Side: Carousel */}
      <div className="hidden lg:flex lg:w-[55%] bg-slate-50 relative overflow-hidden items-center justify-center p-12 sticky top-0 h-screen">
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
            className="relative z-10 w-full max-w-lg px-8 text-center"
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
              <span>HOŞ GELDİNİZ</span>
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
