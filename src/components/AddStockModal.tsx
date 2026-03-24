"use client";

import React, { useState } from "react";
import { X, Plus, Save } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";

interface AddStockModalProps {
  onSuccess: () => void;
  onClose: () => void;
}

export default function AddStockModal({ onSuccess, onClose }: AddStockModalProps) {
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    unit: "kg",
    currentStock: 0,
    minStockLevel: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    toast.dismiss();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/ingredients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(`${formData.name} başarıyla eklendi!`);
        onSuccess();
        onClose();
      } else {
        toast.error("Ekleme sırasında bir hata oluştu.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Sunucu hatası.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-modal-overlay"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-xl font-bold text-slate-800">Yeni Malzeme Ekle</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors bg-white p-1 rounded-full border border-slate-100">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Malzeme Adı</label>
            <input
              required
              type="text"
              placeholder="Örn: Domates, Un, Süt..."
              className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Birim</label>
              <select
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              >
                <option value="kg">Kilogram (kg)</option>
                <option value="lt">Litre (lt)</option>
                <option value="adet">Adet</option>
                <option value="paket">Paket</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Başlangıç Stoğu</label>
              <input
                type="number"
                step="0.01"
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                value={formData.currentStock}
                onChange={(e) => setFormData({ ...formData, currentStock: parseFloat(e.target.value) })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Minimum Stok Seviyesi</label>
            <input
              type="number"
              step="0.01"
              placeholder="Kritik uyarı seviyesi"
              className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              value={formData.minStockLevel}
              onChange={(e) => setFormData({ ...formData, minStockLevel: parseFloat(e.target.value) })}
            />
            <p className="mt-1 text-xs text-slate-400">Stok bu değerin altına düştüğünde sistem uyarı verir.</p>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Vazgeç
            </button>
            <button
              disabled={isSubmitting}
              type="submit"
              className="flex-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? "Ekleniyor..." : <><Save size={18} /> Kaydet</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
