"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  History,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  PencilLine,
  Trash2,
  Donut,
  ClipboardPlus,
  SquareArrowRight,
  FileOutput,
  FileText,
  ArrowUpDown,
  RotateCcw,
} from "lucide-react";
import { exportToExcel, exportToPDF } from "@/lib/exportUtils";
import toast from "react-hot-toast";

import { LogEntry } from "@/types";

type ActionFilter = "ALL" | "CREATE" | "UPDATE" | "DELETE" | "IN" | "OUT" | "WASTE";
type AmountDirection = "ALL" | "INCREASE" | "DECREASE";
type SortOrder = "newest" | "oldest";

const DEFAULT_LIMIT = 10;
const pageSizeOptions = [10, 25, 50];

const sanitizePositiveInt = (value: string | null, fallback: number) => {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const sanitizeAction = (value: string | null): ActionFilter => {
  const allowed: ActionFilter[] = ["ALL", "CREATE", "UPDATE", "DELETE", "IN", "OUT", "WASTE"];
  return allowed.includes(value as ActionFilter) ? (value as ActionFilter) : "ALL";
};

const sanitizeAmountDirection = (value: string | null): AmountDirection => {
  const allowed: AmountDirection[] = ["ALL", "INCREASE", "DECREASE"];
  return allowed.includes(value as AmountDirection)
    ? (value as AmountDirection)
    : "ALL";
};

const sanitizeSort = (value: string | null): SortOrder => {
  return value === "oldest" ? "oldest" : "newest";
};

const sanitizeDate = (value: string | null) =>
  value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";

const getVisiblePages = (currentPage: number, totalPages: number) => {
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

const createQueryParams = (params: {
  page?: number;
  limit?: number | "all";
  search?: string;
  action?: ActionFilter;
  startDate?: string;
  endDate?: string;
  amountDirection?: AmountDirection;
  sort?: SortOrder;
  includeDefaultLimit?: boolean;
}) => {
  const query = new URLSearchParams();

  if (params.page && params.page !== 1) {
    query.set("page", String(params.page));
  }

  if (
    params.limit &&
    (params.includeDefaultLimit || params.limit === "all" || params.limit !== DEFAULT_LIMIT)
  ) {
    query.set("limit", String(params.limit));
  }

  if (params.search) {
    query.set("search", params.search);
  }

  if (params.action && params.action !== "ALL") {
    query.set("action", params.action);
  }

  if (params.startDate) {
    query.set("startDate", params.startDate);
  }

  if (params.endDate) {
    query.set("endDate", params.endDate);
  }

  if (params.amountDirection && params.amountDirection !== "ALL") {
    query.set("amountDirection", params.amountDirection);
  }

  if (params.sort && params.sort !== "newest") {
    query.set("sort", params.sort);
  }

  return query;
};

export default function LogsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const [page, setPage] = useState(() => sanitizePositiveInt(searchParams.get("page"), 1));
  const [pageSize, setPageSize] = useState(() => sanitizePositiveInt(searchParams.get("limit"), DEFAULT_LIMIT));
  const [search, setSearch] = useState(() => searchParams.get("search") || "");
  const [debouncedSearch, setDebouncedSearch] = useState(() => searchParams.get("search") || "");
  const [actionFilter, setActionFilter] = useState<ActionFilter>(() => sanitizeAction(searchParams.get("action")));
  const [startDate, setStartDate] = useState(() => sanitizeDate(searchParams.get("startDate")));
  const [endDate, setEndDate] = useState(() => sanitizeDate(searchParams.get("endDate")));
  const [amountDirection, setAmountDirection] = useState<AmountDirection>(() =>
    sanitizeAmountDirection(searchParams.get("amountDirection"))
  );
  const [sortOrder, setSortOrder] = useState<SortOrder>(() => sanitizeSort(searchParams.get("sort")));
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const query = createQueryParams({
      page,
      limit: pageSize,
      search: debouncedSearch,
      action: actionFilter,
      startDate,
      endDate,
      amountDirection,
      sort: sortOrder,
      includeDefaultLimit: true,
    });

    const nextUrl = query.toString() ? `${pathname}?${query.toString()}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }, [
    actionFilter,
    amountDirection,
    debouncedSearch,
    endDate,
    page,
    pageSize,
    pathname,
    router,
    sortOrder,
    startDate,
  ]);

  const fetchLogs = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);

    try {
      const params = createQueryParams({
        page,
        limit: pageSize,
        search: debouncedSearch,
        action: actionFilter,
        startDate,
        endDate,
        amountDirection,
        sort: sortOrder,
        includeDefaultLimit: true,
      });

      const response = await fetch(`/api/logs?${params.toString()}`, {
        credentials: "same-origin",
      });
      const data = await response.json();

      if (data.logs) {
        setLogs(data.logs);
        setTotalPages(data.totalPages);
        setTotalItems(data.total);
      } else {
        setLogs([]);
        setTotalPages(1);
        setTotalItems(0);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [
    actionFilter,
    amountDirection,
    debouncedSearch,
    endDate,
    isAuthenticated,
    page,
    pageSize,
    sortOrder,
    startDate,
  ]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchLogs();
    }
  }, [fetchLogs, isAuthenticated]);

  const visiblePages = useMemo(() => getVisiblePages(page, totalPages), [page, totalPages]);

  const hasActiveFilters = Boolean(
    debouncedSearch ||
      actionFilter !== "ALL" ||
      startDate ||
      endDate ||
      amountDirection !== "ALL" ||
      sortOrder !== "newest" ||
      pageSize !== DEFAULT_LIMIT
  );

  const getActionIcon = (action: string) => {
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

  const getActionLabel = (action: string) => {
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

  const resetFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setActionFilter("ALL");
    setStartDate("");
    setEndDate("");
    setAmountDirection("ALL");
    setSortOrder("newest");
    setPageSize(DEFAULT_LIMIT);
    setPage(1);
  };

  const handleExport = async (type: "excel" | "pdf") => {
    if (!isAuthenticated) return;

    setIsExporting(true);

    try {
      const params = createQueryParams({
        limit: "all",
        search: debouncedSearch,
        action: actionFilter,
        startDate,
        endDate,
        amountDirection,
        sort: sortOrder,
      });

      const response = await fetch(`/api/logs?${params.toString()}`, {
        credentials: "same-origin",
      });
      const data = await response.json();
      const allLogs = Array.isArray(data.logs) ? data.logs : [];

      if (type === "excel") {
        const exportData = allLogs.map((log: LogEntry) => ({
          Islem: getActionLabel(log.action),
          Malzeme: log.ingredientName,
          Miktar: log.quantity ?? "-",
          Detay: log.details ?? "-",
          Tarih: log.createdAt ? new Date(log.createdAt).toLocaleString("tr-TR") : "-",
        }));

        exportToExcel(
          exportData,
          `Islem_Gecmisi_${new Date().toISOString().split("T")[0]}`
        );
      } else {
        const columns = [
          { header: "Islem", dataKey: "actionLabel" },
          { header: "Malzeme", dataKey: "ingredientName" },
          { header: "Miktar", dataKey: "quantity" },
          { header: "Detay", dataKey: "details" },
          { header: "Tarih", dataKey: "date" },
        ];

        const exportData = allLogs.map((log: LogEntry) => ({
          ...log,
          actionLabel: getActionLabel(log.action),
          date: log.createdAt ? new Date(log.createdAt).toLocaleString("tr-TR") : "-",
          quantity: log.quantity ?? "-",
        }));

        await exportToPDF(
          columns,
          exportData,
          `Islem_Gecmisi_${new Date().toISOString().split("T")[0]}`,
          "Islem Gecmisi Raporu"
        );
      }

      toast.success(`${type === "excel" ? "Excel" : "PDF"} dosyasi indiriliyor...`);
    } catch (error) {
      console.error(error);
      toast.error("Dosya olusturulamadi.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-100">
              <History size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Islem Gecmisi</h1>
              <p className="text-slate-500 text-sm">
                Sistemdeki tum hareketleri buradan inceleyebilirsiniz
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <button
              onClick={() => handleExport("excel")}
              disabled={isExporting || logs.length === 0}
              className="flex items-center gap-2 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl font-bold transition-all text-xs border border-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileOutput size={14} />
              Excel
            </button>
            <button
              onClick={() => handleExport("pdf")}
              disabled={isExporting || logs.length === 0}
              className="flex items-center gap-2 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl font-bold transition-all text-xs border border-rose-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileText size={14} />
              PDF
            </button>
            <div className="w-px h-6 bg-slate-200 mx-1 hidden sm:block"></div>
            <p className="text-indigo-600 font-bold text-sm bg-indigo-50 px-4 py-2 rounded-full border border-indigo-100 whitespace-nowrap">
              Toplam {totalItems} Kayit
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center gap-2 text-slate-600">
            <Filter size={18} />
            <span className="text-sm font-bold uppercase tracking-wide">Filtreler</span>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
            <div className="xl:col-span-12 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-4">
              <div className="relative md:col-span-2 xl:col-span-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="text"
                  placeholder="Malzeme adina gore ara..."
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white outline-none transition-all"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                />
              </div>

              <div className="xl:col-span-3">
                <select
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl text-sm px-4 py-3 text-slate-800 font-medium outline-none focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all cursor-pointer"
                  value={actionFilter}
                  onChange={(event) => {
                    setActionFilter(event.target.value as ActionFilter);
                    setPage(1);
                  }}
                >
                  <option value="ALL">Tum islemler</option>
                  <option value="CREATE">Olusturma</option>
                  <option value="UPDATE">Guncelleme</option>
                  <option value="DELETE">Silme</option>
                  <option value="IN">Giris</option>
                  <option value="OUT">Cikis</option>
                  <option value="WASTE">Zayiat</option>
                </select>
              </div>

              <div className="xl:col-span-2">
                <input
                  type="date"
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl text-sm px-4 py-3 text-slate-800 font-medium outline-none focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all"
                  value={startDate}
                  max={endDate || undefined}
                  onChange={(event) => {
                    setStartDate(event.target.value);
                    setPage(1);
                  }}
                />
              </div>

              <div className="xl:col-span-3">
                <input
                  type="date"
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl text-sm px-4 py-3 text-slate-800 font-medium outline-none focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all"
                  value={endDate}
                  min={startDate || undefined}
                  onChange={(event) => {
                    setEndDate(event.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </div>

            <div className="xl:col-span-12 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-4">
              <div className="xl:col-span-4">
                <select
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl text-sm px-4 py-3 text-slate-800 font-medium outline-none focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all cursor-pointer"
                  value={amountDirection}
                  onChange={(event) => {
                    setAmountDirection(event.target.value as AmountDirection);
                    setPage(1);
                  }}
                >
                  <option value="ALL">Tum miktarlar</option>
                  <option value="INCREASE">Artislar</option>
                  <option value="DECREASE">Azalislar</option>
                </select>
              </div>

              <div className="xl:col-span-3">
                <div className="relative">
                  <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <select
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl text-sm pl-10 pr-4 py-3 text-slate-800 font-medium outline-none focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all cursor-pointer"
                    value={sortOrder}
                    onChange={(event) => {
                      setSortOrder(event.target.value as SortOrder);
                      setPage(1);
                    }}
                  >
                    <option value="newest">En yeni once</option>
                    <option value="oldest">En eski once</option>
                  </select>
                </div>
              </div>

              <div className="xl:col-span-3">
                <select
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl text-sm px-4 py-3 text-slate-800 font-medium outline-none focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all cursor-pointer"
                  value={pageSize}
                  onChange={(event) => {
                    setPageSize(Number.parseInt(event.target.value, 10));
                    setPage(1);
                  }}
                >
                  {pageSizeOptions.map((option) => (
                    <option key={option} value={option}>
                      Sayfa basi {option} kayit
                    </option>
                  ))}
                </select>
              </div>

              <div className="xl:col-span-2">
                <button
                  onClick={resetFilters}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  <RotateCcw size={16} />
                  Temizle
                </button>
              </div>
            </div>
          </div>
        </div>

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
                      <td className="px-6 py-4 text-slate-400 italic text-xs">{log.details}</td>
                      <td className="px-6 py-4 text-right text-slate-400 text-xs">
                        {log.createdAt ? new Date(log.createdAt).toLocaleString("tr-TR") : "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="text-sm text-slate-500">
              Toplam <span className="font-bold text-slate-700">{totalItems}</span> kayit, sayfa{" "}
              <span className="font-bold text-slate-700">{page}</span> / {totalPages}
            </div>

            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page === 1 || isLoading}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 disabled:opacity-20 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
              >
                <ChevronLeft size={18} />
                Onceki
              </button>

              <div className="flex items-center gap-2">
                {visiblePages.map((item, index) =>
                  item === "..." ? (
                    <span key={`ellipsis-${index}`} className="px-2 text-slate-400">
                      ...
                    </span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => setPage(item)}
                      disabled={item === page}
                      className={`min-w-11 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border ${
                        item === page
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100"
                      }`}
                    >
                      {item}
                    </button>
                  )
                )}
              </div>

              <button
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={page === totalPages || isLoading}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 disabled:opacity-20 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
              >
                Sonraki
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="flex md:hidden items-center justify-between gap-3">
              <button
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page === 1 || isLoading}
                className="inline-flex items-center gap-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 disabled:opacity-20 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
              >
                <ChevronLeft size={18} />
                Onceki
              </button>

              <span className="text-sm font-bold text-slate-700">
                {page} / {totalPages}
              </span>

              <button
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={page === totalPages || isLoading}
                className="inline-flex items-center gap-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 disabled:opacity-20 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
              >
                Sonraki
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
