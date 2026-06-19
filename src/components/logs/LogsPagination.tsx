"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface LogsPaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  isLoading: boolean;
  visiblePages: readonly (number | "...")[] | (number | "...")[];
  onPageChange: (page: number) => void;
}

export default function LogsPagination({
  page,
  totalPages,
  totalItems,
  isLoading,
  visiblePages,
  onPageChange,
}: LogsPaginationProps) {
  return (
    <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-100">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="text-sm text-slate-500">
          Toplam <span className="font-bold text-slate-700">{totalItems}</span> kayit, sayfa{" "}
          <span className="font-bold text-slate-700">{page}</span> / {totalPages}
        </div>

        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page === 1 || isLoading}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 disabled:opacity-20 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
          >
            <ChevronLeft size={18} />
            Onceki
          </button>

          <div className="flex items-center gap-2">
            {visiblePages.map((item, index) =>
              item === "..." ? (
                <span key={`ellipsis-${index}`} className="px-2 text-slate-400">
                  ...
                </span>
              ) : (
                <button
                  key={item}
                  onClick={() => onPageChange(item)}
                  disabled={item === page}
                  className={`min-w-11 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border ${
                    item === page
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100"
                  }`}
                >
                  {item}
                </button>
              )
            )}
          </div>

          <button
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page === totalPages || isLoading}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 disabled:opacity-20 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
          >
            Sonraki
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="flex md:hidden items-center justify-between gap-3">
          <button
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page === 1 || isLoading}
            className="inline-flex items-center gap-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 disabled:opacity-20 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
          >
            <ChevronLeft size={18} />
            Onceki
          </button>

          <span className="text-sm font-bold text-slate-700">
            {page} / {totalPages}
          </span>

          <button
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page === totalPages || isLoading}
            className="inline-flex items-center gap-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 disabled:opacity-20 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
          >
            Sonraki
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
