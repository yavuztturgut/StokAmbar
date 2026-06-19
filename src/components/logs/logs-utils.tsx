import React from "react";
import {
  History,
  PlusCircle,
  PencilLine,
  Trash2,
  Donut,
  ClipboardPlus,
  SquareArrowRight,
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
      return <SquareArrowRight className="text-amber-500" size={16} />;
    case "WASTE":
      return <Donut className="text-rose-500 font-bold" size={16} />;
    default:
      return <History size={16} />;
  }
};

export const getActionLabel = (action: string) => {
  switch (action) {
    case "CREATE":
      return "Olusturma";
    case "UPDATE":
      return "Guncelleme";
    case "DELETE":
      return "Silme";
    case "IN":
      return "Stok Girisi";
    case "OUT":
      return "Stok Cikisi";
    case "WASTE":
      return "Zayiat Kaydi";
    default:
      return action;
  }
};
