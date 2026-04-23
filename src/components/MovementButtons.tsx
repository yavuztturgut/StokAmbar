"use client";

import React, { useState, useRef, useEffect } from "react";
import { Check, X, Donut, ClipboardPlus, SquareArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";

interface MovementButtonsProps {
  ingredientId: number;
  currentStock: number;
  onSuccess: () => void;
}

export default function MovementButtons({ ingredientId, currentStock, onSuccess }: MovementButtonsProps) {
  const { token } = useAuth();
  const [activeType, setActiveType] = useState<"IN" | "OUT" | "WASTE" | null>(null);
  const [quantity, setQuantity] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeType && inputRef.current) {
      inputRef.current.focus();
    }
  }, [activeType]);

  const handleSubmit = async () => {
    const val = parseFloat(quantity);
    if (isNaN(val) || val <= 0) return;

    // Check for negative stock
    if ((activeType === "OUT" || activeType === "WASTE") && val > currentStock) {
      toast.error(`Yetersiz stok! Mevcut: ${currentStock}`, { id: "insufficient-stock" });
      return;
    }

    toast.dismiss(); // Clear any existing toasts before starting a new request
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          ingredientId,
          type: activeType,
          quantity: val,
          note: `${activeType} işlemi`,
        }),
      });

      if (response.ok) {
        toast.success(`${quantity} ${activeType === 'IN' ? 'Stok eklendi' : 'Çıkış yapıldı'}`);
        onSuccess();
        setActiveType(null);
        setQuantity("");
      } else {
        const data = await response.json();
        toast.error(data.error || "Hata oluştu.");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTheme = () => {
    switch (activeType) {
      case "IN": return "bg-emerald-600 ring-emerald-100 ring-4";
      case "OUT": return "bg-amber-600 ring-amber-100 ring-4";
      case "WASTE": return "bg-rose-600 ring-rose-100 ring-4";
      default: return "";
    }
  };

  return (
    <div className="relative flex items-center justify-end">
      {/* Inline Input Panel */}
      {activeType && (
        <div className="absolute right-0 flex items-center bg-white border border-slate-200 rounded-xl shadow-xl p-1 gap-1 z-20 animate-in slide-in-from-right-4 duration-200">
          <input
            ref={inputRef}
            type="number"
            placeholder="Miktar"
            className="w-20 px-2 py-1.5 text-sm font-bold border-none focus:ring-0 outline-none"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
              if (e.key === "Escape") setActiveType(null);
            }}
          />
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`p-1.5 rounded-lg text-white transition-colors ${getTheme()}`}
          >
            <Check size={16} />
          </button>
          <button
            onClick={() => setActiveType(null)}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Buttons */}
      <div className={`flex gap-1.5 transition-opacity duration-200 ${activeType ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <button
          onClick={() => setActiveType("IN")}
          className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100 active:scale-90"
          title="Stok Girişi"
        >
          <ClipboardPlus size={18} />
        </button>
        <button
          onClick={() => setActiveType("OUT")}
          className="p-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-600 hover:text-white transition-all border border-amber-100 active:scale-90"
          title="Kullanım"
        >
          <SquareArrowRight size={18} />
        </button>
        <button
          onClick={() => setActiveType("WASTE")}
          className="p-2 bg-rose-100 text-rose-700 rounded-lg hover:bg-rose-600 hover:text-white transition-all border border-rose-200 active:scale-90"
          title="Zayiat Kaydı"
        >
          <Donut size={18} />
        </button>
      </div>
    </div>
  );
}
