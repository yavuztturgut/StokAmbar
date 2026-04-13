"use client";

import React from "react";
import { Package, AlertCircle, Trash2, TrendingUp } from "lucide-react";

interface SummaryData {
  totalItems: number;
  criticalCount: number;
  normalCount: number;
  topMovingItem: string;
}

export default function MetricCards({ data }: { data: SummaryData }) {
  const cards = [
    {
      title: "Toplam Kalem",
      value: data.totalItems,
      icon: <Package size={24} />,
      color: "bg-blue-50 text-blue-600",
      description: "Sistemde kayıtlı toplam malzeme"
    },
    {
      title: "Kritik Stok",
      value: data.criticalCount,
      icon: <AlertCircle size={24} />,
      color: data.criticalCount > 0 ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600",
      description: "Minimum seviyenin altındakiler"
    },
    {
      title: "En Hareketli",
      value: data.topMovingItem,
      icon: <TrendingUp size={24} />,
      color: "bg-amber-50 text-amber-600",
      description: "Son 30 günde en çok kullanılan"
    },
    {
      title: "Durum",
      value: data.criticalCount === 0 ? "Güvenli" : "Dikkat",
      icon: <Trash2 size={24} />,
      color: data.criticalCount === 0 ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-orange-600",
      description: "Genel envanter sağlık durumu"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card, i) => (
        <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-all group overflow-hidden relative">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1">{card.title}</p>
              <h3 className="text-2xl font-black text-slate-800 truncate max-w-[150px]">{card.value}</h3>
              <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">{card.description}</p>
            </div>
            <div className={`p-3 rounded-2xl ${card.color} group-hover:scale-110 transition-transform`}>
              {card.icon}
            </div>
          </div>
          {/* Subtle background decoration */}
          <div className={`absolute -right-4 -bottom-4 w-20 h-20 opacity-[0.03] ${card.color.split(' ')[1]}`}>
            {card.icon}
          </div>
        </div>
      ))}
    </div>
  );
}
