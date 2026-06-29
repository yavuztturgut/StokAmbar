"use client";

import React, { useEffect, useRef, useState } from "react";
import { Check, ClipboardPlus, Donut, SquareArrowRight, X } from "lucide-react";
import toast from "react-hot-toast";
import { clientRequest } from "@/lib/clientApi";

interface MovementButtonsProps {
  ingredientId: number;
  currentStock: number;
  onSuccess: () => void;
}

export default function MovementButtons({
  ingredientId,
  currentStock,
  onSuccess,
}: MovementButtonsProps) {
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
    const value = Number.parseFloat(quantity);
    if (Number.isNaN(value) || value <= 0 || !activeType) return;

    if ((activeType === "OUT" || activeType === "WASTE") && value > currentStock) {
      toast.error(`Yetersiz stok! Mevcut: ${currentStock}`, { id: "insufficient-stock" });
      return;
    }

    toast.dismiss();
    setIsSubmitting(true);

    try {
      await clientRequest(
        "/api/transactions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ingredientId,
            type: activeType,
            quantity: value,
            note: `${activeType} islemi`,
          }),
        },
        "Hata olustu."
      );

      toast.success(`${quantity} ${activeType === "IN" ? "Stok eklendi" : "Cikis yapildi"}`);
      onSuccess();
      setActiveType(null);
      setQuantity("");
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : "Hata olustu.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTheme = () => {
    switch (activeType) {
      case "IN":
        return "bg-emerald-600 ring-4 ring-emerald-100";
      case "OUT":
        return "bg-amber-600 ring-4 ring-amber-100";
      case "WASTE":
        return "bg-rose-600 ring-4 ring-rose-100";
      default:
        return "";
    }
  };

  return (
    <div className="relative flex items-center justify-end">
      {activeType && (
        <div className="absolute right-0 z-20 flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-xl animate-in slide-in-from-right-4 duration-200">
          <input
            ref={inputRef}
            type="number"
            placeholder="Miktar"
            className="w-20 border-none px-2 py-1.5 text-sm font-bold outline-none focus:ring-0"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleSubmit();
              if (e.key === "Escape") setActiveType(null);
            }}
          />
          <button
            onClick={() => void handleSubmit()}
            disabled={isSubmitting}
            className={`rounded-lg p-1.5 text-white transition-colors ${getTheme()}`}
          >
            <Check size={16} />
          </button>
          <button
            onClick={() => setActiveType(null)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div
        className={`flex gap-1.5 transition-opacity duration-200 ${
          activeType ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      >
        <button
          onClick={() => setActiveType("IN")}
          className="rounded-lg border border-emerald-100 bg-emerald-50 p-2 text-emerald-600 transition-all hover:bg-emerald-600 hover:text-white active:scale-90"
          title="Stok Girisi"
        >
          <ClipboardPlus size={18} />
        </button>
        <button
          onClick={() => setActiveType("OUT")}
          className="rounded-lg border border-amber-100 bg-amber-50 p-2 text-amber-600 transition-all hover:bg-amber-600 hover:text-white active:scale-90"
          title="Kullanim"
        >
          <SquareArrowRight size={18} />
        </button>
        <button
          onClick={() => setActiveType("WASTE")}
          className="rounded-lg border border-rose-200 bg-rose-100 p-2 text-rose-700 transition-all hover:bg-rose-600 hover:text-white active:scale-90"
          title="Zayiat Kaydi"
        >
          <Donut size={18} />
        </button>
      </div>
    </div>
  );
}
