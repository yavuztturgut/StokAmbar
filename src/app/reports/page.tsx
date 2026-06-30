"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Boxes,
  ClipboardCheck,
  FileOutput,
  FileSearch,
  FileText,
  Flame,
  PackageSearch,
  RefreshCcw,
  Search,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { clientRequest } from "@/lib/clientApi";
import { exportToExcel, exportToPDF } from "@/lib/exportUtils";

type IdleStockRow = {
  ingredientId: number;
  name: string;
  category: string;
  sku: string;
  unit: string;
  currentStock: number;
  minStockLevel: number;
  daysWithoutMovement: number;
  lastMovementAt: string | null;
};

type OverstockRow = {
  ingredientId: number;
  name: string;
  category: string;
  sku: string;
  unit: string;
  currentStock: number;
  minStockLevel: number;
  overstockRatio: number;
  excessAmount: number;
};

type WasteAnomalyRow = {
  ingredientId: number;
  name: string;
  category: string;
  sku: string;
  unit: string;
  totalOut: number;
  totalWaste: number;
  wasteRatio: number | null;
  lastWasteAt: string | null;
  severity: "critical" | "high" | "watch";
};

type CountVarianceRow = {
  ingredientId: number;
  name: string;
  category: string;
  sku: string;
  unit: string;
  adjustmentCount: number;
  totalAbsoluteDifference: number;
  latestDifference: number;
  lastCountedAt: string | null;
};

type DataQualityRow = {
  ingredientId: number;
  name: string;
  category: string;
  sku: string;
  supplier: string;
  unit: string;
  issues: string[];
};

type ReportsResponse = {
  filters: {
    startDate: string;
    endDate: string;
    category: string;
    search: string;
  };
  categories: string[];
  summary: {
    idleStockCount: number;
    overstockCount: number;
    wasteAnomalyCount: number;
    repeatedCountVarianceCount: number;
    dataQualityCount: number;
  };
  reports: {
    idleStock: IdleStockRow[];
    overstock: OverstockRow[];
    wasteAnomalies: WasteAnomalyRow[];
    repeatedCountVariance: CountVarianceRow[];
    dataQuality: DataQualityRow[];
  };
};

type ReportKey =
  | "idleStock"
  | "overstock"
  | "wasteAnomalies"
  | "repeatedCountVariance"
  | "dataQuality";

const REPORT_META: Record<
  ReportKey,
  {
    label: string;
    description: string;
    exportTitle: string;
  }
> = {
  idleStock: {
    label: "Uyuyan Stok",
    description: "Son 30 günde hiç hareket görmeyen ürünler.",
    exportTitle: "Uyuyan Stok Raporu",
  },
  overstock: {
    label: "Aşırı Stok",
    description: "Minimum seviyesinin 3 katı ve üstünde kalan ürünler.",
    exportTitle: "Aşırı Stok Raporu",
  },
  wasteAnomalies: {
    label: "Fire Anomali",
    description: "Normal çıkışa göre orantısız fire veren ürünler.",
    exportTitle: "Fire Anomali Raporu",
  },
  repeatedCountVariance: {
    label: "Tekrarlayan Sayım Sapması",
    description: "Sık sık sayım düzeltmesi alan sorunlu kalemler.",
    exportTitle: "Tekrarlayan Sayım Sapması Raporu",
  },
  dataQuality: {
    label: "Veri Kalitesi",
    description: "SKU, kategori, tedarikçi ve min stok eksikleri.",
    exportTitle: "Veri Kalitesi Raporu",
  },
};

const formatDateInput = (date: Date) => date.toISOString().split("T")[0];
const formatNumber = (value: number) =>
  new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 }).format(value);

