"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { exportToExcel, exportToPDF } from "@/lib/exportUtils";
import toast from "react-hot-toast";
import LogsHeader from "@/components/logs/LogsHeader";
import LogsFilters from "@/components/logs/LogsFilters";
import LogsTable from "@/components/logs/LogsTable";
import LogsPagination from "@/components/logs/LogsPagination";
import { getActionLabel, getVisiblePages } from "@/components/logs/logs-utils";

import { LogEntry } from "@/types";

type ActionFilter = "ALL" | "CREATE" | "UPDATE" | "DELETE" | "IN" | "OUT" | "WASTE" | "ADJUSTMENT";
type AmountDirection = "ALL" | "INCREASE" | "DECREASE";
type SortOrder = "newest" | "oldest";

const DEFAULT_LIMIT = 10;
const pageSizeOptions = [10, 25, 50];

const sanitizePositiveInt = (value: string | null, fallback: number) => {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const sanitizeAction = (value: string | null): ActionFilter => {
  const allowed: ActionFilter[] = ["ALL", "CREATE", "UPDATE", "DELETE", "IN", "OUT", "WASTE", "ADJUSTMENT"];
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
  const { isAuthenticated, activeAccount, isLoading: authLoading } = useAuth();

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
    activeAccount?.id,
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
  }, [fetchLogs, isAuthenticated, activeAccount?.id]);

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
        <LogsHeader
          totalItems={totalItems}
          isExporting={isExporting}
          canExport={logs.length > 0}
          onExport={handleExport}
        />

        <LogsFilters
          search={search}
          actionFilter={actionFilter}
          startDate={startDate}
          endDate={endDate}
          amountDirection={amountDirection}
          sortOrder={sortOrder}
          pageSize={pageSize}
          pageSizeOptions={pageSizeOptions}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          onActionFilterChange={(value) => {
            setActionFilter(value);
            setPage(1);
          }}
          onStartDateChange={(value) => {
            setStartDate(value);
            setPage(1);
          }}
          onEndDateChange={(value) => {
            setEndDate(value);
            setPage(1);
          }}
          onAmountDirectionChange={(value) => {
            setAmountDirection(value);
            setPage(1);
          }}
          onSortOrderChange={(value) => {
            setSortOrder(value);
            setPage(1);
          }}
          onPageSizeChange={(value) => {
            setPageSize(value);
            setPage(1);
          }}
          onReset={resetFilters}
        />

        <LogsTable
          logs={logs}
          isLoading={isLoading}
          pageSize={pageSize}
          hasActiveFilters={hasActiveFilters}
        />

        <LogsPagination
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          isLoading={isLoading}
          visiblePages={visiblePages}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
