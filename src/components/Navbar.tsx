"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Layers } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { name: "Dashboard", href: "/" },
    { name: "Log", href: "/logs" },
  ];

  return (
    <header className="bg-white border-b border-slate-200 px-8 py-4 sticky top-0 z-50 backdrop-blur-md bg-white/80">
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
                {/* Animated Underline */}
                <span 
                  className={`absolute bottom-0 left-0 h-0.5 bg-indigo-600 transition-all duration-300 ${
                    isActive ? "w-full" : "w-0 group-hover:w-full"
                  }`}
                  style={{ left: '50%', transform: 'translateX(-50%)' }}
                />
                {/* Hover logic is better with a group class on the Link if needed, 
                    but for simple CSS hover:
                */}
                <style jsx>{`
                  a:hover span {
                    width: 100%;
                  }
                `}</style>
              </Link>
            );
          })}
        </nav>

        {/* Profile/Actions Placeholder */}
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-400">
            YY
          </div>
        </div>
      </div>
    </header>
  );
}