export default function ReportsPage() {
  const router = useRouter();
  const { isAuthenticated, activeAccount, isLoading: authLoading } = useAuth();
  const [data, setData] = useState<ReportsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [activeReport, setActiveReport] = useState<ReportKey>("idleStock");
  const [startDate, setStartDate] = useState(() => formatDateInput(new Date(Date.now() - 29 * 86400000)));
  const [endDate, setEndDate] = useState(() => formatDateInput(new Date()));

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  const fetchReports = useCallback(async () => {
    if (!isAuthenticated) {
      return;
    }

    setIsLoading(true);
    try {
      const params = new URLSearchParams({ startDate, endDate });

      if (category) {
        params.set("category", category);
      }

      if (search.trim()) {
        params.set("search", search.trim());
      }

      const response = await clientRequest<ReportsResponse>(
        `/api/reports?${params.toString()}`,
        undefined,
        "Raporlar alınamadı"
      );

      setData(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Raporlar alınamadı";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [category, endDate, isAuthenticated, search, startDate]);

  useEffect(() => {
    if (isAuthenticated) {
      void fetchReports();
    }
  }, [fetchReports, isAuthenticated, activeAccount?.id]);

  const activeRows = useMemo(() => {
    if (!data) {
      return [];
    }

    return data.reports[activeReport];
  }, [activeReport, data]);

  const handleExport = async (type: "excel" | "pdf") => {
    if (!activeRows.length) {
      toast.error("Aktarılacak veri yok");
      return;
    }

    setIsExporting(true);
    try {
      let exportRows: Record<string, unknown>[] = [];

      if (activeReport === "idleStock") {
        exportRows = (activeRows as IdleStockRow[]).map((row) => ({
          Malzeme: row.name,
          Kategori: row.category,
          SKU: row.sku,
          Birim: row.unit,
          "Mevcut Stok": row.currentStock,
          "Min Stok": row.minStockLevel,
          "Hareketsiz Gün": row.daysWithoutMovement,
          "Son Hareket": row.lastMovementAt ? new Date(row.lastMovementAt).toLocaleString("tr-TR") : "Yok",
        }));
      } else if (activeReport === "overstock") {
        exportRows = (activeRows as OverstockRow[]).map((row) => ({
          Malzeme: row.name,
          Kategori: row.category,
          SKU: row.sku,
          Birim: row.unit,
          "Mevcut Stok": row.currentStock,
          "Min Stok": row.minStockLevel,
          Oran: row.overstockRatio,
          "Fazla Miktar": row.excessAmount,
        }));
      } else if (activeReport === "wasteAnomalies") {
        exportRows = (activeRows as WasteAnomalyRow[]).map((row) => ({
          Malzeme: row.name,
          Kategori: row.category,
          SKU: row.sku,
          Birim: row.unit,
          "Toplam Çıkış": row.totalOut,
          "Toplam Fire": row.totalWaste,
          "Fire Oranı": row.wasteRatio === null ? "Sadece fire var" : row.wasteRatio,
          Seviye: row.severity,
          "Son Fire": row.lastWasteAt ? new Date(row.lastWasteAt).toLocaleString("tr-TR") : "Yok",
        }));
      } else if (activeReport === "repeatedCountVariance") {
        exportRows = (activeRows as CountVarianceRow[]).map((row) => ({
          Malzeme: row.name,
          Kategori: row.category,
          SKU: row.sku,
          Birim: row.unit,
          "Düzeltme Sayısı": row.adjustmentCount,
          "Toplam Mutlak Sapma": row.totalAbsoluteDifference,
          "Son Sapma": row.latestDifference,
          "Son Sayım": row.lastCountedAt ? new Date(row.lastCountedAt).toLocaleString("tr-TR") : "Yok",
        }));
      } else {
        exportRows = (activeRows as DataQualityRow[]).map((row) => ({
          Malzeme: row.name,
          Kategori: row.category,
          SKU: row.sku,
          Tedarikçi: row.supplier,
          Birim: row.unit,
          Sorunlar: row.issues.join(", "),
        }));
      }

      const columns = Object.keys(exportRows[0] || {}).map((key) => ({
        header: key,
        dataKey: key,
      }));

      const fileName = `Rapor_${REPORT_META[activeReport].label.replaceAll(" ", "_")}_${new Date().toISOString().split("T")[0]}`;

      if (type === "excel") {
        exportToExcel(exportRows, fileName);
      } else {
        await exportToPDF(columns, exportRows, fileName, REPORT_META[activeReport].exportTitle);
      }

      toast.success(`${type === "excel" ? "Excel" : "PDF"} dosyası indiriliyor...`);
    } catch (error) {
      console.error(error);
      toast.error("Rapor dışarı aktarılamadı");
    } finally {
      setIsExporting(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-indigo-600" />
          <p className="text-slate-500">Raporlar hazırlanıyor...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !data) {
    return null;
  }

  const summaryCards = [
    { key: "idleStockCount", label: "Uyuyan stok", value: data.summary.idleStockCount, icon: PackageSearch, tone: "text-slate-800" },
    { key: "overstockCount", label: "Aşırı stok", value: data.summary.overstockCount, icon: Boxes, tone: "text-amber-600" },
    { key: "wasteAnomalyCount", label: "Fire anomali", value: data.summary.wasteAnomalyCount, icon: Flame, tone: "text-rose-600" },
    { key: "repeatedCountVarianceCount", label: "Sayım sapması", value: data.summary.repeatedCountVarianceCount, icon: ClipboardCheck, tone: "text-indigo-600" },
    { key: "dataQualityCount", label: "Veri kalitesi", value: data.summary.dataQualityCount, icon: FileSearch, tone: "text-cyan-600" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-indigo-600">
                <AlertTriangle size={18} />
                <span className="text-sm font-bold uppercase tracking-wider">Raporlar</span>
              </div>
              <h1 className="text-3xl font-black tracking-tight text-slate-800">Operasyonel sorun listeleri</h1>
              <p className="mt-1 max-w-2xl text-slate-500">
                Dashboard özeti ve log geçmişini tekrar etmeden doğrudan problem çıkarır.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => void fetchReports()}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                <RefreshCcw size={16} />
                Yenile
              </button>
              <button
                onClick={() => void handleExport("excel")}
                disabled={isExporting || activeRows.length === 0}
                className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FileOutput size={16} />
                Excel
              </button>
              <button
                onClick={() => void handleExport("pdf")}
                disabled={isExporting || activeRows.length === 0}
                className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FileText size={16} />
                PDF
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-3 lg:grid-cols-[1.2fr_1fr_1fr_1fr_auto]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Malzeme, kategori, SKU..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition-all focus:border-indigo-500 focus:bg-white"
              />
            </div>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition-all focus:border-indigo-500 focus:bg-white"
            >
              <option value="">Tüm kategoriler</option>
              {data.categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition-all focus:border-indigo-500 focus:bg-white"
            />
            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition-all focus:border-indigo-500 focus:bg-white"
            />
            <button
              onClick={() => void fetchReports()}
              className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-100 transition-all hover:bg-indigo-700"
            >
              Uygula
            </button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {summaryCards.map((card) => (
            <div key={card.key} className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-500">{card.label}</span>
                <card.icon size={18} className={card.tone} />
              </div>
              <p className={`mt-5 text-3xl font-black tracking-tight ${card.tone}`}>{formatNumber(card.value)}</p>
            </div>
          ))}
        </section>

        <section className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-5">
            {Object.entries(REPORT_META).map(([key, meta]) => {
              const reportKey = key as ReportKey;
              const isActive = activeReport === reportKey;
              const rowCount = data.reports[reportKey].length;

              return (
                <button
                  key={key}
                  onClick={() => setActiveReport(reportKey)}
                  className={`rounded-2xl px-4 py-3 text-left text-sm transition-all ${
                    isActive ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <p className="font-bold">{meta.label}</p>
                  <p className={`mt-1 line-clamp-2 text-[11px] leading-5 ${isActive ? "text-indigo-100" : "text-slate-400"}`}>{meta.description}</p>
                  <p className={`mt-2 text-[11px] font-semibold ${isActive ? "text-white" : "text-slate-500"}`}>{rowCount} kayıt</p>
                </button>
              );
            })}
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-5">
            <h2 className="text-lg font-bold text-slate-800">{REPORT_META[activeReport].label}</h2>
            <p className="mt-1 text-sm text-slate-500">{REPORT_META[activeReport].description}</p>
          </div>

          <div className="overflow-x-auto">
            {activeReport === "idleStock" && (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                  <tr>
                    <th className="px-6 py-4 text-left">Malzeme</th>
                    <th className="px-6 py-4 text-left">Stok</th>
                    <th className="px-6 py-4 text-left">Hareketsiz</th>
                    <th className="px-6 py-4 text-left">Son hareket</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {(activeRows as IdleStockRow[]).length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-16 text-center text-slate-400">
                        Uyuyan stok bulunmuyor.
                      </td>
                    </tr>
                  ) : (
                    (activeRows as IdleStockRow[]).map((row) => (
                      <tr key={row.ingredientId} className="transition-colors hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-800">{row.name}</p>
                          <p className="mt-1 text-xs text-slate-400">{row.category} / {row.sku}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-mono font-bold text-slate-700">{formatNumber(row.currentStock)}</p>
                          <p className="mt-1 text-xs text-slate-400">Min: {formatNumber(row.minStockLevel)}</p>
                        </td>
                        <td className="px-6 py-4 font-semibold text-amber-700">{row.daysWithoutMovement} gün</td>
                        <td className="px-6 py-4 text-slate-500">
                          {row.lastMovementAt ? new Date(row.lastMovementAt).toLocaleString("tr-TR") : "Hiç hareket yok"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {activeReport === "overstock" && (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                  <tr>
                    <th className="px-6 py-4 text-left">Malzeme</th>
                    <th className="px-6 py-4 text-left">Mevcut / Min</th>
                    <th className="px-6 py-4 text-left">Oran</th>
                    <th className="px-6 py-4 text-left">Fazla miktar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {(activeRows as OverstockRow[]).length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-16 text-center text-slate-400">
                        Aşırı stok bulunmuyor.
                      </td>
                    </tr>
                  ) : (
                    (activeRows as OverstockRow[]).map((row) => (
                      <tr key={row.ingredientId} className="transition-colors hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-800">{row.name}</p>
                          <p className="mt-1 text-xs text-slate-400">{row.category} / {row.sku}</p>
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {formatNumber(row.currentStock)} / {formatNumber(row.minStockLevel)}
                        </td>
                        <td className="px-6 py-4 font-semibold text-amber-700">{formatNumber(row.overstockRatio)}x</td>
                        <td className="px-6 py-4 font-mono font-bold text-slate-700">{formatNumber(row.excessAmount)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {activeReport === "wasteAnomalies" && (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                  <tr>
                    <th className="px-6 py-4 text-left">Malzeme</th>
                    <th className="px-6 py-4 text-left">Çıkış / Fire</th>
                    <th className="px-6 py-4 text-left">Oran</th>
                    <th className="px-6 py-4 text-left">Seviye</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {(activeRows as WasteAnomalyRow[]).length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-16 text-center text-slate-400">
                        Fire anomali bulunmuyor.
                      </td>
                    </tr>
                  ) : (
                    (activeRows as WasteAnomalyRow[]).map((row) => (
                      <tr key={row.ingredientId} className="transition-colors hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-800">{row.name}</p>
                          <p className="mt-1 text-xs text-slate-400">{row.category} / {row.sku}</p>
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {formatNumber(row.totalOut)} / {formatNumber(row.totalWaste)}
                        </td>
                        <td className="px-6 py-4 font-semibold text-rose-700">
                          {row.wasteRatio === null ? "Sadece fire var" : `${formatNumber(row.wasteRatio * 100)}%`}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                              row.severity === "critical"
                                ? "bg-rose-100 text-rose-700"
                                : row.severity === "high"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {row.severity === "critical" ? "Kritik" : row.severity === "high" ? "Yüksek" : "İzle"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {activeReport === "repeatedCountVariance" && (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                  <tr>
                    <th className="px-6 py-4 text-left">Malzeme</th>
                    <th className="px-6 py-4 text-left">Düzeltme sayısı</th>
                    <th className="px-6 py-4 text-left">Toplam sapma</th>
                    <th className="px-6 py-4 text-left">Son sapma</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {(activeRows as CountVarianceRow[]).length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-16 text-center text-slate-400">
                        Tekrarlayan sayım sapması bulunmuyor.
                      </td>
                    </tr>
                  ) : (
                    (activeRows as CountVarianceRow[]).map((row) => (
                      <tr key={row.ingredientId} className="transition-colors hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-800">{row.name}</p>
                          <p className="mt-1 text-xs text-slate-400">{row.category} / {row.sku}</p>
                        </td>
                        <td className="px-6 py-4 font-semibold text-indigo-700">{row.adjustmentCount}</td>
                        <td className="px-6 py-4 font-mono font-bold text-slate-700">{formatNumber(row.totalAbsoluteDifference)}</td>
                        <td className={`px-6 py-4 font-mono font-bold ${row.latestDifference >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                          {row.latestDifference > 0 ? "+" : ""}
                          {formatNumber(row.latestDifference)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {activeReport === "dataQuality" && (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                  <tr>
                    <th className="px-6 py-4 text-left">Malzeme</th>
                    <th className="px-6 py-4 text-left">SKU / Tedarikçi</th>
                    <th className="px-6 py-4 text-left">Sorunlar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {(activeRows as DataQualityRow[]).length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-16 text-center text-slate-400">
                        Veri kalitesi sorunu bulunmuyor.
                      </td>
                    </tr>
                  ) : (
                    (activeRows as DataQualityRow[]).map((row) => (
                      <tr key={row.ingredientId} className="transition-colors hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-800">{row.name}</p>
                          <p className="mt-1 text-xs text-slate-400">{row.category} / {row.unit}</p>
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          <p>{row.sku}</p>
                          <p className="mt-1 text-xs text-slate-400">{row.supplier}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-2">
                            {row.issues.map((issue) => (
                              <span key={issue} className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-700">
                                {issue}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
