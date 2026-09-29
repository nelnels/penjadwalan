"use client";

import React, { useState, useEffect } from "react";
import { EventDTO, TaskDTO } from "@/lib/types";
import {
  CATEGORY_META,
  PRIORITY_META,
  STATUS_META,
  formatDateIndo,
  formatTimeRange,
  formatRupiah,
  formatRelativeDate,
} from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationContext";
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  AlertTriangle,
  Building2,
  DollarSign,
  Edit3,
  Trash2,
  ExternalLink,
  Plus,
  CheckSquare,
  Square,
  Sparkles,
  Share2,
} from "lucide-react";
import confetti from "canvas-confetti";
import ConfirmDialog from "@/components/common/ConfirmDialog";

interface EventDetailModalProps {
  eventId: string;
  onClose: () => void;
  onEdit: (event: EventDTO) => void;
  onDeleted: () => void;
}

export default function EventDetailModal({
  eventId,
  onClose,
  onEdit,
  onDeleted,
}: EventDetailModalProps) {
  const { isManager, currentUser, canEditEvent, canDeleteEvent } = useAuth();
  const { showToast } = useNotifications();

  const [event, setEvent] = useState<EventDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fetchEventDetail = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/events/${eventId}`);
      if (res.ok) {
        const data = await res.json();
        setEvent(data);
      } else {
        showToast("error", "Error", "Agenda tidak ditemukan");
        onClose();
      }
    } catch {
      showToast("error", "Error", "Gagal memuat detail agenda");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (eventId) {
      fetchEventDetail();
    }
  }, [eventId]);

  const handleStatusChange = async (newStatus: string) => {
    if (!event) return;
    try {
      const res = await fetch(`/api/events/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          progress: newStatus === "COMPLETED" ? 100 : event.progress,
          updatedById: currentUser?.id,
        }),
      });
      if (res.ok) {
        setEvent({
          ...event,
          status: newStatus as any,
          progress: newStatus === "COMPLETED" ? 100 : event.progress,
        });
        showToast("success", "Status Diperbarui", `Status agenda menjadi ${newStatus}`);
        if (newStatus === "COMPLETED") {
          confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        }
      }
    } catch {
      showToast("error", "Error", "Gagal memperbarui status");
    }
  };

  const handleToggleSubtask = async (taskId: string, subtaskId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/subtasks`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subtaskId, isCompleted: !currentStatus }),
      });
      if (res.ok) {
        // Refresh event detail to get updated state
        fetchEventDetail();
        if (!currentStatus) {
          confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } });
        }
      }
    } catch {
      showToast("error", "Error", "Gagal update checklist");
    }
  };

  const handleAddQuickTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim() || !event) return;

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newSubtaskTitle,
          eventId: event.id,
          status: "TODO",
          priority: "MEDIUM",
          assigneeId: event.assignees[0]?.userId || currentUser?.id,
        }),
      });
      if (res.ok) {
        setNewSubtaskTitle("");
        fetchEventDetail();
        showToast("success", "Task Ditambahkan", "Task baru berhasil dikaitkan ke agenda ini");
      }
    } catch {
      showToast("error", "Error", "Gagal menambahkan task");
    }
  };

  const handleDeleteEvent = async () => {
    if (!event) return;
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/events/${event.id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("success", "Agenda Dihapus", "Agenda berhasil dihapus dari sistem");
        setShowDeleteConfirm(false);
        onDeleted();
      } else {
        const data = await res.json();
        showToast("error", "Gagal", data.error || "Gagal menghapus agenda");
      }
    } catch {
      showToast("error", "Error", "Gagal menghapus agenda");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast("info", "Link Disalin", "Tautan agenda berhasil disalin ke clipboard");
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Memuat detail agenda...
          </span>
        </div>
      </div>
    );
  }

  if (!event) return null;

  const categoryMeta = CATEGORY_META[event.category] || CATEGORY_META.INTERNAL_TEAM;
  const priorityMeta = PRIORITY_META[event.priority] || PRIORITY_META.MEDIUM;
  const statusMeta = STATUS_META[event.status] || STATUS_META.UPCOMING;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Ribbon / Category Indicator */}
        <div
          className="h-2.5 w-full"
          style={{ backgroundColor: event.color || categoryMeta.color }}
        />

        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${categoryMeta.bg} ${categoryMeta.text} ${categoryMeta.border}`}
              >
                {categoryMeta.label}
              </span>

              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1.5 ${priorityMeta.bg} ${priorityMeta.text}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${priorityMeta.dot}`} />
                {priorityMeta.label}
              </span>

              {/* Interactive Status Selector */}
              <select
                value={event.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md border cursor-pointer outline-none ${statusMeta.bg} ${statusMeta.text} ${statusMeta.border}`}
              >
                {Object.entries(STATUS_META).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>

            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100 leading-tight">
              {event.title}
            </h2>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleCopyLink}
              title="Salin Tautan"
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Share2 className="w-4 h-4" />
            </button>
            {event && canEditEvent(event) && (
              <button
                onClick={() => onEdit(event)}
                title="Edit Agenda"
                className="p-2 text-slate-400 hover:text-blue-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}
            {event && canDeleteEvent(event) && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isDeleting}
                title="Hapus Agenda"
                className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1">
          {/* Progress Bar & Key Meta Grid */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300">
                Tingkat Penyelesaian Program
              </span>
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                {event.progress}%
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
                style={{ width: `${event.progress}%` }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs border-t border-slate-200/70 dark:border-slate-700/60">
              <div className="flex items-start gap-2.5">
                <Calendar className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Jadwal & Waktu</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {formatDateIndo(event.startDate)}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {formatTimeRange(event.startDate, event.endDate, event.isAllDay)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Lokasi / Ruangan</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {event.locationName}
                  </p>
                  {event.locationUrl && (
                    <a
                      href={event.locationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                    >
                      Buka Virtual Meeting <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <DollarSign className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Divisi & Anggaran</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {event.department}
                  </p>
                  <p className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                    {formatRupiah(event.budget)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Deskripsi */}
          {event.description && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Deskripsi Kegiatan
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">
                {event.description}
              </p>
            </div>
          )}

          {/* Tim PIC Penanggung Jawab */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-blue-500" />
              Penanggung Jawab (PIC & Tim Pelaksana)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {event.assignees && event.assignees.length > 0 ? (
                event.assignees.map((assignee) => (
                  <div
                    key={assignee.id}
                    className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50"
                  >
                    <img
                      src={
                        assignee.user?.avatar ||
                        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
                      }
                      alt={assignee.user?.name}
                      className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                          {assignee.user?.name}
                        </p>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-mono font-semibold">
                          {assignee.roleInEvent.replace("_", " ")}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">
                        {assignee.user?.position} • {assignee.user?.department}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic">Belum ada PIC yang ditugaskan</p>
              )}
            </div>
          </div>

          {/* Milestones Timeline */}
          {event.milestones && event.milestones.length > 0 && (
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Target Milestone Acara
              </h4>

              <div className="space-y-2">
                {event.milestones.map((m, idx) => (
                  <div
                    key={m.id || idx}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                          m.isCompleted
                            ? "bg-emerald-500 text-white"
                            : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        {m.isCompleted ? "✓" : idx + 1}
                      </div>
                      <span
                        className={`font-semibold ${
                          m.isCompleted
                            ? "line-through text-slate-400 dark:text-slate-500"
                            : "text-slate-800 dark:text-slate-200"
                        }`}
                      >
                        {m.title}
                      </span>
                    </div>

                    <span className="text-[11px] text-slate-400 font-mono">
                      Target: {formatDateIndo(m.targetDate, "dd MMM yyyy")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Items Checklist / Subtasks */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4 text-emerald-500" />
                Action Items & Checklist Persiapan
              </h4>
            </div>

            {/* Checklist Tasks List */}
            <div className="space-y-2">
              {event.tasks && event.tasks.length > 0 ? (
                event.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {task.title}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            task.status === "DONE"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                              : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                          }`}
                        >
                          {task.status}
                        </span>
                      </div>
                      {task.assignee && (
                        <span className="text-[11px] text-slate-400">
                          PIC: {task.assignee.name.split(",")[0]}
                        </span>
                      )}
                    </div>

                    {/* Subitems */}
                    {task.subtasks && task.subtasks.length > 0 && (
                      <div className="space-y-1.5 pl-2 border-l-2 border-blue-500/30">
                        {task.subtasks.map((sub) => (
                          <div
                            key={sub.id}
                            onClick={() => handleToggleSubtask(task.id, sub.id, sub.isCompleted)}
                            className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer hover:text-blue-600 transition-colors"
                          >
                            {sub.isCompleted ? (
                              <CheckSquare className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            ) : (
                              <Square className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            )}
                            <span className={sub.isCompleted ? "line-through text-slate-400" : ""}>
                              {sub.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic">
                  Belum ada task action item khusus untuk agenda ini.
                </p>
              )}
            </div>

            {/* Quick Add Task Input */}
            <form onSubmit={handleAddQuickTask} className="flex gap-2">
              <input
                type="text"
                placeholder="+ Tambah Action Item / Task baru..."
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
              >
                Tambah
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
          <span className="text-[11px] text-slate-400">
            Dibuat oleh: {event.createdBy?.name || "Admin"} • {formatRelativeDate(event.createdAt)}
          </span>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Hapus Agenda"
        message={`Apakah Anda yakin ingin menghapus agenda "${event?.title}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Ya, Hapus Agenda"
        isLoading={isDeleting}
        onConfirm={handleDeleteEvent}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
