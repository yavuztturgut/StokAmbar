"use client";

import React, { useEffect, useState } from "react";
import { History, ArrowRightLeft, PlusCircle, PencilLine, Trash2, ShieldCheck, Donut, ClipboardPlus, SquareArrowRight } from "lucide-react";

import { LogEntry } from "@/types";

interface ActivityLogListProps {
  refreshTrigger?: number;
  limit?: number;
}

export default function ActivityLogList({ refreshTrigger, limit }: ActivityLogListProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      const url = limit ? `/api/logs?limit=${limit}` : "/api/logs";
      const response = await fetch(url);
      const data = await response.json();
      
      // Handle both object and array response for backward compatibility
      if (Array.isArray(data)) {
        setLogs(data);
      } else if (data && data.logs) {
        setLogs(data.logs);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // Poll every 30 seconds for background updates
    const interval = setInterval(fetchLogs, 30000);
    return () => clearInterval(interval);
  }, [refreshTrigger]);

  const getActionIcon = (action: string) => {
    switch (action) {
      case "CREATE": return <PlusCircle className="text-emerald-500" size={16} />;
      case "UPDATE": return <PencilLine className="text-blue-500" size={16} />;
      case "DELETE": return <Trash2 className="text-rose-500" size={16} />;
      case "IN": return <ClipboardPlus className="text-emerald-500" size={16} />;
      case "OUT": return <ArrowRightLeft className="text-amber-500" size={16} />;
      case "WASTE": return <Donut className="text-rose-500 font-bold" size={16} />;
      default: return <History size={16} />;
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case "CREATE": return "Stok Oluşturma";
      case "UPDATE": return "Güncelleme";
      case "DELETE": return "Silme İşlemi";
      case "IN": return "Stok Girişi";
      case "OUT": return "Stok Çıkışı";
      case "WASTE": return "Zayiat Kaydı";
      default: return action;
    }
  };

  if (isLoading) return <div className="p-8 text-center text-slate-400 italic">Loglar yükleniyor...</div>;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mt-8">
      <div className="p-6 border-b border-slate-50 flex items-center gap-2">
        <History size={20} className="text-indigo-600" />
        <h2 className="text-lg font-bold text-slate-800">Son İşlem Hareketleri</h2>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-widest">
            <tr>
              <th className="px-6 py-3 text-left">İşlem</th>
              <th className="px-6 py-3 text-left">Malzeme</th>
              <th className="px-6 py-3 text-left">Miktar</th>
              <th className="px-6 py-3 text-left">Detay</th>
              <th className="px-6 py-3 text-right">Tarih</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-400">Henüz işlem kaydı bulunmuyor.</td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {getActionIcon(log.action)}
                      <span className="font-semibold text-slate-700">{getActionLabel(log.action)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-600">{log.ingredientName}</td>
                  <td className="px-6 py-4">
                    {log.quantity !== null && log.quantity !== undefined ? (
                      <span className={`font-mono font-bold ${log.action === 'IN' || log.action === 'CREATE' ? 'text-emerald-600' : 'text-slate-600'}`}>
                        {log.action === 'IN' || log.action === 'CREATE' ? '+' : '-'}{log.quantity}
                      </span>
                    ) : "-"}
                  </td>
                  <td className="px-6 py-4 text-slate-400 italic text-xs">{log.details}</td>
                  <td className="px-6 py-4 text-right text-slate-400 text-xs">
                    {new Date(log.createdAt).toLocaleString("tr-TR")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
