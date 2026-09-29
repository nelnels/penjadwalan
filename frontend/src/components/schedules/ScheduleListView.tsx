import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, CalendarDays, Download, FileSpreadsheet, FileText, Moon, RotateCcw, Search, SlidersHorizontal, Sun, X } from "lucide-react";
import { EventDTO } from "../../lib/types";
import { SchedulesService } from "../../services/api";
import { exportSchedulesToExcel, exportSchedulesToPdf } from "../../lib/scheduleExport";
import { useNotificationStore } from "../../stores/notificationStore";
import { useThemeStore } from "../../stores/themeStore";

type SortField = "startDate" | "title" | "status";
type SortOrder = "asc" | "desc";

interface Filters {
  search: string;
  category: string;
  status: string;
  startDate: string;
  endDate: string;
  sortBy: SortField;
  sortOrder: SortOrder;
  page: number;
  limit: number;
}

const CATEGORY_OPTIONS = [
  ["SEMINAR_WORKSHOP", "Seminar / Workshop"],
  ["RAPAT_KOORDINASI", "Rapat Koordinasi"],
  ["DEADLINE_PROYEK", "Deadline Proyek"],
  ["KEGIATAN_SOSIAL", "Kegiatan Sosial"],
  ["KOMPETISI_LOMBA", "Kompetisi / Lomba"],
  ["INTERNAL_TEAM", "Internal Team"],
];

const STATUS_OPTIONS = [
  ["upcoming", "Upcoming"],
  ["ongoing", "Ongoing"],
  ["selesai", "Selesai"],
  ["dibatalkan", "Dibatalkan"],
];

const statusLabel: Record<string, string> = {
  UPCOMING: "Upcoming", IN_PROGRESS: "Ongoing", COMPLETED: "Selesai", CANCELLED: "Dibatalkan", POSTPONED: "Ditunda",
};

function readFilters(): Filters {
  const params = new URLSearchParams(window.location.search);
  const sortBy = params.get("sortBy");
  const limit = Number(params.get("limit"));
  return {
    search: params.get("search") || "",
    category: params.get("category") || "",
    status: params.get("status") || "",
    startDate: params.get("startDate") || "",
    endDate: params.get("endDate") || "",
    sortBy: sortBy === "title" || sortBy === "status" ? sortBy : "startDate",
    sortOrder: params.get("sortOrder") === "desc" ? "desc" : "asc",
    page: Math.max(1, Number(params.get("page")) || 1),
    limit: limit === 20 ? 20 : 10,
  };
}

function writeFilters(filters: Filters) {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.category) params.set("category", filters.category);
  if (filters.status) params.set("status", filters.status);
  if (filters.startDate) params.set("startDate", filters.startDate);
  if (filters.endDate) params.set("endDate", filters.endDate);
  if (filters.sortBy !== "startDate") params.set("sortBy", filters.sortBy);
  if (filters.sortOrder !== "asc") params.set("sortOrder", filters.sortOrder);
  if (filters.page !== 1) params.set("page", String(filters.page));
  if (filters.limit !== 10) params.set("limit", String(filters.limit));
  const query = params.toString();
  window.history.replaceState({}, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(value));
}

