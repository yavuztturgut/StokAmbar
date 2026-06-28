"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Building2, Layers, LogOut, Settings } from "lucide-react";
import toast from "react-hot-toast";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, user, activeAccount, accounts, switchAccount, logout, isLoading } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  const navLinks = [
    { name: "Dashboard", href: "/" },
    { name: "Log", href: "/logs" },
  ];

  const handleLogout = () => {
    void logout();
    toast.success("Cikis yapildi");
    setIsProfileOpen(false);
    router.push("/login");
  };

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!profileMenuRef.current?.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const handleSwitchAccount = async (accountId: number) => {
    try {
      await switchAccount(accountId);
      setIsProfileOpen(false);
      router.refresh();
      toast.success("Sirket degistirildi");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Sirket degistirilemedi";
      toast.error(message);
    }
  };

  if (pathname === "/login" || pathname === "/register") {
    return null;
  }

  if (isLoading) {
    return (
      <header className="sticky top-0 z-50 border-b border-indigo-100/60 bg-[#fafbff] px-8 py-4 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="rounded-xl bg-indigo-600 p-2 text-white">
              <Layers size={22} />
            </div>
            <span className="text-xl font-black tracking-tighter text-slate-800">
              Stok<span className="text-indigo-600">Ambar</span>
            </span>
          </Link>
          <div className="text-sm text-slate-500">Yukleniyor...</div>
        </div>
      </header>
    );
  }

  if (!isAuthenticated) {
    return (
      <header className="sticky top-0 z-50 border-b border-indigo-100/60 bg-[#fafbff] px-8 py-4 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="rounded-xl bg-indigo-600 p-2 text-white">
              <Layers size={22} />
            </div>
            <span className="text-xl font-black tracking-tighter text-slate-800">
              Stok<span className="text-indigo-600">Ambar</span>
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="rounded-lg px-4 py-2 text-sm font-semibold text-blue-600 transition-colors hover:bg-blue-50">
              Giris Yap
            </Link>
            <Link href="/register" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700">
              Kayit Ol
            </Link>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 border-b border-indigo-100/60 bg-[#fafbff] px-8 py-4 shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <Link href="/" className="group flex items-center gap-3 transition-all">
          <div className="rounded-xl bg-indigo-600 p-2 text-white shadow-lg shadow-indigo-100 transition-transform group-hover:scale-110">
            <Layers size={22} />
          </div>
          <span className="text-xl font-black tracking-tighter text-slate-800">
            Stok<span className="text-indigo-600">Ambar</span>
          </span>
        </Link>

        <nav className="flex items-center gap-8">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative py-1 text-sm font-semibold transition-colors ${isActive ? "text-indigo-600" : "text-slate-500 hover:text-slate-800"}`}
              >
                {link.name}
                <span className={`absolute bottom-0 left-1/2 h-0.5 bg-indigo-600 transition-all duration-300 ${isActive ? "w-full -translate-x-1/2" : "w-0"}`} />
              </Link>
            );
          })}
        </nav>

        <div ref={profileMenuRef} className="relative">
          <button
            onClick={() => setIsProfileOpen((value) => !value)}
            className="flex items-center gap-3 rounded-lg px-4 py-2 transition-colors hover:bg-indigo-50"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
              {user?.username?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-xs text-slate-500">Hesap</p>
              <p className="text-sm font-semibold text-slate-800">{activeAccount?.name}</p>
            </div>
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 z-50 mt-2 w-72 rounded-xl border border-slate-100 bg-white py-2 shadow-lg">
              <div className="border-b border-slate-100 px-4 py-3">
                <p className="text-xs font-bold uppercase text-slate-500">Aktif Sirket</p>
                <p className="mt-1 text-sm font-semibold text-slate-800">{activeAccount?.name}</p>
                <p className="mt-1 text-xs text-slate-500">{activeAccount?.email}</p>
              </div>

              {accounts.length > 1 && (
                <div className="border-b border-slate-100 px-4 py-3">
                  <p className="mb-2 text-xs font-bold uppercase text-slate-500">Sirket Degistir</p>
                  <div className="space-y-2">
                    {accounts.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => void handleSwitchAccount(item.id)}
                        className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${activeAccount?.id === item.id ? "bg-indigo-50 font-semibold text-indigo-700" : "hover:bg-slate-50 text-slate-700"}`}
                      >
                        <Building2 size={15} />
                        <span>{item.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-b border-slate-100 px-4 py-3">
                <p className="text-xs font-bold uppercase text-slate-500">Kullanici</p>
                <p className="mt-1 text-sm font-semibold text-slate-800">@{user?.username}</p>
                <p className="mt-1 text-xs text-slate-500">{user?.email}</p>
              </div>

              <button
                onClick={() => router.push("/profile")}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                <Settings size={16} />
                Profil Ayarlari
              </button>

              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 border-t border-slate-100 px-4 py-2 text-left text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
              >
                <LogOut size={16} />
                Cikis Yap
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
