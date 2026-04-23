"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Plus, Settings2, History, FileOutput, FileText, LayoutDashboard } from "lucide-react";
import { exportToExcel, exportToPDF } from "@/lib/exportUtils";
import AddStockModal from "@/components/AddStockModal";
import MovementButtons from "@/components/MovementButtons";
import EditStockModal from "@/components/EditStockModal";
import ActivityLogList from "@/components/ActivityLogList";
import MetricCards from "@/components/MetricCards";
import DashboardCharts from "@/components/DashboardCharts";
import toast from "react-hot-toast";

import { Ingredient, AnalyticsData } from "@/types";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, token, isLoading: authLoading } = useAuth();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [refreshLogsKey, setRefreshLogsKey] = useState(() => Date.now());

  const fetchIngredients = useCallback(() => {
    if (!token) return;

    fetch("/api/ingredients", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (res.status === 401) {
          router.push("/login");
          return [];
        }
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setIngredients(data);
        }
      })
      .catch((err) => {
        console.error("Fetch ingredients error:", err);
      });
  }, [token, router]);

  const fetchAnalytics = useCallback(() => {
    if (!token) return;

    fetch("/api/analytics", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) {
          setAnalytics(data);
        }
      })
      .catch((err) => {
        console.error("Fetch analytics error:", err);
      });
  }, [token]);

  const loadData = useCallback(() => {
    setIsLoading(true);
    Promise.all([fetchIngredients(), fetchAnalytics()])
      .finally(() => setIsLoading(false));
  }, [fetchIngredients, fetchAnalytics]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (token) {
      loadData();
    }
    // We only want to load data when token changes or on initial mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const triggerRefresh = () => {
    loadData();
    setRefreshLogsKey(Date.now());
  };

  const handleExportExcel = () => {
    const exportData = ingredients.map(i => ({
      'Malzeme Adı': i.name,
      'Birim': i.unit,
      'Mevcut Stok': i.currentStock,
      'Min. Stok': i.minStockLevel,
      'Durum': i.currentStock <= i.minStockLevel ? 'Kritik' : 'Normal',
      'Kayıt Tarihi': new Date().toLocaleString('tr-TR')
    }));
    exportToExcel(exportData, `Stok_Durumu_${new Date().toISOString().split('T')[0]}`);
    toast.success("Excel dosyası indiriliyor...");
  };

  const handleExportPDF = async () => {
    const columns = [
      { header: 'Malzeme Adı', dataKey: 'name' },
      { header: 'Birim', dataKey: 'unit' },
      { header: 'Mevcut Stok', dataKey: 'currentStock' },
      { header: 'Min. Seviye', dataKey: 'minStockLevel' },
      { header: 'Durum', dataKey: 'status' }
    ];

    const exportData = ingredients.map(i => ({
      ...i,
      status: i.currentStock <= i.minStockLevel ? 'Kritik' : 'Normal'
    }));

    await exportToPDF(
      columns,
      exportData,
      `Stok_Durumu_${new Date().toISOString().split('T')[0]}`,
      "Mevcut Stok Durumu Raporu"
    );
    toast.success("PDF dosyası indiriliyor...");
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-500 font-medium">Dashboard Hazırlanıyor...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-[#fcfdff] text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Modals */}
      {isAddModalOpen && (
        <AddStockModal
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={triggerRefresh}
        />
      )}

      {editingIngredient && (
        <EditStockModal
          ingredient={editingIngredient}
          onClose={() => setEditingIngredient(null)}
          onSuccess={triggerRefresh}
        />
      )}

      <main className="max-w-7xl mx-auto p-6 lg:p-10">
        {/* Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 mb-2">
              <LayoutDashboard size={18} />
              <span className="text-sm font-bold tracking-wider uppercase">Genel Bakış</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-800">Hoş Geldiniz!</h1>
            <p className="text-slate-500 mt-1">Stoklarınızın ve tüketim verilerinizin gerçek zamanlı özeti.</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-emerald-50 text-emerald-700 rounded-2xl font-bold transition-all text-sm border border-slate-100 shadow-sm"
            >
              <FileOutput size={16} />
              Excel
            </button>
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-rose-50 text-rose-700 rounded-2xl font-bold transition-all text-sm border border-slate-100 shadow-sm"
            >
              <FileText size={16} />
              PDF
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-100 active:scale-95 text-sm"
            >
              <Plus size={18} />
              Yeni Ekle
            </button>
          </div>
        </div>

        {/* Metrics Section */}
        {analytics && <MetricCards data={analytics.summary} />}

        {/* Charts Section */}
        {analytics && (
          <DashboardCharts
            trendData={analytics.trend}
            distributionData={analytics.distribution}
          />
        )}

        {/* Table Area (Full Width) */}
        <div className="space-y-12">
          {/* Inventory Table */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                Envanter Listesi
                <span className="bg-slate-100 text-slate-500 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-tighter">
                  {ingredients.length} KALEM
                </span>
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-500 text-[11px] font-bold uppercase tracking-widest">
                    <th className="px-8 py-4">Malzeme</th>
                    <th className="px-8 py-4">Mevcut</th>
                    <th className="px-8 py-4">Durum</th>
                    <th className="px-8 py-4 text-right">Düzenle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {ingredients.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-8 py-20 text-center text-slate-400 italic">
                        Henüz veri girilmemiş.
                      </td>
                    </tr>
                  ) : (
                    ingredients.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/30 transition-colors group">
                        <td className="px-8 py-5">
                          <div>
                            <p className="font-bold text-slate-700">{item.name}</p>
                            <p className="text-[10px] font-bold text-slate-400 tracking-wider">BİRİM: {item.unit.toUpperCase()}</p>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <span className="font-mono font-black text-lg text-slate-600">{item.currentStock}</span>
                        </td>
                        <td className="px-8 py-5">
                          {item.currentStock <= item.minStockLevel ? (
                            <span className="inline-flex items-center px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-[10px] font-black uppercase tracking-wider border border-rose-100">
                              Kritik
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-wider border border-emerald-100">
                              Normal
                            </span>
                          )}
                        </td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <MovementButtons
                              ingredientId={item.id}
                              currentStock={item.currentStock}
                              onSuccess={triggerRefresh}
                            />
                            <button
                              onClick={() => setEditingIngredient(item)}
                              className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-transparent hover:border-indigo-100"
                            >
                              <Settings2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Activity Logs (Full Width Below) */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <History size={20} className="text-indigo-600" />
                Son İşlem Hareketleri
              </h2>
              <button
                onClick={() => router.push('/logs')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors tracking-tighter"
              >
                Tümünü Gör <LayoutDashboard size={14} />
              </button>
            </div>

            <ActivityLogList refreshTrigger={refreshLogsKey} limit={10} />
          </div>
        </div>
      </main>
    </div>
  );
}
