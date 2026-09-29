"use client";

import React, { useState, useEffect } from "react";
import { EventDTO } from "@/lib/types";
import { formatDateIndo, formatTimeRange, formatRupiah, DEPARTMENTS } from "@/lib/utils";
import { useNotifications } from "@/context/NotificationContext";
import {
  X,
  FileSpreadsheet,
  Printer,
  Download,
  Filter,
  Calendar,
  Check,
} from "lucide-react";

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ExportReportModal({
  isOpen,
  onClose,
}: ExportReportModalProps) {
  const { showToast } = useNotifications();

  const [events, setEvents] = useState<EventDTO[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [exportType, setExportType] = useState<"CSV" | "PRINT">("CSV");

  useEffect(() => {
    if (isOpen) {
      fetch("/api/events")
        .then((res) => res.json())
        .then((data) => setEvents(Array.isArray(data) ? data : []))
        .catch(() => {});
    }
  }, [isOpen]);

  const filtered = events.filter((e) => {
    if (selectedDept !== "ALL" && e.department !== selectedDept) return false;
    if (selectedStatus !== "ALL" && e.status !== selectedStatus) return false;
    return true;
  });

  const handleExportCSV = () => {
    if (filtered.length === 0) {
      showToast("error", "Data Kosong", "Tidak ada data untuk diexport");
      return;
    }

    const headers = [
      "ID",
      "Judul Agenda",
      "Kategori",
      "Prioritas",
      "Status",
      "Mulai",
      "Selesai",
      "Lokasi",
      "Divisi",
      "PIC",
      "Anggaran (Rp)",
      "Progress (%)",
    ];

    const rows = filtered.map((e) => [
      `"${e.id}"`,
      `"${e.title.replace(/"/g, '""')}"`,
      `"${e.category}"`,
      `"${e.priority}"`,
      `"${e.status}"`,
      `"${formatDateIndo(e.startDate)} ${formatTimeRange(e.startDate, e.endDate)}"`,
      `"${formatDateIndo(e.endDate)}"`,
      `"${e.locationName.replace(/"/g, '""')}"`,
      `"${e.department}"`,
      `"${e.assignees.map((a) => a.user.name).join("; ")}"`,
      `"${e.budget || 0}"`,
      `"${e.progress || 0}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_JadwalKu_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("success", "File CSV Berhasil Diunduh", `Diexport ${filtered.length} agenda.`);
    onClose();
  };

  const handlePrint = () => {
    window.print();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Download className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Export Laporan Penjadwalan
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Cetak atau unduh rekap seluruh agenda dan anggaran divisi
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Format Selection */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setExportType("CSV")}
              className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all ${
                exportType === "CSV"
                  ? "border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 ring-1 ring-blue-500"
                  : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
              }`}
            >
              <FileSpreadsheet className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold">Spreadsheet CSV / Excel</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Format tabel data terstruktur</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setExportType("PRINT")}
              className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all ${
                exportType === "PRINT"
                  ? "border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 ring-1 ring-blue-500"
                  : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
              }`}
            >
              <Printer className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold">Cetak / PDF View</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Tampilan cetak siap rapat</p>
              </div>
            </button>
          </div>

          {/* Filter Parameters */}
          <div className="space-y-3 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Divisi Penyelenggara
              </label>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 text-xs"
              >
                <option value="ALL">Semua Divisi</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Status Agenda
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 text-xs"
              >
                <option value="ALL">Semua Status</option>
                <option value="UPCOMING">Mendatang (Upcoming)</option>
                <option value="IN_PROGRESS">Sedang Berjalan</option>
                <option value="COMPLETED">Selesai Terlaksana</option>
              </select>
            </div>
          </div>

          {/* Preview count */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Jumlah agenda terfilter:</span>
            <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
              {filtered.length} kegiatan
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5 bg-slate-50/50 dark:bg-slate-800/30">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={exportType === "CSV" ? handleExportCSV : handlePrint}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/25 active:scale-95 transition-all flex items-center gap-1.5"
          >
            {exportType === "CSV" ? (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Unduh File CSV</span>
              </>
            ) : (
              <>
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak / Simpan PDF</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
