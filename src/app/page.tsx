"use client";

import React, { useState, useEffect } from "react";
import DashboardShell from "@/components/layout/DashboardShell";
import MetricsCards from "@/components/dashboard/MetricsCards";
import AnalyticsCharts from "@/components/dashboard/AnalyticsCharts";
import { DashboardStats, EventDTO } from "@/lib/types";
import { formatDateIndo, formatTimeRange, CATEGORY_META, PRIORITY_META, STATUS_META } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import {
  CalendarDays,
  Plus,
  FileSpreadsheet,
  FileText,
  Clock,
  MapPin,
  Users,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  User,
  UserCog,
  Layers,
  History,
  AlertOctagon,
  CheckCircle2,
  ListTodo,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { exportToExcel, exportToPDF } from "@/lib/export-utils";

export default function DashboardPage() {
  const { currentUser, isAdmin } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [allUpcomingEvents, setAllUpcomingEvents] = useState<EventDTO[]>([]);
  const [myEvents, setMyEvents] = useState<EventDTO[]>([]);
  const [myTasks, setMyTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // User Dashboard Tab: "MY_SCHEDULE" vs "ALL_SCHEDULE"
  const [userTab, setUserTab] = useState<"MY_SCHEDULE" | "ALL_SCHEDULE">("MY_SCHEDULE");

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, eventsRes, tasksRes] = await Promise.all([
        fetch("/api/stats"),
        fetch("/api/events?status=UPCOMING"),
        fetch("/api/tasks"),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        const eventList = Array.isArray(eventsData) ? eventsData : [];
        setAllUpcomingEvents(eventList);

        // Filter events belonging to current user (creator or assignee)
        if (currentUser) {
          const userSpecific = eventList.filter(
            (e: EventDTO) =>
              e.createdById === currentUser.id ||
              e.assignees?.some((a) => a.userId === currentUser.id)
          );
          setMyEvents(userSpecific);
        }
      }
      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        const taskList = Array.isArray(tasksData) ? tasksData : [];
        if (currentUser) {
          const assignedToMe = taskList.filter((t: any) => t.assigneeId === currentUser.id);
          setMyTasks(assignedToMe);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const handleRefresh = () => fetchDashboardData();
    window.addEventListener("refresh-events", handleRefresh);
    return () => window.removeEventListener("refresh-events", handleRefresh);
  }, [currentUser]);

  const handleOpenCreate = () => {
    window.dispatchEvent(new CustomEvent("open-create-event"));
  };

  const handleOpenDetail = (eventId: string) => {
    window.dispatchEvent(new CustomEvent("open-event-detail", { detail: { eventId } }));
  };

  const handleExportAllPDF = () => {
    const listToExport = !isAdmin && userTab === "MY_SCHEDULE" ? myEvents : allUpcomingEvents;
    exportToPDF(listToExport, undefined, currentUser?.name || "User");
  };

  const handleExportAllExcel = () => {
    const listToExport = !isAdmin && userTab === "MY_SCHEDULE" ? myEvents : allUpcomingEvents;
    exportToExcel(listToExport);
  };

  return (
    <DashboardShell>
      <div className="space-y-6 animate-in fade-in">
        {/* ========================================================= */}
        {/* TOP WELCOME BANNER (Differentiated for Admin vs User) */}
        {/* ========================================================= */}
        <div
          className={`rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-6 ${
            isAdmin
              ? "bg-gradient-to-r from-blue-700 via-indigo-700 to-cyan-600 shadow-blue-500/15"
              : "bg-gradient-to-r from-emerald-600 via-teal-700 to-cyan-700 shadow-emerald-500/15"
          }`}
        >
          <div className="space-y-2 max-w-xl z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold">
              {isAdmin ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                  <span className="font-bold tracking-wider uppercase">Portal Super Administrator</span>
                </>
              ) : (
                <>
                  <User className="w-3.5 h-3.5 text-teal-200" />
                  <span className="font-bold tracking-wider uppercase">Portal Anggota & Pelaksana</span>
                </>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Selamat Datang, {currentUser?.name?.split(",")[0] || "Pengguna"}!
            </h1>

            <p className="text-xs sm:text-sm text-white/90 leading-relaxed">
              {isAdmin
                ? "Anda memiliki kendali penuh: mengelola akun staf/anggota, master ruangan & kategori, serta memonitor seluruh jadwal dan potensi bentrok."
                : `Departemen: ${currentUser?.department || "Umum"} • Jabatan: ${currentUser?.position || "Staff"}. Kelola jadwal agenda pribadi dan pantau penugasan PIC Anda.`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 z-10 shrink-0">
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2.5 bg-white text-slate-900 hover:bg-slate-100 rounded-xl text-xs font-extrabold shadow-lg hover:shadow-xl active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4 text-blue-600" />
              <span>Buat Agenda Baru</span>
            </button>

            <button
              onClick={handleExportAllPDF}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white/20 hover:bg-white/30 border border-white/25 text-white rounded-xl text-xs font-bold backdrop-blur-md transition-all"
              title="Export Laporan PDF"
            >
              <FileText className="w-4 h-4" />
              <span>PDF</span>
            </button>

            <button
              onClick={handleExportAllExcel}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white/20 hover:bg-white/30 border border-white/25 text-white rounded-xl text-xs font-bold backdrop-blur-md transition-all"
              title="Export Laporan Excel .xlsx"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Excel</span>
            </button>
          </div>

          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        </div>

        {/* ========================================================= */}
        {/* ADMIN SHORTCUT PANEL (Only visible to Admin) */}
        {/* ========================================================= */}
        {isAdmin && (
          <div className="bg-white dark:bg-[#0c1220] p-5 rounded-3xl border border-amber-500/30 dark:border-amber-500/20 shadow-sm">
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <h3 className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  Pusat Kontrol Administrator (RBAC & Master Data)
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">
                Hak akses eksklusif Admin
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Link
                href="/admin/users"
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 hover:border-blue-500/50 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all flex items-center gap-3 group"
              >
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                  <UserCog className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600">
                    Kelola Pengguna
                  </h4>
                  <p className="text-[10px] text-slate-400">Tambah, edit, nonaktifkan user</p>
                </div>
              </Link>

              <Link
                href="/admin/master-data"
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 hover:border-indigo-500/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition-all flex items-center gap-3 group"
              >
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600">
                    Master Ruangan & Kategori
                  </h4>
                  <p className="text-[10px] text-slate-400">Kelola fasilitas & label warna</p>
                </div>
              </Link>

              <Link
                href="/conflicts"
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 hover:border-rose-500/50 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-all flex items-center gap-3 group"
              >
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform">
                  <AlertOctagon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-rose-600">
                    Deteksi Bentrok Jadwal
                  </h4>
                  <p className="text-[10px] text-slate-400">Smart Conflict Resolver</p>
                </div>
              </Link>

              <Link
                href="/audit"
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 hover:border-amber-500/50 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 transition-all flex items-center gap-3 group"
              >
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-amber-600">
                    Audit Log Aktivitas
                  </h4>
                  <p className="text-[10px] text-slate-400">Riwayat aksi & perubahan sistem</p>
                </div>
              </Link>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* USER PERSONALIZED KPI (Only visible to non-admin user) */}
        {/* ========================================================= */}
        {!isAdmin && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-[#0c1220] p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <CalendarDays className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-400">Agenda Saya (PIC)</p>
                <p className="text-xl font-black text-slate-900 dark:text-slate-100">
                  {myEvents.length}
                </p>
                <p className="text-[10px] text-blue-500 font-semibold">Terkait penugasan Anda</p>
              </div>
            </div>

            <div className="bg-white dark:bg-[#0c1220] p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <ListTodo className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-400">Tugas Ditugaskan</p>
                <p className="text-xl font-black text-slate-900 dark:text-slate-100">
                  {myTasks.length}
                </p>
                <p className="text-[10px] text-emerald-500 font-semibold">Di papan Kanban</p>
              </div>
            </div>

            <div className="bg-white dark:bg-[#0c1220] p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-400">Tugas Diselesaikan</p>
                <p className="text-xl font-black text-slate-900 dark:text-slate-100">
                  {myTasks.filter((t) => t.status === "DONE").length}
                </p>
                <p className="text-[10px] text-indigo-500 font-semibold">Pekerjaan tuntas</p>
              </div>
            </div>

            <div className="bg-white dark:bg-[#0c1220] p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-400">Total Agenda Publik</p>
                <p className="text-xl font-black text-slate-900 dark:text-slate-100">
                  {allUpcomingEvents.length}
                </p>
                <p className="text-[10px] text-amber-500 font-semibold">Di seluruh divisi</p>
              </div>
            </div>
          </div>
        )}

        {/* Global KPI Metrics (Shown for Admin) */}
        {isAdmin && stats && <MetricsCards stats={stats} />}

        {/* ========================================================= */}
        {/* UPCOMING EVENTS & RELEVANT SCHEDULE SECTION */}
        {/* ========================================================= */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-blue-500" />
                <span>
                  {isAdmin
                    ? "Agenda Terdekat Seluruh Organisasi"
                    : userTab === "MY_SCHEDULE"
                    ? "Agenda Saya & Ditugaskan (PIC)"
                    : "Semua Agenda Organisasi"}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {isAdmin
                  ? "Pantau seluruh timeline kegiatan divisi dengan hak kontrol penuh"
                  : "Lihat agenda yang relevan dengan tugas dan jadwal divisi Anda"}
              </p>
            </div>

            {/* Toggle Tab for User */}
            {!isAdmin ? (
              <div className="flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setUserTab("MY_SCHEDULE")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    userTab === "MY_SCHEDULE"
                      ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  Agenda Saya ({myEvents.length})
                </button>
                <button
                  onClick={() => setUserTab("ALL_SCHEDULE")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    userTab === "ALL_SCHEDULE"
                      ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  Semua Agenda ({allUpcomingEvents.length})
                </button>
              </div>
            ) : (
              <Link
                href="/calendar"
                className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1"
              >
                <span>Buka Tampilan Kalender Lengkap</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          {/* Cards Grid */}
          {(() => {
            const displayedEvents =
              !isAdmin && userTab === "MY_SCHEDULE" ? myEvents : allUpcomingEvents;

            if (displayedEvents.length === 0) {
              return (
                <div className="p-8 text-center bg-white dark:bg-[#0c1220] rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
                  <CalendarDays className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-bold">Belum ada agenda pada kategori ini.</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Klik &quot;Buat Agenda Baru&quot; untuk menambahkan jadwal.
                  </p>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {displayedEvents.slice(0, 3).map((event) => {
                  const meta = CATEGORY_META[event.category] || CATEGORY_META.INTERNAL_TEAM;
                  const prio = PRIORITY_META[event.priority] || PRIORITY_META.MEDIUM;

                  return (
                    <div
                      key={event.id}
                      onClick={() => handleOpenDetail(event.id)}
                      className="p-5 bg-white dark:bg-[#0c1220] rounded-3xl border border-slate-200/80 dark:border-slate-800/80 hover:border-blue-500/50 shadow-sm hover:shadow-md transition-all cursor-pointer space-y-3 flex flex-col justify-between group"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${meta.bg} ${meta.text} ${meta.border}`}
                          >
                            {meta.label}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${prio.bg} ${prio.text}`}
                          >
                            {prio.label}
                          </span>
                        </div>

                        <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition-colors line-clamp-2">
                          {event.title}
                        </h3>
                      </div>

                      <div className="space-y-1.5 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1.5 truncate">
                          <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span>{formatDateIndo(event.startDate)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 truncate">
                          <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span className="truncate">{event.locationName}</span>
                        </div>
                        <div className="flex items-center gap-1.5 truncate">
                          <Users className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span className="truncate">
                            PIC: {event.assignees[0]?.user.name.split(",")[0] || "Belum ada PIC"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>

        {/* Analytics & Visualizations Section (Recharts) */}
        {stats && <AnalyticsCharts stats={stats} />}
      </div>
    </DashboardShell>
  );
}
