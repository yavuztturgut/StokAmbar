"use client";

import React, { useEffect, useState } from "react";
import { Package, AlertCircle, Plus, LayoutDashboard, Settings2, History } from "lucide-react";
import AddStockModal from "@/components/AddStockModal";
import MovementButtons from "@/components/MovementButtons";
import EditStockModal from "@/components/EditStockModal";
import ActivityLogList from "@/components/ActivityLogList";

interface Ingredient {
  id: string;
  name: string;
  unit: string;
  currentStock: number;
  minStockLevel: number;
}

export default function Home() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [refreshLogsKey, setRefreshLogsKey] = useState(Date.now());

  const fetchIngredients = () => {
    setIsLoading(true);
    fetch("/api/ingredients")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setIngredients(data);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        setIsLoading(false);
      });
  };

  const triggerRefresh = () => {
    fetchIngredients();
    setRefreshLogsKey(Date.now());
  };

  useEffect(() => {
    fetchIngredients();
  }, []);

  const lowStockCount = ingredients.filter(i => i.currentStock <= i.minStockLevel).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="bg-blue-50 p-4 rounded-xl text-blue-600">
              <Package size={28} />
            </div>
            <div>
              <p className="text-slate-500 text-sm font-medium">Toplam Kalem</p>
              <p className="text-3xl font-bold">{ingredients.length}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className={`p-4 rounded-xl ${lowStockCount > 0 ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'}`}>
              <AlertCircle size={28} />
            </div>
            <div>
              <p className="text-slate-500 text-sm font-medium">Kritik Stok</p>
              <p className={`text-3xl font-bold ${lowStockCount > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                {lowStockCount}
              </p>
            </div>
          </div>
        </div>

        {/* Stock Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex justify-between items-center">
            <h2 className="text-lg font-bold">Mevcut Stok Durumu</h2>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Son Güncelleme: Az Önce</div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-widest">
                  <th className="px-6 py-4">Malzeme Adı</th>
                  <th className="px-6 py-4">Birim</th>
                  <th className="px-6 py-4">Mevcut Stok</th>
                  <th className="px-6 py-4">Min. Seviye</th>
                  <th className="px-6 py-4">Durum</th>
                  <th className="px-6 py-4 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center text-slate-400 italic">
                      Yükleniyor...
                    </td>
                  </tr>
                ) : ingredients.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center text-slate-400 italic">
                      Henüz malzeme eklenmemiş.
                    </td>
                  </tr>
                ) : (
                  ingredients.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4 font-semibold text-slate-700">{item.name}</td>
                      <td className="px-6 py-4 text-slate-500">{item.unit}</td>
                      <td className="px-6 py-4">
                        <span className="font-mono font-bold text-slate-600">{item.currentStock}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-400">{item.minStockLevel}</td>
                      <td className="px-6 py-4">
                        {item.currentStock <= item.minStockLevel ? (
                          <span className="px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-xs font-bold flex items-center gap-1 w-fit border border-rose-100">
                            <AlertCircle size={12} /> Kritik
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold flex items-center gap-1 w-fit border border-emerald-100">
                            Normal
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <MovementButtons 
                            ingredientId={item.id} 
                            onSuccess={triggerRefresh} 
                          />
                          <button
                            onClick={() => setEditingIngredient(item)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                            title="Düzenle / Sil"
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

        {/* Activity Log Summary */}
        <div className="mt-12">
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <History size={20} className="text-indigo-600" />
            Son İşlemler Özeti
          </h2>
          <ActivityLogList refreshTrigger={refreshLogsKey} limit={5} />
        </div>
      </main>
    </div>
  );
}
