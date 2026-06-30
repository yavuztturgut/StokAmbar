"use client";

import React from "react";
import { Search, Filter, ArrowUpDown, RotateCcw } from "lucide-react";

type ActionFilter = "ALL" | "CREATE" | "UPDATE" | "DELETE" | "IN" | "OUT" | "WASTE" | "ADJUSTMENT";
type AmountDirection = "ALL" | "INCREASE" | "DECREASE";
type SortOrder = "newest" | "oldest";

interface LogsFiltersProps {
  search: string;
  actionFilter: ActionFilter;
  startDate: string;
  endDate: string;
  amountDirection: AmountDirection;
  sortOrder: SortOrder;
  pageSize: number;
  pageSizeOptions: number[];
  onSearchChange: (value: string) => void;
  onActionFilterChange: (value: ActionFilter) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onAmountDirectionChange: (value: AmountDirection) => void;
  onSortOrderChange: (value: SortOrder) => void;
  onPageSizeChange: (value: number) => void;
  onReset: () => void;
}

export default function LogsFilters({
  search,
  actionFilter,
  startDate,
  endDate,
  amountDirection,
  sortOrder,
  pageSize,
  pageSizeOptions,
  onSearchChange,
  onActionFilterChange,
  onStartDateChange,
  onEndDateChange,
  onAmountDirectionChange,
  onSortOrderChange,
  onPageSizeChange,
  onReset,
}: LogsFiltersProps) {
  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
      <div className="flex items-center gap-2 text-slate-600">
        <Filter size={18} />
        <span className="text-sm font-bold uppercase tracking-wide">Filtreler</span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-12 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-4">
          <div className="relative md:col-span-2 xl:col-span-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              placeholder="Malzeme adina gore ara..."
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white outline-none transition-all"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
            />
          </div>

          <div className="xl:col-span-3">
            <select
              className="w-full bg-slate-50 border border-slate-100 rounded-xl text-sm px-4 py-3 text-slate-800 font-medium outline-none focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all cursor-pointer"
              value={actionFilter}
              onChange={(event) => onActionFilterChange(event.target.value as ActionFilter)}
            >
              <option value="ALL">Tum islemler</option>
              <option value="CREATE">Olusturma</option>
              <option value="UPDATE">Guncelleme</option>
              <option value="DELETE">Silme</option>
              <option value="IN">Giris</option>
              <option value="OUT">Cikis</option>
              <option value="WASTE">Zayiat</option>
              <option value="ADJUSTMENT">Sayım duzeltmesi</option>
            </select>
          </div>

          <div className="xl:col-span-2">
            <input
              type="date"
              className="w-full bg-slate-50 border border-slate-100 rounded-xl text-sm px-4 py-3 text-slate-800 font-medium outline-none focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all"
              value={startDate}
              max={endDate || undefined}
              onChange={(event) => onStartDateChange(event.target.value)}
            />
          </div>

          <div className="xl:col-span-3">
            <input
              type="date"
              className="w-full bg-slate-50 border border-slate-100 rounded-xl text-sm px-4 py-3 text-slate-800 font-medium outline-none focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all"
              value={endDate}
              min={startDate || undefined}
              onChange={(event) => onEndDateChange(event.target.value)}
            />
          </div>
        </div>

        <div className="xl:col-span-12 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-4">
          <div className="xl:col-span-4">
            <select
              className="w-full bg-slate-50 border border-slate-100 rounded-xl text-sm px-4 py-3 text-slate-800 font-medium outline-none focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all cursor-pointer"
              value={amountDirection}
              onChange={(event) => onAmountDirectionChange(event.target.value as AmountDirection)}
            >
              <option value="ALL">Tum miktarlar</option>
              <option value="INCREASE">Artislar</option>
              <option value="DECREASE">Azalislar</option>
            </select>
          </div>

          <div className="xl:col-span-3">
            <div className="relative">
              <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <select
                className="w-full bg-slate-50 border border-slate-100 rounded-xl text-sm pl-10 pr-4 py-3 text-slate-800 font-medium outline-none focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all cursor-pointer"
                value={sortOrder}
                onChange={(event) => onSortOrderChange(event.target.value as SortOrder)}
              >
                <option value="newest">En yeni once</option>
                <option value="oldest">En eski once</option>
              </select>
            </div>
          </div>

          <div className="xl:col-span-3">
            <select
              className="w-full bg-slate-50 border border-slate-100 rounded-xl text-sm px-4 py-3 text-slate-800 font-medium outline-none focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all cursor-pointer"
              value={pageSize}
              onChange={(event) => onPageSizeChange(Number.parseInt(event.target.value, 10))}
            >
              {pageSizeOptions.map((option) => (
                <option key={option} value={option}>
                  Sayfa basi {option} kayit
                </option>
              ))}
            </select>
          </div>

          <div className="xl:col-span-2">
            <button
              onClick={onReset}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all"
            >
              <RotateCcw size={16} />
              Temizle
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
