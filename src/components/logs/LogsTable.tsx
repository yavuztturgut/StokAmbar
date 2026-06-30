"use client";

import React from "react";
import { LogEntry } from "@/types";
import { getActionIcon, getActionLabel, getQuantityPresentation } from "./logs-utils";

interface LogsTableProps {
  logs: LogEntry[];
  isLoading: boolean;
  pageSize: number;
  hasActiveFilters: boolean;
}

export default function LogsTable({
  logs,
  isLoading,
  pageSize,
  hasActiveFilters,
}: LogsTableProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden min-h-[500px]">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-left">Islem</th>
              <th className="px-6 py-4 text-left">Malzeme</th>
              <th className="px-6 py-4 text-left">Miktar</th>
              <th className="px-6 py-4 text-left">Detay</th>
              <th className="px-6 py-4 text-right">Tarih</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {isLoading ? (
              Array.from({ length: pageSize }).map((_, index) => (
                <tr key={index} className="animate-pulse">
                  <td colSpan={5} className="px-6 py-4 h-12 bg-slate-50/50"></td>
                </tr>
              ))
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                  {hasActiveFilters
                    ? "Filtrelere uygun kayit bulunamadi."
                    : "Henuz islem kaydi bulunmuyor."}
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const quantityView = getQuantityPresentation(log.action, log.quantity);

                return (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getActionIcon(log.action)}
                        <span className="font-semibold text-slate-700">{getActionLabel(log.action)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-600">{log.ingredientName}</td>
                    <td className="px-6 py-4">
                      <span className={`font-mono font-bold ${quantityView.tone}`}>{quantityView.text}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 italic text-xs">{log.details}</td>
                    <td className="px-6 py-4 text-right text-slate-400 text-xs">
                      {log.createdAt ? new Date(log.createdAt).toLocaleString("tr-TR") : "-"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
