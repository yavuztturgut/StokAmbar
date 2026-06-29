"use client";

import React, { useState } from "react";
import { Save, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import { clientRequest } from "@/lib/clientApi";
import { Ingredient } from "@/types";
import ConfirmModal from "./ConfirmModal";

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
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    toast.dismiss();
    setIsSubmitting(true);

    try {
      await clientRequest(
        `/api/ingredients/${ingredient.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        },
        "Guncelleme sirasinda bir hata olustu"
      );

      toast.success("Malzeme guncellendi");
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : "Guncelleme sirasinda bir hata olustu";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    toast.dismiss();
    setIsSubmitting(true);

    try {
      await clientRequest(
        `/api/ingredients/${ingredient.id}`,
        {
          method: "DELETE",
        },
        "Silme islemi basarisiz oldu"
      );

      toast.success("Malzeme basariyla silindi");
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : "Silme islemi basarisiz oldu";
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
          <h3 className="text-xl font-bold text-slate-800">Malzemeyi Duzenle</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Malzeme Adi</label>
            <input
              required
              type="text"
              className="w-full rounded-xl border border-slate-200 px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500/20"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Birim</label>
              <select
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2"
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
              <label className="mb-1 block text-sm font-semibold text-slate-700">Min. Stok</label>
              <input
                type="number"
                className="w-full rounded-xl border border-slate-200 px-4 py-2"
                value={formData.minStockLevel}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    minStockLevel: Number.parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-6">
            <button
              disabled={isSubmitting}
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-bold text-white shadow-lg shadow-indigo-100 transition-all hover:bg-indigo-700"
            >
              <Save size={18} /> Guncelle
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setIsDeleteModalOpen(true)}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-rose-100 bg-rose-50 px-6 py-3 font-bold text-rose-600 transition-all hover:bg-rose-100"
            >
              <Trash2 size={18} /> Malzemeyi Tamamen Sil
            </button>
          </div>
        </form>
      </div>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Malzemeyi Sil?"
        message={`${ingredient.name} malzemesini ve buna bagli tum stok hareketlerini kalici olarak silmek istediginize emin misiniz? Bu islem geri alinamaz.`}
        confirmLabel="Kalici Olarak Sil"
        isDanger={true}
      />
    </div>
  );
}
