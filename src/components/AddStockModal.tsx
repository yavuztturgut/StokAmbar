"use client";

import React, { useState } from "react";
import { Save, X } from "lucide-react";
import toast from "react-hot-toast";
import { clientRequest } from "@/lib/clientApi";

interface AddStockModalProps {
  onSuccess: () => void;
  onClose: () => void;
}

export default function AddStockModal({ onSuccess, onClose }: AddStockModalProps) {
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
      await clientRequest(
        "/api/ingredients",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        },
        "Ekleme sirasinda bir hata olustu."
      );

      toast.success(`${formData.name} basariyla eklendi!`);
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : "Sunucu hatasi.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm animate-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl animate-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 p-6">
          <h3 className="text-xl font-bold text-slate-800">Yeni Malzeme Ekle</h3>
          <button
            onClick={onClose}
            className="rounded-full border border-slate-100 bg-white p-1 text-slate-400 transition-colors hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Malzeme Adi</label>
            <input
              required
              type="text"
              placeholder="Orn: Domates, Un, Sut..."
              className="w-full rounded-xl border border-slate-200 px-4 py-2 transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Birim</label>
              <select
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
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
              <label className="mb-1 block text-sm font-semibold text-slate-700">Baslangic Stogu</label>
              <input
                type="number"
                step="0.01"
                className="w-full rounded-xl border border-slate-200 px-4 py-2 transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                value={formData.currentStock}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    currentStock: Number.parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Minimum Stok Seviyesi</label>
            <input
              type="number"
              step="0.01"
              placeholder="Kritik uyari seviyesi"
              className="w-full rounded-xl border border-slate-200 px-4 py-2 transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              value={formData.minStockLevel}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  minStockLevel: Number.parseFloat(e.target.value) || 0,
                })
              }
            />
            <p className="mt-1 text-xs text-slate-400">
              Stok bu degerin altina dustugunde sistem uyari verir.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 font-bold text-slate-600 transition-colors hover:bg-slate-50"
            >
              Vazgec
            </button>
            <button
              disabled={isSubmitting}
              type="submit"
              className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 font-bold text-white shadow-lg shadow-indigo-100 transition-all hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSubmitting ? "Ekleniyor..." : <><Save size={18} /> Kaydet</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
