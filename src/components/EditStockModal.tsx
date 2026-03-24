"use client";

import React, { useState, useEffect } from "react";
import { X, Save, Trash2 } from "lucide-react";

interface Ingredient {
  id: string;
  name: string;
  unit: string;
  currentStock: number;
  minStockLevel: number;
}

interface EditStockModalProps {
  ingredient: Ingredient;
  onSuccess: () => void;
  onClose: () => void;
}

export default function EditStockModal({ ingredient, onSuccess, onClose }: EditStockModalProps) {
  const [formData, setFormData] = useState({
    name: ingredient.name,
    unit: ingredient.unit,
    minStockLevel: ingredient.minStockLevel,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/ingredients/${ingredient.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`${ingredient.name} malzemesini ve tüm geçmiş hareketlerini silmek istediğinize emin misiniz?`)) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/ingredients/${ingredient.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-xl font-bold text-slate-800">Malzemeyi Düzenle</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Malzeme Adı</label>
            <input
              required
              type="text"
              className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 outline-none"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Birim</label>
              <select
                className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              >
                <option value="kg">kg</option>
                <option value="lt">lt</option>
                <option value="adet">adet</option>
                <option value="paket">paket</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Min. Stok</label>
              <input
                type="number"
                className="w-full px-4 py-2 rounded-xl border border-slate-200"
                value={formData.minStockLevel}
                onChange={(e) => setFormData({ ...formData, minStockLevel: parseFloat(e.target.value) })}
              />
            </div>
          </div>

          <div className="pt-6 flex flex-col gap-3">
            <button
              disabled={isSubmitting}
              type="submit"
              className="w-full px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-100"
            >
              <Save size={18} /> Güncelle
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleDelete}
              className="w-full px-6 py-3 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold transition-all flex items-center justify-center gap-2 border border-rose-100"
            >
              <Trash2 size={18} /> Malzemeyi Tamamen Sil
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
