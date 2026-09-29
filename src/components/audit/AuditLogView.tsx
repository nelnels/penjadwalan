"use client";

import React, { useState, useEffect } from "react";
import { AuditLogDTO } from "@/lib/types";
import { formatDateIndo, formatRelativeDate } from "@/lib/utils";
import {
  History,
  Clock,
  User,
  Activity,
  PlusCircle,
  Edit,
  CheckCircle,
  Trash,
  RefreshCw,
} from "lucide-react";

export default function AuditLogView() {
  const [logs, setLogs] = useState<AuditLogDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/audit-logs");
      if (res.ok) {
        const data = await res.json();
        setLogs(Array.isArray(data) ? data : []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getActionBadge = (action: string) => {
    switch (action) {
      case "CREATE_EVENT":
        return { label: "Buat Agenda", bg: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" };
      case "UPDATE_EVENT":
        return { label: "Update Agenda", bg: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300" };
      case "COMPLETE_TASK":
        return { label: "Selesai Task", bg: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" };
      case "ASSIGN_PIC":
        return { label: "Penugasan PIC", bg: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300" };
      case "DELETE_EVENT":
        return { label: "Hapus Agenda", bg: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300" };
      default:
        return { label: action, bg: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" };
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0c121e] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        <div>
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Log Aktivitas & Audit Trail Sistem
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Rekam jejak setiap pembuatan agenda, pembaruan task, dan perubahan jadwal secara transparan
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Log</span>
        </button>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white dark:bg-[#0c121e] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Waktu</th>
                <th className="py-3 px-4">Pelaku (Actor)</th>
                <th className="py-3 px-4">Tindakan</th>
                <th className="py-3 px-4">Deskripsi Aktivitas</th>
                <th className="py-3 px-4">Target</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {logs.map((log) => {
                const badge = getActionBadge(log.action);
                return (
                  <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-500">
                      <p className="font-semibold text-slate-700 dark:text-slate-300">
                        {formatRelativeDate(log.createdAt)}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {formatDateIndo(log.createdAt, "dd/MM/yyyy HH:mm:ss")}
                      </p>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {log.user ? (
                        <div className="flex items-center gap-2">
                          <img
                            src={log.user.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
                            alt={log.user.name}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                          <div>
                            <p className="font-bold text-slate-900 dark:text-slate-100">
                              {log.user.name.split(",")[0]}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono">{log.user.role}</p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Sistem Otomatis</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${badge.bg}`}>
                        {badge.label}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-medium max-w-md">
                      {log.description}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                      {log.targetEntity || "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
