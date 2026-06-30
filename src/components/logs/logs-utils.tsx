import React from "react";
import {
  History,
  PlusCircle,
  PencilLine,
  Trash2,
  Donut,
  ClipboardPlus,
  ArrowRightLeft,
  Scale,
} from "lucide-react";

export const getVisiblePages = (currentPage: number, totalPages: number) => {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 4, "...", totalPages] as const;
  }

  if (currentPage >= totalPages - 2) {
    return [1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages] as const;
  }

  return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages] as const;
};

export const getActionIcon = (action: string) => {
  switch (action) {
    case "CREATE":
      return <PlusCircle className="text-emerald-500" size={16} />;
    case "UPDATE":
      return <PencilLine className="text-blue-500" size={16} />;
    case "DELETE":
      return <Trash2 className="text-rose-500" size={16} />;
    case "IN":
      return <ClipboardPlus className="text-emerald-500" size={16} />;
    case "OUT":
      return <ArrowRightLeft className="text-amber-500" size={16} />;
    case "WASTE":
      return <Donut className="text-rose-500 font-bold" size={16} />;
    case "ADJUSTMENT":
      return <Scale className="text-violet-500" size={16} />;
    default:
      return <History size={16} />;
  }
};

export const getActionLabel = (action: string) => {
  switch (action) {
    case "CREATE":
      return "Stok Olusturma";
    case "UPDATE":
      return "Guncelleme";
    case "DELETE":
      return "Silme Islemi";
    case "IN":
      return "Stok Girisi";
    case "OUT":
      return "Stok Cikisi";
    case "WASTE":
      return "Zayiat Kaydi";
    case "ADJUSTMENT":
      return "Sayim Duzeltmesi";
    default:
      return action;
  }
};

export const getQuantityPresentation = (action: string, quantity?: number | null) => {
  if (quantity === null || quantity === undefined) {
    return { text: "-", tone: "text-slate-600" };
  }

  if (action === "ADJUSTMENT") {
    if (quantity > 0) {
      return { text: `+${quantity}`, tone: "text-emerald-600" };
    }

    if (quantity < 0) {
      return { text: `${quantity}`, tone: "text-rose-600" };
    }

    return { text: "0", tone: "text-slate-600" };
  }

  if (action === "IN" || action === "CREATE") {
    return { text: `+${quantity}`, tone: "text-emerald-600" };
  }

  return { text: `-${quantity}`, tone: "text-slate-600" };
};