export default function ScheduleListView() {
  const [filters, setFilters] = useState<Filters>(readFilters);
  const [searchInput, setSearchInput] = useState(filters.search);
  const [schedules, setSchedules] = useState<EventDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState<"pdf" | "excel" | null>(null);
  const { showToast } = useNotificationStore();
  const { theme, toggleTheme } = useThemeStore();

  const updateFilters = useCallback((changes: Partial<Filters>, resetPage = true) => {
    setFilters((current) => ({ ...current, ...changes, page: resetPage ? 1 : (changes.page ?? current.page) }));
  }, []);

  useEffect(() => {
    const debounce = window.setTimeout(() => updateFilters({ search: searchInput }), 300);
    return () => window.clearTimeout(debounce);
  }, [searchInput, updateFilters]);

  useEffect(() => {
    writeFilters(filters);
    let active = true;
    setLoading(true);
    setError("");
    SchedulesService.getAll(filters)
      .then((response) => {
        if (!active) return;
        setSchedules(response.data);
        setTotal(response.pagination.total);
        setTotalPages(response.pagination.totalPages);
      })
      .catch(() => active && setError("Jadwal tidak dapat dimuat. Pastikan API backend sedang berjalan."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [filters]);

  useEffect(() => {
    const onPopState = () => {
      const next = readFilters();
      setFilters(next);
      setSearchInput(next.search);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const activeFilters = useMemo(() => [
    filters.search && { key: "search", label: `Pencarian: ${filters.search}` },
    filters.category && { key: "category", label: `Kategori: ${CATEGORY_OPTIONS.find(([value]) => value === filters.category)?.[1] || filters.category}` },
    filters.status && { key: "status", label: `Status: ${STATUS_OPTIONS.find(([value]) => value === filters.status)?.[1] || filters.status}` },
    filters.startDate && { key: "startDate", label: `Mulai: ${filters.startDate}` },
    filters.endDate && { key: "endDate", label: `Sampai: ${filters.endDate}` },
  ].filter(Boolean) as { key: keyof Filters; label: string }[], [filters]);

  const clearFilter = (key: keyof Filters) => {
    if (key === "search") setSearchInput("");
    updateFilters({ [key]: "" } as Partial<Filters>);
  };

  const resetAll = () => {
    setSearchInput("");
    setFilters({ search: "", category: "", status: "", startDate: "", endDate: "", sortBy: "startDate", sortOrder: "asc", page: 1, limit: 10 });
  };

  const changeSort = (field: SortField) => {
    updateFilters(
      field === filters.sortBy ? { sortOrder: filters.sortOrder === "asc" ? "desc" : "asc" } : { sortBy: field, sortOrder: "asc" },
    );
  };

  const exportData = async (type: "pdf" | "excel") => {
    setExporting(type);
    try {
      const { data } = await SchedulesService.getAll({ ...filters, page: 1, all: "true" });
      if (type === "pdf") exportSchedulesToPdf(data);
      else exportSchedulesToExcel(data);
      showToast("success", "Export berhasil", `${data.length} schedule telah diekspor.`);
    } catch {
      showToast("error", "Export gagal", "Data tidak dapat diekspor. Periksa koneksi backend lalu coba lagi.");
    } finally { setExporting(null); }
  };

  const sortIcon = (field: SortField) => filters.sortBy !== field
    ? <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
    : filters.sortOrder === "asc" ? <ArrowUp className="h-3.5 w-3.5 text-blue-600" /> : <ArrowDown className="h-3.5 w-3.5 text-blue-600" />;

  return (
    <main className="mx-auto max-w-7xl space-y-5 p-4 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Daftar Schedule</h1>
        <p className="mt-1 text-sm text-slate-500">Cari dan filter agenda langsung dari database.</p>
        </div>
        <div className="flex gap-2"><a href="/schedules/calendar" className="inline-flex items-center gap-1 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white"><CalendarDays className="h-4 w-4" />Calendar View</a><button onClick={toggleTheme} className="rounded-xl border border-slate-300 p-2 dark:border-slate-700" aria-label="Ubah tema">{theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</button></div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto_auto_auto]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Cari judul atau deskripsi..." className="w-full rounded-xl border border-slate-300 py-2 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800" />
          </label>
          <select value={filters.category} onChange={(event) => updateFilters({ category: event.target.value })} className="rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800">
            <option value="">Semua kategori</option>{CATEGORY_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <select value={filters.status} onChange={(event) => updateFilters({ status: event.target.value })} className="rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800">
            <option value="">Semua status</option>{STATUS_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <input aria-label="Tanggal mulai" type="date" value={filters.startDate} onChange={(event) => updateFilters({ startDate: event.target.value })} className="rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800" />
          <input aria-label="Tanggal akhir" type="date" value={filters.endDate} min={filters.startDate || undefined} onChange={(event) => updateFilters({ endDate: event.target.value })} className="rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800" />
        </div>

        {activeFilters.length > 0 && <div className="mt-3 flex flex-wrap items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-slate-400" />
          {activeFilters.map((filter) => <span key={filter.key} className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">{filter.label}<button aria-label={`Hapus ${filter.label}`} onClick={() => clearFilter(filter.key)}><X className="h-3.5 w-3.5" /></button></span>)}
          <button onClick={resetAll} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-rose-600"><RotateCcw className="h-3.5 w-3.5" />Reset semua filter</button>
        </div>}
      </section>

      <div className="flex flex-wrap justify-end gap-2">
        <button disabled={!!exporting} onClick={() => exportData("pdf")} className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 disabled:opacity-50"><FileText className="h-4 w-4" />{exporting === "pdf" ? "Membuat PDF…" : "Export to PDF"}</button>
        <button disabled={!!exporting} onClick={() => exportData("excel")} className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 disabled:opacity-50"><FileSpreadsheet className="h-4 w-4" />{exporting === "excel" ? "Membuat Excel…" : "Export to Excel"}</button>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 text-sm text-slate-500 dark:border-slate-800"><span>Total <strong className="text-slate-800 dark:text-slate-100">{total}</strong> schedule</span><select aria-label="Jumlah data per halaman" value={filters.limit} onChange={(event) => updateFilters({ limit: Number(event.target.value) }, true)} className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800"><option value={10}>10 / halaman</option><option value={20}>20 / halaman</option></select></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800/60"><tr>
          <th><button onClick={() => changeSort("title")} className="flex items-center gap-1 px-4 py-3 hover:text-blue-600">Judul {sortIcon("title")}</button></th><th className="px-4 py-3">Kategori</th><th><button onClick={() => changeSort("startDate")} className="flex items-center gap-1 px-4 py-3 hover:text-blue-600">Tanggal {sortIcon("startDate")}</button></th><th><button onClick={() => changeSort("status")} className="flex items-center gap-1 px-4 py-3 hover:text-blue-600">Status {sortIcon("status")}</button></th><th className="px-4 py-3">Lokasi</th>
        </tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {loading && Array.from({ length: 6 }).map((_, index) => <tr key={index} className="animate-pulse"><td className="px-4 py-4"><div className="h-4 w-44 rounded bg-slate-200 dark:bg-slate-700" /><div className="mt-2 h-3 w-64 rounded bg-slate-100 dark:bg-slate-800" /></td><td className="px-4 py-4"><div className="h-5 w-24 rounded-full bg-slate-200 dark:bg-slate-700" /></td><td className="px-4 py-4"><div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-700" /></td><td className="px-4 py-4"><div className="h-5 w-20 rounded-full bg-slate-200 dark:bg-slate-700" /></td><td className="px-4 py-4"><div className="h-4 w-28 rounded bg-slate-200 dark:bg-slate-700" /></td></tr>)}
          {!loading && error && <tr><td colSpan={5} className="px-4 py-12 text-center text-rose-600">{error}</td></tr>}
          {!loading && !error && schedules.length === 0 && <tr><td colSpan={5} className="px-4 py-14 text-center"><p className="font-semibold text-slate-700 dark:text-slate-200">Tidak ada schedule yang cocok.</p><p className="mt-1 text-sm text-slate-500">Ubah kata kunci atau hapus filter yang sedang aktif.</p>{activeFilters.length > 0 && <button onClick={resetAll} className="mt-3 text-sm font-semibold text-blue-600">Reset semua filter</button>}</td></tr>}
          {!loading && !error && schedules.map((schedule) => <tr key={schedule.id} className="text-slate-700 dark:text-slate-300"><td className="px-4 py-3"><p className="font-semibold text-slate-900 dark:text-slate-100">{schedule.title}</p><p className="max-w-sm truncate text-xs text-slate-500">{schedule.description || "—"}</p></td><td className="px-4 py-3"><span className="rounded-full bg-indigo-50 px-2 py-1 text-xs text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">{CATEGORY_OPTIONS.find(([value]) => value === schedule.category)?.[1] || schedule.category}</span></td><td className="px-4 py-3 whitespace-nowrap">{formatDate(schedule.startDate)}</td><td className="px-4 py-3"><span className="rounded-full bg-slate-100 px-2 py-1 text-xs dark:bg-slate-800">{statusLabel[schedule.status] || schedule.status}</span></td><td className="px-4 py-3">{schedule.locationName}</td></tr>)}
        </tbody></table></div>
        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm dark:border-slate-800"><span>Halaman {filters.page} dari {totalPages}</span><div className="flex gap-2"><button disabled={filters.page <= 1} onClick={() => updateFilters({ page: filters.page - 1 }, false)} className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700">Sebelumnya</button><button disabled={filters.page >= totalPages} onClick={() => updateFilters({ page: filters.page + 1 }, false)} className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700">Berikutnya</button></div></div>
      </section>
    </main>
  );
}
