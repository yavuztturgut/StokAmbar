"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { History, Search, Filter, ChevronLeft, ChevronRight, Download, PlusCircle, PencilLine, Trash2, ShieldCheck, Donut, ClipboardPlus, SquareArrowRight } from "lucide-react";

import { LogEntry } from "@/types";

export default function LogsPage() {
  const router = useRouter();
  const { isAuthenticated, token, isLoading: authLoading } = useAuth();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");

  // Auth kontrol
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, authLoading, router]);

  const fetchLogs = useCallback(async () => {
    if (!token) return;

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "15",
        search,
        action: actionFilter,
      });
      const response = await fetch(`/api/logs?${params.toString()}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.logs) {
        setLogs(data.logs);
        setTotalPages(data.totalPages);
        setTotalItems(data.total);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, actionFilter, token]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (token) {
        fetchLogs();
      }
    }, 300); // Debounce search
    return () => clearTimeout(timer);
  }, [fetchLogs, token]);

  const getActionIcon = (action: string) => {
    switch (action) {
      case "CREATE": return <PlusCircle className="text-emerald-500" size={16} />;
      case "UPDATE": return <PencilLine className="text-blue-500" size={16} />;
      case "DELETE": return <Trash2 className="text-rose-500" size={16} />;
      case "IN": return <ClipboardPlus className="text-emerald-500" size={16} />;
      case "OUT": return <SquareArrowRight className="text-amber-500" size={16} />;
      case "WASTE": return <Donut className="text-rose-500 font-bold" size={16} />;
      default: return <History size={16} />;
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case "CREATE": return "Oluşturma";
      case "UPDATE": return "Güncelleme";
      case "DELETE": return "Silme";
      case "IN": return "Stok Girişi";
      case "OUT": return "Stok Çıkışı";
      case "WASTE": return "Zayiat Kaydı";
      default: return action;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-100">
              <History size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">İşlem Geçmişi</h1>
              <p className="text-slate-500 text-sm">Sistemdeki tüm hareketleri buradan inceleyebilirsiniz</p>
            </div>
          </div>
          <p className="text-indigo-600 font-bold text-sm bg-indigo-50 px-4 py-2 rounded-full border border-indigo-100">
            Toplam {totalItems} Kayıt
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              placeholder="Malzeme adına göre ara..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white outline-none transition-all"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter size={18} className="text-slate-500" />
            <select
              className="bg-slate-50 border border-slate-100 rounded-xl text-sm px-4 py-2.5 text-slate-800 font-medium outline-none focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all cursor-pointer min-w-[160px]"
              value={actionFilter}
              onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
            >
              <option value="ALL">Tüm İşlemler</option>
              <option value="CREATE">Oluşturma</option>
              <option value="UPDATE">Güncelleme</option>
              <option value="DELETE">Silme</option>
              <option value="IN">Giriş</option>
              <option value="OUT">Çıkış</option>
              <option value="WASTE">Zayiat</option>
            </select>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden min-h-[500px]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-left">İşlem</th>
                  <th className="px-6 py-4 text-left">Malzeme</th>
                  <th className="px-6 py-4 text-left">Miktar</th>
                  <th className="px-6 py-4 text-left">Detay</th>
                  <th className="px-6 py-4 text-right">Tarih</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={5} className="px-6 py-4 h-12 bg-slate-50/50"></td>
                    </tr>
                  ))
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">Sonuç bulunamadı.</td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getActionIcon(log.action)}
                          <span className="font-semibold text-slate-700">{getActionLabel(log.action)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-600">{log.ingredientName}</td>
                      <td className="px-6 py-4">
                        {log.quantity !== null && log.quantity !== undefined ? (
                          <span className={`font-mono font-bold ${log.action === 'IN' || log.action === 'CREATE' ? 'text-emerald-600' : 'text-slate-600'}`}>
                            {log.action === 'IN' || log.action === 'CREATE' ? '+' : '-'}{log.quantity}
                          </span>
                        ) : "-"}
                      </td>
                      <td className="px-6 py-4 text-slate-400 italic text-xs">{log.details}</td>
                      <td className="px-6 py-4 text-right text-slate-400 text-xs">
                        {new Date(log.createdAt).toLocaleString("tr-TR")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <div className="text-sm text-slate-500">
            Sayfa <span className="font-bold text-slate-700">{page}</span> / {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || isLoading}
              className="p-2 border border-slate-100 rounded-lg hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || isLoading}
              className="p-2 border border-slate-100 rounded-lg hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
