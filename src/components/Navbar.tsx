"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Layers, LogOut, Settings, LogIn } from "lucide-react";
import toast from "react-hot-toast";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, user, account, logout, isLoading } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const navLinks = [
    { name: "Dashboard", href: "/" },
    { name: "Log", href: "/logs" },
  ];

  const handleLogout = () => {
    logout();
    toast.success("Çıkış yapıldı");
    setIsProfileOpen(false);
    router.push("/login");
  };

  // Login/Register sayfalarında navbar gösterme
  if (pathname === "/login" || pathname === "/register") {
    return null;
  }

  // Loading durumunda
  if (isLoading) {
    return (
      <header className="bg-[#fafbff] border-b border-indigo-100/60 px-8 py-4 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl text-white">
              <Layers size={22} />
            </div>
            <span className="text-xl font-black tracking-tighter text-slate-800">
              Stok<span className="text-indigo-600">Ambar</span>
            </span>
          </Link>
          <div className="text-sm text-slate-500">Yükleniyor...</div>
        </div>
      </header>
    );
  }

  // Authenticate edilmemişse login sayfasına yönlendir
  if (!isAuthenticated) {
    return (
      <header className="bg-[#fafbff] border-b border-indigo-100/60 px-8 py-4 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl text-white">
              <Layers size={22} />
            </div>
            <span className="text-xl font-black tracking-tighter text-slate-800">
              Stok<span className="text-indigo-600">Ambar</span>
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              Giriş Yap
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Kayıt Ol
            </Link>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-[#fafbff] border-b border-indigo-100/60 px-8 py-4 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group transition-all">
          <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-100 group-hover:scale-110 transition-transform">
            <Layers size={22} />
          </div>
          <span className="text-xl font-black tracking-tighter text-slate-800">
            Stok<span className="text-indigo-600">Ambar</span>
          </span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-8">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative py-1 text-sm font-semibold transition-colors ${
                  isActive ? "text-indigo-600" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {link.name}
                <span
                  className={`absolute bottom-0 left-1/2 h-0.5 bg-indigo-600 transition-all duration-300 ${
                    isActive ? "w-full -translate-x-1/2" : "w-0"
                  }`}
                />
              </Link>
            );
          })}
        </nav>

        {/* Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-indigo-50 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600">
              {user?.username?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs text-slate-500">Hesap</p>
              <p className="text-sm font-semibold text-slate-800">{account?.name}</p>
            </div>
          </button>

          {/* Dropdown Menu */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-100 py-2 z-50">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-xs text-slate-500 uppercase font-bold">Hesap</p>
                <p className="text-sm font-semibold text-slate-800 mt-1">{account?.name}</p>
                <p className="text-xs text-slate-500 mt-1">{account?.email}</p>
              </div>

              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-xs text-slate-500 uppercase font-bold">Kullanıcı</p>
                <p className="text-sm font-semibold text-slate-800 mt-1">@{user?.username}</p>
                <p className="text-xs text-slate-500 mt-1">{user?.email}</p>
              </div>

              <button
                onClick={() => router.push("/profile")}
                className="w-full text-left px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
              >
                <Settings size={16} />
                Profil Ayarları
              </button>

              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors border-t border-slate-100"
              >
                <LogOut size={16} />
                Çıkış Yap
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
