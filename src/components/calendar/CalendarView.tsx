"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { EventDTO, UserDTO } from "@/lib/types";
import {
  CATEGORY_META,
  PRIORITY_META,
  STATUS_META,
  formatDateIndo,
  formatTimeRange,
  formatRupiah,
  DEPARTMENTS,
} from "@/lib/utils";
import {
  format,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
  addDays,
  subDays,
  addWeeks,
  subWeeks,
  getHours,
  differenceInMinutes,
  addMinutes,
} from "date-fns";
import { id } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Filter,
  Plus,
  Search,
  Clock,
  MapPin,
  Users,
  LayoutGrid,
  Columns,
  List,
  CalendarCheck,
  FileSpreadsheet,
  FileText,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Move,
  RotateCcw,
} from "lucide-react";
import { useNotifications } from "@/context/NotificationContext";
import { useAuth } from "@/context/AuthContext";
import { exportToExcel, exportToPDF } from "@/lib/export-utils";

type CalendarViewMode = "month" | "week" | "day" | "list";

interface CalendarViewProps {
  initialEvents?: EventDTO[];
}

export default function CalendarView({ initialEvents }: CalendarViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { showToast } = useNotifications();
  const { currentUser, isAdmin } = useAuth();

  // Read initial filter values from URL params
  const initialViewMode = (searchParams.get("view") as CalendarViewMode) || "month";
  const initialSearch = searchParams.get("search") || "";
  const initialCategory = searchParams.get("category") || "ALL";
  const initialStatus = searchParams.get("status") || "ALL";
  const initialPriority = searchParams.get("priority") || "ALL";
  const initialPicId = searchParams.get("picId") || "ALL";
  const initialStartDate = searchParams.get("startDate") || "";
  const initialEndDate = searchParams.get("endDate") || "";
  const initialSortBy = searchParams.get("sortBy") || "startDate";
  const initialSortOrder = (searchParams.get("sortOrder") as "asc" | "desc") || "asc";

  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>(initialViewMode);
  const [events, setEvents] = useState<EventDTO[]>(initialEvents || []);
  const [loading, setLoading] = useState(!initialEvents);
  const [users, setUsers] = useState<UserDTO[]>([]);

  // Filter states
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedStatus, setSelectedStatus] = useState<string>(initialStatus);
  const [selectedPriority, setSelectedPriority] = useState<string>(initialPriority);
  const [selectedPicId, setSelectedPicId] = useState<string>(initialPicId);
  const [filterStartDate, setFilterStartDate] = useState<string>(initialStartDate);
  const [filterEndDate, setFilterEndDate] = useState<string>(initialEndDate);

  // Sorting state for list/table view
  const [sortBy, setSortBy] = useState<string>(initialSortBy);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(initialSortOrder);

  // Drag & drop state for reschedule
  const [draggedEventId, setDraggedEventId] = useState<string | null>(null);

  // Sync state changes to URL query parameters
  const updateURLParams = useCallback(
    (params: Record<string, string | undefined>) => {
      const sp = new URLSearchParams(searchParams.toString());
      Object.entries(params).forEach(([key, val]) => {
        if (!val || val === "ALL") {
          sp.delete(key);
        } else {
          sp.set(key, val);
        }
      });
      router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/events");
      if (res.ok) {
        const data = await res.json();
        setEvents(Array.isArray(data) ? data : []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchUsers();

    const handleRefresh = () => fetchEvents();
    window.addEventListener("refresh-events", handleRefresh);
    return () => window.removeEventListener("refresh-events", handleRefresh);
  }, []);

  // Update URL whenever filters change
  const handleFilterChange = (key: string, value: string) => {
    if (key === "category") {
      setSelectedCategory(value);
      updateURLParams({ category: value });
    } else if (key === "status") {
      setSelectedStatus(value);
      updateURLParams({ status: value });
    } else if (key === "priority") {
      setSelectedPriority(value);
      updateURLParams({ priority: value });
    } else if (key === "picId") {
      setSelectedPicId(value);
      updateURLParams({ picId: value });
    } else if (key === "startDate") {
      setFilterStartDate(value);
      updateURLParams({ startDate: value });
    } else if (key === "endDate") {
      setFilterEndDate(value);
      updateURLParams({ endDate: value });
    } else if (key === "search") {
      setSearchQuery(value);
      updateURLParams({ search: value });
    } else if (key === "view") {
      setViewMode(value as CalendarViewMode);
      updateURLParams({ view: value });
    }
  };

  const handleResetFilters = () => {
    setSelectedCategory("ALL");
    setSelectedStatus("ALL");
    setSelectedPriority("ALL");
    setSelectedPicId("ALL");
    setFilterStartDate("");
    setFilterEndDate("");
    setSearchQuery("");
    updateURLParams({
      category: "ALL",
      status: "ALL",
      priority: "ALL",
      picId: "ALL",
      startDate: undefined,
      endDate: undefined,
      search: undefined,
    });
    showToast("info", "Filter Direset", "Semua filter telah dikembalikan ke awal.");
  };

  // Filtered & Sorted events
  const filteredEvents = useMemo(() => {
    const list = events.filter((event) => {
      if (selectedCategory !== "ALL" && event.category !== selectedCategory) return false;
      if (selectedStatus !== "ALL" && event.status !== selectedStatus) return false;
      if (selectedPriority !== "ALL" && event.priority !== selectedPriority) return false;
      if (selectedPicId !== "ALL" && !event.assignees?.some((a) => a.userId === selectedPicId)) return false;

      // Date range filter
      if (filterStartDate) {
        const startLimit = new Date(filterStartDate);
        if (new Date(event.startDate) < startLimit) return false;
      }
      if (filterEndDate) {
        const endLimit = new Date(filterEndDate);
        endLimit.setHours(23, 59, 59, 999);
        if (new Date(event.endDate) > endLimit) return false;
      }

      // Search query (title, description, locationName, and participant/assignee name)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = event.title.toLowerCase().includes(q);
        const matchLoc = event.locationName.toLowerCase().includes(q);
        const matchDesc = event.description?.toLowerCase().includes(q) || false;
        const matchPic = event.assignees?.some((a) => a.user?.name.toLowerCase().includes(q)) || false;

        if (!matchTitle && !matchLoc && !matchDesc && !matchPic) return false;
      }

      return true;
    });

    // Sorting
    list.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "startDate") {
        comparison = new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
      } else if (sortBy === "title") {
        comparison = a.title.localeCompare(b.title);
      } else if (sortBy === "status") {
        comparison = a.status.localeCompare(b.status);
      } else if (sortBy === "category") {
        comparison = a.category.localeCompare(b.category);
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return list;
  }, [
    events,
    selectedCategory,
    selectedStatus,
    selectedPriority,
    selectedPicId,
    filterStartDate,
    filterEndDate,
    searchQuery,
    sortBy,
    sortOrder,
  ]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      const nextOrder = sortOrder === "asc" ? "desc" : "asc";
      setSortOrder(nextOrder);
      updateURLParams({ sortOrder: nextOrder });
    } else {
      setSortBy(field);
      setSortOrder("asc");
      updateURLParams({ sortBy: field, sortOrder: "asc" });
    }
  };

  // Drag and drop reschedule
  const handleReschedule = async (eventId: string, targetDate: Date) => {
    const targetEvent = events.find((e) => e.id === eventId);
    if (!targetEvent) return;

    try {
      const origStart = parseISO(targetEvent.startDate);
      const origEnd = parseISO(targetEvent.endDate);
      const durationMin = differenceInMinutes(origEnd, origStart);

      const newStart = new Date(targetDate);
      newStart.setHours(origStart.getHours(), origStart.getMinutes(), 0, 0);
      const newEnd = addMinutes(newStart, durationMin > 0 ? durationMin : 60);

      const res = await fetch(`/api/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate: newStart.toISOString(),
          endDate: newEnd.toISOString(),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        showToast("error", "Gagal Reschedule", err.error || "Gagal mengubah tanggal agenda.");
        return;
      }

      showToast(
        "success",
        "Jadwal Dipindahkan (Rescheduled)",
        `Agenda "${targetEvent.title}" berhasil dipindahkan ke ${formatDateIndo(newStart, "EEEE, d MMMM yyyy")}.`
      );
      fetchEvents();
    } catch {
      showToast("error", "Error", "Terjadi kesalahan saat memindahkan jadwal.");
    }
  };

  // Export handlers
  const handleExportPDF = () => {
    try {
      exportToPDF(
        filteredEvents,
        {
          search: searchQuery,
          category: selectedCategory,
          status: selectedStatus,
          startDate: filterStartDate,
          endDate: filterEndDate,
        },
        currentUser?.name || "Administrator"
      );
      showToast("success", "Export PDF Berhasil", `Laporan ${filteredEvents.length} agenda telah diunduh.`);
    } catch (err: any) {
      showToast("error", "Gagal Export", err.message || "Gagal membuat dokumen PDF.");
    }
  };

  const handleExportExcel = () => {
    try {
      exportToExcel(filteredEvents, {
        search: searchQuery,
        category: selectedCategory,
        status: selectedStatus,
        startDate: filterStartDate,
        endDate: filterEndDate,
      });
      showToast("success", "Export Excel Berhasil", `Data mentah ${filteredEvents.length} agenda (.xlsx) berhasil diunduh.`);
    } catch (err: any) {
      showToast("error", "Gagal Export", err.message || "Gagal membuat file Excel.");
    }
  };

  // Navigation handlers
  const handlePrev = () => {
    if (viewMode === "month") setCurrentDate((d) => subMonths(d, 1));
    else if (viewMode === "week") setCurrentDate((d) => subWeeks(d, 1));
    else if (viewMode === "day") setCurrentDate((d) => subDays(d, 1));
  };

  const handleNext = () => {
    if (viewMode === "month") setCurrentDate((d) => addMonths(d, 1));
    else if (viewMode === "week") setCurrentDate((d) => addWeeks(d, 1));
    else if (viewMode === "day") setCurrentDate((d) => addDays(d, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleOpenDetail = (eventId: string) => {
    window.dispatchEvent(new CustomEvent("open-event-detail", { detail: { eventId } }));
  };

  const handleOpenCreate = (targetDate?: Date) => {
    window.dispatchEvent(
      new CustomEvent("open-create-event", {
        detail: targetDate ? { date: targetDate.toISOString() } : undefined,
      })
    );
  };

  // Date intervals
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const monthDays = eachDayOfInterval({ start: startDate, end: endDate });

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const getEventsForDay = (day: Date) => {
    return filteredEvents.filter((e) => {
      const eStart = parseISO(e.startDate);
      const eEnd = parseISO(e.endDate);
      return isSameDay(day, eStart) || isSameDay(day, eEnd) || (day > eStart && day < eEnd);
    });
  };

  const DAYS_HEADER = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
  const HOURS = Array.from({ length: 14 }, (_, i) => i + 8); // 08:00 - 21:00

  return (
    <div className="space-y-4 animate-in fade-in">
      {/* Top Header & View Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white dark:bg-[#0c1220] p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          {/* Navigation Controls */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-2xl p-1 border border-slate-200 dark:border-slate-700">
            <button
              onClick={handlePrev}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-3.5 py-1 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              Hari Ini
            </button>
            <button
              onClick={handleNext}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 capitalize flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-blue-500" />
            <span>
              {viewMode === "day"
                ? format(currentDate, "EEEE, d MMMM yyyy", { locale: id })
                : format(currentDate, "MMMM yyyy", { locale: id })}
            </span>
          </h2>

          <div className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">
            {filteredEvents.length} Agenda
          </div>
        </div>

        {/* View Mode Switcher + Export Buttons */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Calendar View Mode Buttons */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200 dark:border-slate-700/60">
            <button
              onClick={() => handleFilterChange("view", "month")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === "month"
                  ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Bulan</span>
            </button>

            <button
              onClick={() => handleFilterChange("view", "week")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === "week"
                  ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Minggu</span>
            </button>

            <button
              onClick={() => handleFilterChange("view", "day")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === "day"
                  ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Hari</span>
            </button>

            <button
              onClick={() => handleFilterChange("view", "list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === "list"
                  ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Tabel / List</span>
            </button>
          </div>

          {/* Export Buttons (Section E) */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleExportPDF}
              title="Ekspor laporan format PDF (sesuai filter aktif)"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-bold transition-all"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Export PDF</span>
            </button>

            <button
              onClick={handleExportExcel}
              title="Ekspor data mentah Excel .xlsx (sesuai filter aktif)"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold transition-all"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export Excel</span>
            </button>
          </div>

          {/* Tambah Agenda Button */}
          <button
            onClick={() => handleOpenCreate()}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Agenda</span>
          </button>
        </div>
      </div>

      {/* Comprehensive Filter & Search Bar (Section C) */}
      <div className="bg-white dark:bg-[#0c1220] p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 space-y-3 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Real-time Debounce Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              placeholder="Cari judul, deskripsi, lokasi, atau nama peserta/PIC..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Kategori Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => handleFilterChange("category", e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold"
            >
              <option value="ALL">Semua Kategori</option>
              {Object.entries(CATEGORY_META).map(([key, meta]) => (
                <option key={key} value={key}>
                  {meta.label}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold"
            >
              <option value="ALL">Semua Status</option>
              <option value="UPCOMING">Upcoming</option>
              <option value="IN_PROGRESS">Ongoing (Berjalan)</option>
              <option value="COMPLETED">Selesai</option>
              <option value="CANCELLED">Dibatalkan</option>
            </select>

            {/* PIC / User Filter */}
            <select
              value={selectedPicId}
              onChange={(e) => handleFilterChange("picId", e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold"
            >
              <option value="ALL">Semua PIC / Pemilik</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>

            {/* Date Range Start */}
            <input
              type="date"
              value={filterStartDate}
              onChange={(e) => handleFilterChange("startDate", e.target.value)}
              title="Filter Tanggal Mulai"
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold"
            />

            <span className="text-slate-400">s/d</span>

            {/* Date Range End */}
            <input
              type="date"
              value={filterEndDate}
              onChange={(e) => handleFilterChange("endDate", e.target.value)}
              title="Filter Tanggal Selesai"
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold"
            />

            <button
              onClick={handleResetFilters}
              title="Reset semua filter"
              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Drag & Drop Hint Banner */}
        <div className="flex items-center gap-2 text-[11px] text-blue-600 dark:text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-xl border border-blue-500/20">
          <Move className="w-3.5 h-3.5 shrink-0" />
          <span>
            <strong>Fitur Drag & Drop Reschedule:</strong> Anda dapat menarik (drag) chip agenda dan menjatuhkannya (drop) ke tanggal lain untuk mengubah jadwal secara instan!
          </span>
        </div>
      </div>

      {/* ==================== VIEW 1: MONTH GRID ==================== */}
      {viewMode === "month" && (
        <div className="bg-white dark:bg-[#0c1220] rounded-3xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden shadow-sm">
          {/* Days Header */}
          <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-center py-2.5 text-xs font-extrabold text-slate-600 dark:text-slate-400">
            {DAYS_HEADER.map((day, idx) => (
              <div key={idx} className={idx >= 5 ? "text-rose-500 dark:text-rose-400" : ""}>
                {day}
              </div>
            ))}
          </div>

          {/* Month Grid Cells */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 dark:divide-slate-800/60">
            {monthDays.map((day, dIdx) => {
              const dayEvents = getEventsForDay(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const todayFlag = isToday(day);

              return (
                <div
                  key={dIdx}
                  onClick={() => handleOpenCreate(day)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const eventId = e.dataTransfer.getData("text/plain");
                    if (eventId) handleReschedule(eventId, day);
                  }}
                  className={`min-h-[110px] p-2 transition-all cursor-pointer relative group flex flex-col justify-between ${
                    !isCurrentMonth ? "bg-slate-50/40 dark:bg-slate-900/40 opacity-40" : ""
                  } ${todayFlag ? "bg-blue-50/30 dark:bg-blue-950/20 ring-1 ring-inset ring-blue-500/30" : "hover:bg-slate-50/80 dark:hover:bg-slate-800/30"}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-black inline-flex items-center justify-center w-6 h-6 rounded-full ${
                        todayFlag
                          ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30"
                          : "text-slate-700 dark:text-slate-300 group-hover:text-blue-500"
                      }`}
                    >
                      {format(day, "d")}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenCreate(day);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                      title="Tambah agenda pada hari ini"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Day Events Chips */}
                  <div className="space-y-1 flex-1">
                    {dayEvents.slice(0, 3).map((event) => {
                      const meta = CATEGORY_META[event.category] || CATEGORY_META.INTERNAL_TEAM;
                      return (
                        <div
                          key={event.id}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData("text/plain", event.id);
                            setDraggedEventId(event.id);
                          }}
                          onDragEnd={() => setDraggedEventId(null)}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDetail(event.id);
                          }}
                          className="px-2 py-1 rounded-lg text-[10px] font-bold border shadow-2xs truncate cursor-grab active:cursor-grabbing hover:scale-[1.02] transition-all"
                          style={{
                            backgroundColor: `${event.color || meta.color}18`,
                            borderColor: `${event.color || meta.color}40`,
                            color: event.color || meta.color,
                          }}
                          title={`${event.title} (${event.locationName}) - Drag untuk reschedule`}
                        >
                          <div className="flex items-center gap-1">
                            <span
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: event.color || meta.color }}
                            />
                            <span className="truncate">{event.title}</span>
                          </div>
                        </div>
                      );
                    })}

                    {dayEvents.length > 3 && (
                      <div className="text-[10px] text-slate-400 font-semibold px-1">
                        +{dayEvents.length - 3} lainnya
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================== VIEW 2: WEEK VIEW ==================== */}
      {viewMode === "week" && (
        <div className="bg-white dark:bg-[#0c1220] rounded-3xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden shadow-sm">
          <div className="grid grid-cols-8 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-center py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400">
            <div className="text-slate-400">Waktu</div>
            {weekDays.map((day, idx) => (
              <div key={idx} className={isToday(day) ? "text-blue-600 dark:text-blue-400 font-extrabold" : ""}>
                <p>{DAYS_HEADER[idx]}</p>
                <p className="text-[11px] font-normal">{format(day, "d MMM")}</p>
              </div>
            ))}
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-[600px] overflow-y-auto">
            {HOURS.map((hour) => (
              <div key={hour} className="grid grid-cols-8 min-h-[60px] divide-x divide-slate-100 dark:divide-slate-800/60">
                <div className="p-2 text-center text-[11px] font-mono text-slate-400 border-r border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/20">
                  {String(hour).padStart(2, "0")}:00
                </div>

                {weekDays.map((day, dIdx) => {
                  const matchingEvents = getEventsForDay(day).filter((e) => {
                    const h = getHours(parseISO(e.startDate));
                    return h === hour;
                  });

                  return (
                    <div
                      key={dIdx}
                      onClick={() => handleOpenCreate(day)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const eventId = e.dataTransfer.getData("text/plain");
                        if (eventId) handleReschedule(eventId, day);
                      }}
                      className="p-1 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer relative"
                    >
                      {matchingEvents.map((ev) => {
                        const meta = CATEGORY_META[ev.category] || CATEGORY_META.INTERNAL_TEAM;
                        return (
                          <div
                            key={ev.id}
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData("text/plain", ev.id);
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDetail(ev.id);
                            }}
                            className="p-1.5 rounded-xl border text-[11px] font-bold shadow-xs cursor-grab mb-1"
                            style={{
                              backgroundColor: `${ev.color || meta.color}20`,
                              borderColor: `${ev.color || meta.color}50`,
                              color: ev.color || meta.color,
                            }}
                          >
                            <p className="truncate">{ev.title}</p>
                            <p className="text-[10px] opacity-80 truncate">{ev.locationName}</p>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================== VIEW 3: DAY VIEW ==================== */}
      {viewMode === "day" && (
        <div className="bg-white dark:bg-[#0c1220] rounded-3xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
              Jadwal Tanggal: {format(currentDate, "EEEE, d MMMM yyyy", { locale: id })}
            </h3>
            <button
              onClick={() => handleOpenCreate(currentDate)}
              className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah di Hari Ini</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[600px] overflow-y-auto">
            {HOURS.map((hour) => {
              const hourEvents = getEventsForDay(currentDate).filter((e) => {
                const h = getHours(parseISO(e.startDate));
                return h === hour;
              });

              return (
                <div key={hour} className="flex min-h-[64px]">
                  <div className="w-20 p-3 text-right font-mono text-xs font-bold text-slate-400 border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 shrink-0">
                    {String(hour).padStart(2, "0")}:00
                  </div>

                  <div
                    onClick={() => handleOpenCreate(currentDate)}
                    className="flex-1 p-2 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors flex flex-wrap gap-2 items-center cursor-pointer"
                  >
                    {hourEvents.map((ev) => {
                      const meta = CATEGORY_META[ev.category] || CATEGORY_META.INTERNAL_TEAM;
                      return (
                        <div
                          key={ev.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDetail(ev.id);
                          }}
                          className="px-3 py-2 rounded-2xl border text-xs font-bold shadow-sm cursor-pointer flex items-center gap-3"
                          style={{
                            backgroundColor: `${ev.color || meta.color}15`,
                            borderColor: `${ev.color || meta.color}40`,
                            color: ev.color || meta.color,
                          }}
                        >
                          <div>
                            <p className="font-extrabold">{ev.title}</p>
                            <p className="text-[10px] opacity-80">
                              {formatTimeRange(ev.startDate, ev.endDate)} • {ev.locationName}
                            </p>
                          </div>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/50 dark:bg-black/30">
                            {ev.status}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================== VIEW 4: LIST / TABLE VIEW WITH COLUMN SORTING ==================== */}
      {viewMode === "list" && (
        <div className="bg-white dark:bg-[#0c1220] rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th
                    onClick={() => handleSort("title")}
                    className="py-3.5 px-4 cursor-pointer hover:text-blue-500 transition-colors select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Judul Agenda</span>
                      {sortBy === "title" ? (
                        sortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-blue-500" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-500" />
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />
                      )}
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort("category")}
                    className="py-3.5 px-4 cursor-pointer hover:text-blue-500 transition-colors select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Kategori</span>
                      {sortBy === "category" ? (
                        sortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-blue-500" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-500" />
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />
                      )}
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort("startDate")}
                    className="py-3.5 px-4 cursor-pointer hover:text-blue-500 transition-colors select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Waktu Mulai</span>
                      {sortBy === "startDate" ? (
                        sortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-blue-500" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-500" />
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />
                      )}
                    </div>
                  </th>

                  <th className="py-3.5 px-4">Lokasi / Ruangan</th>

                  <th
                    onClick={() => handleSort("status")}
                    className="py-3.5 px-4 cursor-pointer hover:text-blue-500 transition-colors select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Status</span>
                      {sortBy === "status" ? (
                        sortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-blue-500" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-500" />
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />
                      )}
                    </div>
                  </th>

                  <th className="py-3.5 px-4">PIC / Peserta</th>
                  <th className="py-3.5 px-4 text-right">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {filteredEvents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      Tidak ada agenda yang cocok dengan kriteria filter.
                    </td>
                  </tr>
                ) : (
                  filteredEvents.map((event) => {
                    const meta = CATEGORY_META[event.category] || CATEGORY_META.INTERNAL_TEAM;
                    const statMeta = STATUS_META[event.status] || STATUS_META.UPCOMING;

                    return (
                      <tr
                        key={event.id}
                        onClick={() => handleOpenDetail(event.id)}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                      >
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 dark:text-slate-100 hover:text-blue-500 transition-colors">
                            {event.title}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate max-w-xs">
                            {event.description || "—"}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${meta.bg} ${meta.text} ${meta.border}`}
                          >
                            {meta.label}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                          <div>{formatDateIndo(event.startDate, "d MMM yyyy")}</div>
                          <div className="text-[11px] text-slate-400">
                            {formatTimeRange(event.startDate, event.endDate, event.isAllDay)}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                            <span>{event.locationName}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md border ${statMeta.bg} ${statMeta.text} ${statMeta.border}`}
                          >
                            {statMeta.label}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                            <Users className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span>
                              {event.assignees?.map((a) => a.user.name.split(",")[0]).join(", ") || "—"}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                            {event.progress}%
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
