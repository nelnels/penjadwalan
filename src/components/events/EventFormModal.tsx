"use client";

import React, { useState, useEffect } from "react";
import { EventDTO, UserDTO, ScheduleConflict } from "@/lib/types";
import { CATEGORY_META, PRIORITY_META, STATUS_META, DEPARTMENTS, ROOMS_LIST } from "@/lib/utils";
import { useNotifications } from "@/context/NotificationContext";
import { useAuth } from "@/context/AuthContext";
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Users,
  AlertTriangle,
  Sparkles,
  Plus,
  Trash2,
  DollarSign,
  Tag,
  Check,
  Building2,
  Video,
} from "lucide-react";
import { format, addHours } from "date-fns";

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: EventDTO | null;
  onSuccess: () => void;
}

export default function EventFormModal({
  isOpen,
  onClose,
  initialData,
  onSuccess,
}: EventFormModalProps) {
  const { showToast } = useNotifications();
  const { currentUser, users } = useAuth();

  const [loading, setLoading] = useState(false);
  const [checkingConflict, setCheckingConflict] = useState(false);
  const [liveConflicts, setLiveConflicts] = useState<ScheduleConflict[]>([]);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("INTERNAL_TEAM");
  const [priority, setPriority] = useState<string>("MEDIUM");
  const [status, setStatus] = useState<string>("UPCOMING");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isAllDay, setIsAllDay] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceRule, setRecurrenceRule] = useState("WEEKLY");
  const [locationType, setLocationType] = useState<string>("OFFLINE");
  const [locationName, setLocationName] = useState("Ruang Rapat Utama");
  const [locationUrl, setLocationUrl] = useState("");
  const [department, setDepartment] = useState("Semua Divisi");
  const [budget, setBudget] = useState<string>("");
  const [color, setColor] = useState("#3B82F6");
  const [selectedPicIds, setSelectedPicIds] = useState<string[]>([]);
  const [milestones, setMilestones] = useState<{ title: string; targetDate: string }[]>([]);

  // Initialize or Reset Form
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || "");
      setDescription(initialData.description || "");
      setCategory(initialData.category || "INTERNAL_TEAM");
      setPriority(initialData.priority || "MEDIUM");
      setStatus(initialData.status || "UPCOMING");
      setStartDate(initialData.startDate ? format(new Date(initialData.startDate), "yyyy-MM-dd'T'HH:mm") : "");
      setEndDate(initialData.endDate ? format(new Date(initialData.endDate), "yyyy-MM-dd'T'HH:mm") : "");
      setIsAllDay(!!initialData.isAllDay);
      setIsRecurring(!!initialData.isRecurring);
      setRecurrenceRule(initialData.recurrenceRule || "WEEKLY");
      setLocationType(initialData.locationType || "OFFLINE");
      setLocationName(initialData.locationName || "Ruang Rapat Utama");
      setLocationUrl(initialData.locationUrl || "");
      setDepartment(initialData.department || "Semua Divisi");
      setBudget(initialData.budget ? String(initialData.budget) : "");
      setColor(initialData.color || "#3B82F6");
      setSelectedPicIds(initialData.assignees ? initialData.assignees.map((a) => a.userId) : []);
      setMilestones(
        initialData.milestones
          ? initialData.milestones.map((m) => ({
              title: m.title,
              targetDate: format(new Date(m.targetDate), "yyyy-MM-dd'T'HH:mm"),
            }))
          : []
      );
    } else {
      const now = new Date();
      now.setMinutes(0, 0, 0);
      const start = addHours(now, 2);
      const end = addHours(start, 2);

      setTitle("");
      setDescription("");
      setCategory("INTERNAL_TEAM");
      setPriority("MEDIUM");
      setStatus("UPCOMING");
      setStartDate(format(start, "yyyy-MM-dd'T'HH:mm"));
      setEndDate(format(end, "yyyy-MM-dd'T'HH:mm"));
      setIsAllDay(false);
      setIsRecurring(false);
      setRecurrenceRule("WEEKLY");
      setLocationType("OFFLINE");
      setLocationName("Ruang Rapat Eksekutif A-101");
      setLocationUrl("");
      setDepartment(currentUser?.department || "Semua Divisi");
      setBudget("");
      setColor("#3B82F6");
      setSelectedPicIds(currentUser ? [currentUser.id] : []);
      setMilestones([
        { title: "Briefing Panitia & Persiapan", targetDate: format(start, "yyyy-MM-dd'T'HH:mm") },
      ]);
    }
  }, [initialData, isOpen]);

  // Live Conflict Check Debounced
  useEffect(() => {
    if (!startDate || !endDate || !isOpen) return;

    const timer = setTimeout(async () => {
      setCheckingConflict(true);
      try {
        const res = await fetch("/api/conflicts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: initialData?.id,
            startDate,
            endDate,
            locationName,
            locationType,
            assigneeIds: selectedPicIds,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setLiveConflicts(data.conflicts || []);
        }
      } catch {
        // ignore
      } finally {
        setCheckingConflict(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [startDate, endDate, locationName, locationType, selectedPicIds, isOpen]);

  // Auto Slot Recommendation
  const handleFindSmartSlot = async () => {
    try {
      const res = await fetch("/api/conflicts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "FIND_SLOT",
          startDate,
          durationMinutes: 120,
          locationName,
          assigneeIds: selectedPicIds,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.recommendedSlot) {
          const newStart = format(new Date(data.recommendedSlot.startDate), "yyyy-MM-dd'T'HH:mm");
          const newEnd = format(new Date(data.recommendedSlot.endDate), "yyyy-MM-dd'T'HH:mm");
          setStartDate(newStart);
          setEndDate(newEnd);
          showToast("success", "Slot Bebas Bentrok Ditemukan", `Jadwal dialihkan ke ${newStart.replace("T", " ")}`);
        }
      }
    } catch {
      showToast("error", "Gagal Mencari Slot", "Silakan coba tanggal lain");
    }
  };

  const handlePicToggle = (userId: string) => {
    setSelectedPicIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const addMilestoneRow = () => {
    setMilestones((prev) => [
      ...prev,
      { title: "", targetDate: startDate || format(new Date(), "yyyy-MM-dd'T'HH:mm") },
    ]);
  };

  const removeMilestoneRow = (idx: number) => {
    setMilestones((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast("error", "Validasi Gagal", "Judul agenda wajib diisi");
      return;
    }
    if (new Date(endDate) <= new Date(startDate)) {
      showToast("error", "Validasi Gagal", "Waktu selesai harus setelah waktu mulai");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title,
        description,
        category,
        priority,
        status,
        startDate,
        endDate,
        isAllDay,
        isRecurring,
        recurrenceRule: isRecurring ? recurrenceRule : null,
        locationType,
        locationName,
        locationUrl: locationType !== "OFFLINE" ? locationUrl : null,
        department,
        budget: budget ? parseFloat(budget) : 0,
        color,
        createdById: currentUser?.id || "",
        assigneeIds: selectedPicIds,
        milestones: milestones.filter((m) => m.title.trim().length > 0),
      };

      const url = initialData ? `/api/events/${initialData.id}` : "/api/events";
      const method = initialData ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Gagal menyimpan agenda");
      }

      showToast(
        "success",
        initialData ? "Agenda Diperbarui" : "Agenda Berhasil Dibuat",
        `Agenda "${title}" telah disimpan ke jadwal.`
      );
      onSuccess();
    } catch (err: any) {
      showToast("error", "Gagal Menyimpan", err.message || "Terjadi kesalahan server");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
          <div>
            <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              {initialData ? "Edit Agenda Organisasi" : "Buat Agenda / Jadwal Baru"}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Lengkapi detail acara, penugasan PIC, ruangan, dan milestone target
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5 flex-1">
          {/* Live Conflict Warning Banner */}
          {liveConflicts.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 space-y-2 animate-in slide-in-from-top-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Peringatan: Terdeteksi {liveConflicts.length} Potensi Bentrok Jadwal!</span>
                </div>
                <button
                  type="button"
                  onClick={handleFindSmartSlot}
                  className="flex items-center gap-1 text-[11px] font-semibold bg-amber-500 hover:bg-amber-600 text-white px-2.5 py-1 rounded-lg shadow-sm transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Cari Slot Bebas Bentrok
                </button>
              </div>
              <ul className="text-[11px] space-y-1 text-amber-700 dark:text-amber-300/90 pl-6 list-disc">
                {liveConflicts.map((c, i) => (
                  <li key={i}>{c.description}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Judul & Kategori */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Nama / Judul Agenda <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Rapat Pleno Koordinasi Acara Tech Summit 2026"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Kategori Agenda
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 text-xs font-semibold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              >
                {Object.entries(CATEGORY_META).map(([key, meta]) => (
                  <option key={key} value={key}>
                    {meta.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Deskripsi */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Deskripsi & Tujuan Agenda
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Jelaskan ringkasan agenda, tujuan kegiatan, atau catatan penting..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          {/* Tanggal & Waktu (Mulai & Selesai) */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-500" />
                Waktu Pelaksanaan
              </span>
              <div className="flex items-center gap-4 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAllDay}
                    onChange={(e) => setIsAllDay(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-slate-600 dark:text-slate-400">Sepanjang Hari</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-slate-600 dark:text-slate-400">Berulang Rutin</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500">Waktu Mulai</label>
                <input
                  type="datetime-local"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500">Waktu Selesai</label>
                <input
                  type="datetime-local"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>

            {isRecurring && (
              <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/60 flex items-center gap-3 text-xs">
                <span className="text-slate-500">Frekuensi Pengulangan:</span>
                <select
                  value={recurrenceRule}
                  onChange={(e) => setRecurrenceRule(e.target.value)}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold"
                >
                  <option value="WEEKLY">Setiap Minggu (Weekly)</option>
                  <option value="MONTHLY">Setiap Bulan (Monthly)</option>
                  <option value="DAILY">Setiap Hari Kerja (Daily)</option>
                </select>
              </div>
            )}
          </div>

          {/* Lokasi & Ruangan */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Tipe Lokasi
              </label>
              <select
                value={locationType}
                onChange={(e) => setLocationType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 text-xs font-semibold"
              >
                <option value="OFFLINE">Tatap Muka (Offline)</option>
                <option value="ONLINE">Online Virtual (Zoom/Meet)</option>
                <option value="HYBRID">Hybrid (Offline + Live Stream)</option>
              </select>
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Nama Ruangan / Platform
              </label>
              <div className="flex gap-2">
                <select
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 text-xs"
                >
                  {ROOMS_LIST.map((room) => (
                    <option key={room.name} value={room.name}>
                      {room.name} ({room.type === "ONLINE" ? "Online" : `Kapasitas ${room.capacity}`})
                    </option>
                  ))}
                  <option value="Ruang Custom">Lainnya / Ruang Khusus...</option>
                </select>
              </div>
            </div>
          </div>

          {/* Link Virtual URL if Online/Hybrid */}
          {locationType !== "OFFLINE" && (
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5 text-blue-500" />
                Link Meeting Virtual (Zoom / Google Meet URL)
              </label>
              <input
                type="url"
                value={locationUrl}
                onChange={(e) => setLocationUrl(e.target.value)}
                placeholder="https://meet.google.com/... atau https://zoom.us/j/..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 text-xs text-blue-600 dark:text-blue-400"
              />
            </div>
          )}

          {/* Status, Prioritas, Divisi & Anggaran */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Prioritas
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 text-xs font-semibold"
              >
                {Object.entries(PRIORITY_META).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Status Agenda
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 text-xs font-semibold"
              >
                {Object.entries(STATUS_META).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Divisi Penyelenggara
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 text-xs"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Anggaran (Rp)
              </label>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 text-xs"
              />
            </div>
          </div>

          {/* Penugasan PIC & Tim */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-500" />
                Pilih PIC & Anggota Tim Penanggung Jawab
              </span>
              <span className="text-[11px] text-slate-400 font-normal">
                {selectedPicIds.length} PIC dipilih
              </span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {users.map((user) => {
                const isSelected = selectedPicIds.includes(user.id);
                return (
                  <button
                    type="button"
                    key={user.id}
                    onClick={() => handlePicToggle(user.id)}
                    className={`flex items-center gap-2.5 p-2 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "border-blue-500 bg-blue-500/10 dark:bg-blue-500/20 text-blue-900 dark:text-blue-200 ring-1 ring-blue-500"
                        : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <img
                      src={user.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
                      alt={user.name}
                      className="w-7 h-7 rounded-full object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate">{user.name.split(",")[0]}</p>
                      <p className="text-[10px] text-slate-400 truncate">{user.position}</p>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Milestones / Target Capaian Builder */}
          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Milestones & Target Capaian Utama
              </label>
              <button
                type="button"
                onClick={addMilestoneRow}
                className="flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Milestone
              </button>
            </div>

            <div className="space-y-2">
              {milestones.map((m, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder={`Milestone #${idx + 1} (Contoh: Finalisasi Rundown)`}
                    value={m.title}
                    onChange={(e) => {
                      const updated = [...milestones];
                      updated[idx].title = e.target.value;
                      setMilestones(updated);
                    }}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 text-xs"
                  />
                  <input
                    type="datetime-local"
                    value={m.targetDate}
                    onChange={(e) => {
                      const updated = [...milestones];
                      updated[idx].targetDate = e.target.value;
                      setMilestones(updated);
                    }}
                    className="w-44 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => removeMilestoneRow(idx)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
          <div className="text-[11px] text-slate-400">
            {checkingConflict ? "Memeriksa bentrok jadwal..." : liveConflicts.length === 0 ? "✓ Jadwal aman tanpa bentrok" : `⚠️ ${liveConflicts.length} bentrok`}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleSubmit}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/25 active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? "Menyimpan..." : initialData ? "Simpan Perubahan" : "Buat Agenda"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
