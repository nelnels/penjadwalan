"use client";

import React, { useState, useEffect } from "react";
import { ScheduleConflict, EventDTO } from "@/lib/types";
import { formatDateIndo, formatTimeRange } from "@/lib/utils";
import { useNotifications } from "@/context/NotificationContext";
import { useAuth } from "@/context/AuthContext";
import {
  AlertOctagon,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Calendar,
  Clock,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";

export default function ConflictCenter() {
  const { showToast } = useNotifications();
  const { isManager } = useAuth();

  const [conflicts, setConflicts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);

  const fetchConflicts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/conflicts");
      if (res.ok) {
        const data = await res.json();
        setConflicts(Array.isArray(data) ? data : []);
      }
    } catch {
      showToast("error", "Error", "Gagal memuat daftar bentrok jadwal");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConflicts();
    const handleRefresh = () => fetchConflicts();
    window.addEventListener("refresh-events", handleRefresh);
    return () => window.removeEventListener("refresh-events", handleRefresh);
  }, []);

  const handleAutoResolve = async (conflict: any) => {
    try {
      setReschedulingId(conflict.id);
      // 1. Find next open slot for event A
      const slotRes = await fetch("/api/conflicts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "FIND_SLOT",
          startDate: conflict.eventA.startDate,
          durationMinutes: 120,
          locationName: conflict.eventA.locationName,
        }),
      });

      if (!slotRes.ok) throw new Error("Gagal mencari slot baru");
      const slotData = await slotRes.json();

      if (slotData.recommendedSlot) {
        // 2. Reschedule Event A
        const updateRes = await fetch(`/api/events/${conflict.eventA.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            startDate: slotData.recommendedSlot.startDate,
            endDate: slotData.recommendedSlot.endDate,
          }),
        });

        if (updateRes.ok) {
          showToast(
            "success",
            "Jadwal Berhasil Disesuaikan!",
            `Agenda "${conflict.eventA.title}" dialihkan ke slot bebas bentrok.`
          );
          fetchConflicts();
          window.dispatchEvent(new CustomEvent("refresh-events"));
        }
      }
    } catch (err: any) {
      showToast("error", "Gagal Menyesuaikan Jadwal", err.message || "Silakan atur manual");
    } finally {
      setReschedulingId(null);
    }
  };

  const handleOpenDetail = (eventId: string) => {
    window.dispatchEvent(new CustomEvent("open-event-detail", { detail: { eventId } }));
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl border border-indigo-900/50 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <AlertOctagon className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
              Smart Conflict Resolution Engine
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            Pusat Deteksi & Penanganan Bentrok Jadwal
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Algoritma otomatis mendeteksi tumpang tindih penggunaan fasilitas/ruangan dan jadwal ganda
            pada Person in Charge (PIC) untuk mencegah tabrakan agenda organisasi.
          </p>
        </div>

        <div className="absolute right-6 -bottom-10 opacity-10 pointer-events-none hidden md:block">
          <AlertOctagon className="w-64 h-64 text-white" />
        </div>
      </div>

      {/* Conflicts Content */}
      {conflicts.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-[#0c121e] rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
            Semua Jadwal & Alokasi Ruangan Terkoordinasi Sempurna
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            Tidak terdeteksi bentrok ruangan maupun double-booking PIC pada seluruh agenda organisasi mendatang.
          </p>
          <button
            onClick={fetchConflicts}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Cek Ulang Sinkronisasi
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Ditemukan {conflicts.length} Potensi Bentrok Jadwal
            </h3>

            <button
              onClick={fetchConflicts}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {conflicts.map((conflict) => (
              <div
                key={conflict.id}
                className="p-5 rounded-2xl bg-white dark:bg-[#0c121e] border border-amber-300 dark:border-amber-900/60 shadow-sm space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        conflict.type === "ROOM_OVERLAP"
                          ? "bg-rose-500 text-white"
                          : "bg-amber-500 text-white"
                      }`}
                    >
                      {conflict.type === "ROOM_OVERLAP" ? "Bentrok Ruangan (Kritis)" : "Overlap PIC (Peringatan)"}
                    </span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Entitas: {conflict.entityName}
                    </span>
                  </div>

                  <span className="text-xs font-mono text-slate-500">
                    Rentang Waktu: {conflict.timeRange}
                  </span>
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                  {conflict.description}
                </p>

                {/* Event Comparison Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div
                    onClick={() => handleOpenDetail(conflict.eventA.id)}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 hover:border-blue-500 cursor-pointer transition-all space-y-1"
                  >
                    <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400">
                      Agenda 1
                    </span>
                    <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 truncate">
                      {conflict.eventA.title}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {formatDateIndo(conflict.eventA.startDate)} • {formatTimeRange(conflict.eventA.startDate, conflict.eventA.endDate)}
                    </p>
                  </div>

                  <div
                    onClick={() => handleOpenDetail(conflict.eventB.id)}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 hover:border-blue-500 cursor-pointer transition-all space-y-1"
                  >
                    <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400">
                      Agenda 2 (Bertabrakan)
                    </span>
                    <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 truncate">
                      {conflict.eventB.title}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Klik untuk melihat detail agenda kedua
                    </p>
                  </div>
                </div>

                {/* Resolution Action */}
                {isManager && (
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      onClick={() => handleAutoResolve(conflict)}
                      disabled={reschedulingId === conflict.id}
                      className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>
                        {reschedulingId === conflict.id
                          ? "Menyesuaikan Jadwal..."
                          : "Alihkan ke Slot Bebas Bentrok Otomatis"}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
