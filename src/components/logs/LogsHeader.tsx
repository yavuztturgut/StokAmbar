"use client";

import React from "react";
import { History, FileOutput, FileText } from "lucide-react";

interface LogsHeaderProps {
  totalItems: number;
  isExporting: boolean;
  canExport: boolean;
  onExport: (type: "excel" | "pdf") => void;
}

export default function LogsHeader({
  totalItems,
  isExporting,
  canExport,
  onExport,
}: LogsHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-100">
          <History size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Islem Gecmisi</h1>
          <p className="text-slate-500 text-sm">
            Sistemdeki tum hareketleri buradan inceleyebilirsiniz
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
        <button
          onClick={() => onExport("excel")}
          disabled={isExporting || !canExport}
          className="flex items-center gap-2 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl font-bold transition-all text-xs border border-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FileOutput size={14} />
          Excel
        </button>
        <button
          onClick={() => onExport("pdf")}
          disabled={isExporting || !canExport}
          className="flex items-center gap-2 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl font-bold transition-all text-xs border border-rose-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FileText size={14} />
          PDF
        </button>
        <div className="w-px h-6 bg-slate-200 mx-1 hidden sm:block"></div>
        <p className="text-indigo-600 font-bold text-sm bg-indigo-50 px-4 py-2 rounded-full border border-indigo-100 whitespace-nowrap">
          Toplam {totalItems} Kayit
        </p>
      </div>
    </div>
  );
}
