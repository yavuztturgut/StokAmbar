"use client";

import React, { useEffect, useState } from "react";
import { History } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { clientRequest } from "@/lib/clientApi";
import { getActionIcon, getActionLabel } from "@/components/logs/logs-utils";
import { LogEntry } from "@/types";

interface ActivityLogListProps {
  refreshTrigger?: number;
  limit?: number;
}

export default function ActivityLogList({ refreshTrigger, limit }: ActivityLogListProps) {
  const { isAuthenticated, activeAccount } = useAuth();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = async () => {
    if (!isAuthenticated) return;

    try {
      const url = limit ? `/api/logs?limit=${limit}` : "/api/logs";
      const data = await clientRequest<{ logs?: LogEntry[] } | LogEntry[]>(
        url,
        undefined,
        "Loglar alinamadi"
      );

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
    if (isAuthenticated) {
      void fetchLogs();
      const interval = setInterval(() => {
        void fetchLogs();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [refreshTrigger, isAuthenticated, activeAccount?.id]);

  if (isLoading) return <div className="p-8 text-center italic text-slate-400">Loglar yukleniyor...</div>;

  return (
    <div className="mt-8 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-50 p-6">
        <History size={20} className="text-indigo-600" />
        <h2 className="text-lg font-bold text-slate-800">Son Islem Hareketleri</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-widest text-slate-500">
            <tr>
              <th className="px-6 py-3 text-left">Islem</th>
              <th className="px-6 py-3 text-left">Malzeme</th>
              <th className="px-6 py-3 text-left">Miktar</th>
              <th className="px-6 py-3 text-left">Detay</th>
              <th className="px-6 py-3 text-right">Tarih</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                  Henuz islem kaydi bulunmuyor.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="transition-colors hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {getActionIcon(log.action)}
                      <span className="font-semibold text-slate-700">{getActionLabel(log.action)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-600">{log.ingredientName}</td>
                  <td className="px-6 py-4">
                    {log.quantity !== null && log.quantity !== undefined ? (
                      <span
                        className={`font-mono font-bold ${
                          log.action === "IN" || log.action === "CREATE"
                            ? "text-emerald-600"
                            : "text-slate-600"
                        }`}
                      >
                        {log.action === "IN" || log.action === "CREATE" ? "+" : "-"}
                        {log.quantity}
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-6 py-4 text-xs italic text-slate-400">{log.details}</td>
                  <td className="px-6 py-4 text-right text-xs text-slate-400">
                    {log.createdAt ? new Date(log.createdAt).toLocaleString("tr-TR") : "-"}
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
