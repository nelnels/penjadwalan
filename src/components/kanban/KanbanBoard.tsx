"use client";

import React, { useState, useEffect } from "react";
import { TaskDTO, TaskStatus, UserDTO, EventDTO } from "@/lib/types";
import { TASK_STATUS_META, PRIORITY_META, formatRelativeDate } from "@/lib/utils";
import { useNotifications } from "@/context/NotificationContext";
import { useAuth } from "@/context/AuthContext";
import {
  KanbanSquare,
  Plus,
  CheckCircle2,
  Clock,
  User,
  Calendar,
  ChevronRight,
  ChevronLeft,
  CheckSquare,
  Square,
  MoreVertical,
  Trash2,
} from "lucide-react";
import confetti from "canvas-confetti";

export default function KanbanBoard() {
  const { showToast } = useNotifications();
  const { currentUser, users } = useAuth();

  const [tasks, setTasks] = useState<TaskDTO[]>([]);
  const [events, setEvents] = useState<EventDTO[]>([]);
  const [loading, setLoading] = useState(true);

  // New task inline form state
  const [addingInColumn, setAddingInColumn] = useState<TaskStatus | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newAssigneeId, setNewAssigneeId] = useState("");
  const [newEventId, setNewEventId] = useState("");
  const [newPriority, setNewPriority] = useState<string>("MEDIUM");

  const fetchTasksAndEvents = async () => {
    try {
      setLoading(true);
      const [tasksRes, eventsRes] = await Promise.all([
        fetch("/api/tasks"),
        fetch("/api/events"),
      ]);

      if (tasksRes.ok) {
        const data = await tasksRes.json();
        setTasks(data);
      }
      if (eventsRes.ok) {
        const evData = await eventsRes.json();
        setEvents(evData);
      }
    } catch {
      showToast("error", "Error", "Gagal memuat task kanban");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasksAndEvents();
  }, []);

  const COLUMNS: { status: TaskStatus; label: string; bg: string; dot: string }[] = [
    { status: "TODO", label: "Belum Dikerjakan", bg: "bg-slate-500/10", dot: "bg-slate-400" },
    { status: "IN_PROGRESS", label: "Dalam Proses", bg: "bg-blue-500/10", dot: "bg-blue-500" },
    { status: "REVIEW", label: "Review & Evaluasi", bg: "bg-purple-500/10", dot: "bg-purple-500" },
    { status: "DONE", label: "Selesai", bg: "bg-emerald-500/10", dot: "bg-emerald-500" },
  ];

  const handleMoveStatus = async (task: TaskDTO, newStatus: TaskStatus) => {
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setTasks((prev) =>
          prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))
        );
        if (newStatus === "DONE") {
          confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
          showToast("success", "Task Selesai!", `"${task.title}" berhasil diselesaikan.`);
        }
      }
    } catch {
      showToast("error", "Error", "Gagal memperbarui status task");
    }
  };

  const handleToggleSubtask = async (taskId: string, subtaskId: string, current: boolean) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/subtasks`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subtaskId, isCompleted: !current }),
      });
      if (res.ok) {
        setTasks((prev) =>
          prev.map((t) => {
            if (t.id === taskId) {
              return {
                ...t,
                subtasks: t.subtasks.map((st) =>
                  st.id === subtaskId ? { ...st, isCompleted: !current } : st
                ),
              };
            }
            return t;
          })
        );
      }
    } catch {
      showToast("error", "Error", "Gagal update subtask");
    }
  };

  const handleCreateTask = async (status: TaskStatus) => {
    if (!newTitle.trim()) return;
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          status,
          priority: newPriority,
          assigneeId: newAssigneeId || currentUser?.id,
          eventId: newEventId || null,
        }),
      });
      if (res.ok) {
        const created = await res.json();
        setTasks((prev) => [created, ...prev]);
        setNewTitle("");
        setAddingInColumn(null);
        showToast("success", "Task Ditambahkan", `Task baru dibuat di kolom ${status}`);
      }
    } catch {
      showToast("error", "Error", "Gagal membuat task");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Hapus task ini?")) return;
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      if (res.ok) {
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
        showToast("success", "Dihapus", "Task telah dihapus");
      }
    } catch {
      showToast("error", "Error", "Gagal menghapus task");
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0c121e] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        <div>
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <KanbanSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Papan Tugas & Alur Kerja PIC (Kanban Board)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Kelola persiapan acara, alur tanggung jawab tim, dan daftar tugas action items
          </p>
        </div>

        <button
          onClick={() => setAddingInColumn("TODO")}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Task</span>
        </button>
      </div>

      {/* 4-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
        {COLUMNS.map((col, colIdx) => {
          const columnTasks = tasks.filter((t) => t.status === col.status);

          return (
            <div
              key={col.status}
              className="bg-slate-100/70 dark:bg-[#0c121e]/60 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-3.5 space-y-3 flex flex-col min-h-[500px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
                  <h3 className="font-extrabold text-xs text-slate-800 dark:text-slate-200">
                    {col.label}
                  </h3>
                </div>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-xs border border-slate-200 dark:border-slate-700">
                  {columnTasks.length}
                </span>
              </div>

              {/* Quick Add Form in Column */}
              {addingInColumn === col.status ? (
                <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-blue-500 shadow-md space-y-2 animate-in fade-in">
                  <input
                    type="text"
                    placeholder="Judul task baru..."
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    autoFocus
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold outline-none"
                  />
                  <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                    <select
                      value={newAssigneeId}
                      onChange={(e) => setNewAssigneeId(e.target.value)}
                      className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[11px]"
                    >
                      <option value="">Pilih PIC...</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name.split(",")[0]}
                        </option>
                      ))}
                    </select>
                    <select
                      value={newEventId}
                      onChange={(e) => setNewEventId(e.target.value)}
                      className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[11px]"
                    >
                      <option value="">Kaitkan Agenda...</option>
                      {events.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center justify-end gap-1.5 pt-1">
                    <button
                      onClick={() => setAddingInColumn(null)}
                      className="px-2.5 py-1 rounded-lg text-slate-400 hover:text-slate-600 text-xs"
                    >
                      Batal
                    </button>
                    <button
                      onClick={() => handleCreateTask(col.status)}
                      className="px-3 py-1 bg-blue-600 text-white font-bold rounded-lg text-xs"
                    >
                      Simpan
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setAddingInColumn(col.status)}
                  className="w-full py-2 border border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 rounded-xl text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Tambah Task
                </button>
              )}

              {/* Task Cards List */}
              <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[650px] pr-0.5">
                {columnTasks.map((task) => {
                  const prioMeta = PRIORITY_META[task.priority] || PRIORITY_META.MEDIUM;
                  const completedSubtasks = task.subtasks.filter((st) => st.isCompleted).length;

                  return (
                    <div
                      key={task.id}
                      className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-all space-y-2.5 group"
                    >
                      {/* Priority Tag & Delete */}
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${prioMeta.bg} ${prioMeta.text}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${prioMeta.dot}`} />
                          {prioMeta.label}
                        </span>

                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-opacity"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Title */}
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug">
                        {task.title}
                      </h4>

                      {/* Associated Event Badge */}
                      {task.event && (
                        <div
                          onClick={() =>
                            window.dispatchEvent(
                              new CustomEvent("open-event-detail", { detail: { eventId: task.event?.id } })
                            )
                          }
                          className="px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-[10px] font-semibold truncate cursor-pointer hover:underline border border-blue-100 dark:border-blue-900/30"
                        >
                          📌 {task.event.title}
                        </div>
                      )}

                      {/* Subtasks Checklist */}
                      {task.subtasks.length > 0 && (
                        <div className="space-y-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                          <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold">
                            <span>Checklist ({completedSubtasks}/{task.subtasks.length})</span>
                          </div>
                          {task.subtasks.map((st) => (
                            <div
                              key={st.id}
                              onClick={() => handleToggleSubtask(task.id, st.id, st.isCompleted)}
                              className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300 cursor-pointer hover:text-blue-600 transition-colors"
                            >
                              {st.isCompleted ? (
                                <CheckSquare className="w-3 h-3 text-emerald-500 shrink-0" />
                              ) : (
                                <Square className="w-3 h-3 text-slate-400 shrink-0" />
                              )}
                              <span className={st.isCompleted ? "line-through text-slate-400" : "truncate"}>
                                {st.title}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Footer: PIC Avatar & Status Movement Buttons */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
                        {task.assignee ? (
                          <div className="flex items-center gap-1.5">
                            <img
                              src={task.assignee.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
                              alt={task.assignee.name}
                              className="w-5 h-5 rounded-full object-cover"
                            />
                            <span className="text-[10px] font-semibold text-slate-500 truncate max-w-[80px]">
                              {task.assignee.name.split(",")[0]}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">No PIC</span>
                        )}

                        {/* Status Change Arrows */}
                        <div className="flex items-center gap-1">
                          {colIdx > 0 && (
                            <button
                              onClick={() => handleMoveStatus(task, COLUMNS[colIdx - 1].status)}
                              title="Pindahkan ke status sebelumnya"
                              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {colIdx < COLUMNS.length - 1 && (
                            <button
                              onClick={() => handleMoveStatus(task, COLUMNS[colIdx + 1].status)}
                              title="Pindahkan ke status berikutnya"
                              className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
