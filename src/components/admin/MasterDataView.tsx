"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationContext";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import {
  Building2,
  Tag,
  Plus,
  Edit,
  Trash2,
  Users,
  CheckCircle2,
  AlertCircle,
  X,
  Radio,
  Layers,
  Sparkles,
} from "lucide-react";

export default function MasterDataView() {
  const { isAdmin } = useAuth();
  const { showToast } = useNotifications();

  const [activeTab, setActiveTab] = useState<"ROOMS" | "CATEGORIES">("ROOMS");

  // Rooms state
  const [rooms, setRooms] = useState<any[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<any | null>(null);
  const [deletingRoom, setDeletingRoom] = useState<any | null>(null);

  // Room form fields
  const [roomName, setRoomName] = useState("");
  const [roomCapacity, setRoomCapacity] = useState(20);
  const [roomType, setRoomType] = useState("ROOM");
  const [roomFacility, setRoomFacility] = useState("");
  const [roomStatus, setRoomStatus] = useState("AVAILABLE");
  const [submittingRoom, setSubmittingRoom] = useState(false);

  // Categories state
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<any | null>(null);

  // Category form fields
  const [categoryName, setCategoryName] = useState("");
  const [categoryCode, setCategoryCode] = useState("");
  const [categoryColor, setCategoryColor] = useState("#3B82F6");
  const [categoryDesc, setCategoryDesc] = useState("");
  const [submittingCategory, setSubmittingCategory] = useState(false);

  // Fetch Rooms
  const fetchRooms = useCallback(async () => {
    try {
      setLoadingRooms(true);
      const res = await fetch("/api/rooms");
      if (res.ok) {
        const data = await res.json();
        setRooms(Array.isArray(data) ? data : []);
      }
    } catch {
      showToast("error", "Error", "Gagal memuat master data ruangan.");
    } finally {
      setLoadingRooms(false);
    }
  }, [showToast]);

  // Fetch Categories
  const fetchCategories = useCallback(async () => {
    try {
      setLoadingCategories(true);
      const res = await fetch("/api/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(Array.isArray(data) ? data : []);
      }
    } catch {
      showToast("error", "Error", "Gagal memuat master data kategori.");
    } finally {
      setLoadingCategories(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchRooms();
    fetchCategories();
  }, [fetchRooms, fetchCategories]);

  // ROOM HANDLERS
  const handleOpenCreateRoom = () => {
    setEditingRoom(null);
    setRoomName("");
    setRoomCapacity(20);
    setRoomType("ROOM");
    setRoomFacility("Proyektor, AC, Sound System");
    setRoomStatus("AVAILABLE");
    setRoomModalOpen(true);
  };

  const handleOpenEditRoom = (room: any) => {
    setEditingRoom(room);
    setRoomName(room.name);
    setRoomCapacity(room.capacity);
    setRoomType(room.type);
    setRoomFacility(room.facility || "");
    setRoomStatus(room.status);
    setRoomModalOpen(true);
  };

  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim()) {
      showToast("error", "Validasi Gagal", "Nama ruangan wajib diisi.");
      return;
    }

    setSubmittingRoom(true);
    try {
      if (editingRoom) {
        const res = await fetch(`/api/rooms/${editingRoom.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: roomName.trim(),
            capacity: roomCapacity,
            type: roomType,
            facility: roomFacility,
            status: roomStatus,
          }),
        });
        if (!res.ok) throw new Error();
        showToast("success", "Ruangan Diperbarui", `Ruangan "${roomName}" berhasil diupdate.`);
      } else {
        const res = await fetch("/api/rooms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: roomName.trim(),
            capacity: roomCapacity,
            type: roomType,
            facility: roomFacility,
            status: roomStatus,
          }),
        });
        if (!res.ok) throw new Error();
        showToast("success", "Ruangan Dibuat", `Ruangan "${roomName}" berhasil ditambahkan.`);
      }
      setRoomModalOpen(false);
      fetchRooms();
    } catch {
      showToast("error", "Error", "Gagal menyimpan master data ruangan.");
    } finally {
      setSubmittingRoom(false);
    }
  };

  const handleDeleteRoom = async () => {
    if (!deletingRoom) return;
    try {
      const res = await fetch(`/api/rooms/${deletingRoom.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      showToast("success", "Ruangan Dihapus", `Ruangan "${deletingRoom.name}" berhasil dihapus.`);
      setDeletingRoom(null);
      fetchRooms();
    } catch {
      showToast("error", "Error", "Gagal menghapus ruangan.");
    }
  };

  // CATEGORY HANDLERS
  const handleOpenCreateCategory = () => {
    setEditingCategory(null);
    setCategoryName("");
    setCategoryCode("");
    setCategoryColor("#3B82F6");
    setCategoryDesc("");
    setCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (cat: any) => {
    setEditingCategory(cat);
    setCategoryName(cat.name);
    setCategoryCode(cat.code);
    setCategoryColor(cat.color || "#3B82F6");
    setCategoryDesc(cat.description || "");
    setCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      showToast("error", "Validasi Gagal", "Nama kategori wajib diisi.");
      return;
    }

    setSubmittingCategory(true);
    try {
      if (editingCategory) {
        const res = await fetch(`/api/categories/${editingCategory.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: categoryName.trim(),
            color: categoryColor,
            description: categoryDesc,
          }),
        });
        if (!res.ok) throw new Error();
        showToast("success", "Kategori Diperbarui", `Kategori "${categoryName}" berhasil disimpan.`);
      } else {
        const res = await fetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: categoryName.trim(),
            code: categoryCode.trim() || undefined,
            color: categoryColor,
            description: categoryDesc,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast("error", "Gagal", data.error || "Gagal membuat kategori.");
          return;
        }
        showToast("success", "Kategori Dibuat", `Kategori "${categoryName}" berhasil ditambahkan.`);
      }
      setCategoryModalOpen(false);
      fetchCategories();
    } catch {
      showToast("error", "Error", "Gagal menyimpan data kategori.");
    } finally {
      setSubmittingCategory(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!deletingCategory) return;
    try {
      const res = await fetch(`/api/categories/${deletingCategory.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      showToast("success", "Kategori Dihapus", `Kategori "${deletingCategory.name}" berhasil dihapus.`);
      setDeletingCategory(null);
      fetchCategories();
    } catch {
      showToast("error", "Error", "Gagal menghapus kategori.");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0c1220] p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Layers className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-black text-slate-900 dark:text-slate-100">
              Master Data: Ruangan & Kategori Agenda
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Khusus Administrator: kelola fasilitas fisik/ruangan pertemuan dan klasifikasi kategori agenda acara
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab("ROOMS")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "ROOMS"
                ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Master Ruangan ({rooms.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("CATEGORIES")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "CATEGORIES"
                ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Master Kategori ({categories.length})</span>
          </button>
        </div>
      </div>

      {/* ==================== TAB 1: MASTER RUANGAN ==================== */}
      {activeTab === "ROOMS" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Daftar ruangan pertemuan, studio, dan link meeting online untuk pendeteksian bentrok jadwal otomatis.
            </p>
            <button
              onClick={handleOpenCreateRoom}
              className="px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Ruangan</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loadingRooms ? (
              <div className="col-span-full py-12 text-center text-slate-400">
                <div className="inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2" />
                <p className="text-xs">Memuat daftar master ruangan...</p>
              </div>
            ) : rooms.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-400 bg-white dark:bg-[#0c1220] rounded-3xl border border-slate-200 dark:border-slate-800">
                Belum ada master data ruangan.
              </div>
            ) : (
              rooms.map((room) => {
                const isAvailable = room.status === "AVAILABLE";
                return (
                  <div
                    key={room.id}
                    className="bg-white dark:bg-[#0c1220] p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:border-blue-500/40 transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                            isAvailable
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                              : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                          }`}
                        >
                          {isAvailable ? "Siap Digunakan" : "Maintenance"}
                        </span>

                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                          {room.type}
                        </span>
                      </div>

                      <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-blue-500 transition-colors">
                        {room.name}
                      </h3>

                      <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-blue-500" />
                        <span>Kapasitas: <strong className="text-slate-800 dark:text-slate-200">{room.capacity} Orang</strong></span>
                      </div>

                      {room.facility && (
                        <div className="mt-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
                          <strong className="text-slate-700 dark:text-slate-300">Fasilitas: </strong>
                          {room.facility}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenEditRoom(room)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-blue-500 transition-colors text-xs flex items-center gap-1 font-semibold"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => setDeletingRoom(room)}
                        className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-500 transition-colors text-xs flex items-center gap-1 font-semibold"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ==================== TAB 2: MASTER KATEGORI ==================== */}
      {activeTab === "CATEGORIES" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Klasifikasi jenis agenda untuk visualisasi warna kalender, pengelompokan laporan, dan filter.
            </p>
            <button
              onClick={handleOpenCreateCategory}
              className="px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Kategori</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loadingCategories ? (
              <div className="col-span-full py-12 text-center text-slate-400">
                <div className="inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2" />
                <p className="text-xs">Memuat daftar master kategori...</p>
              </div>
            ) : categories.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-400 bg-white dark:bg-[#0c1220] rounded-3xl border border-slate-200 dark:border-slate-800">
                Belum ada master data kategori.
              </div>
            ) : (
              categories.map((cat) => (
                <div
                  key={cat.id}
                  className="bg-white dark:bg-[#0c1220] p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:border-blue-500/40 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3.5 h-3.5 rounded-full ring-2 ring-white dark:ring-slate-900 shadow-sm"
                          style={{ backgroundColor: cat.color || "#3B82F6" }}
                        />
                        <span className="text-[10px] font-mono font-bold text-slate-400">
                          {cat.code}
                        </span>
                      </div>

                      <span
                        className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border"
                        style={{
                          backgroundColor: `${cat.color}15`,
                          borderColor: `${cat.color}40`,
                          color: cat.color,
                        }}
                      >
                        Badge Label
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                      {cat.name}
                    </h3>

                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                      {cat.description || "Tidak ada deskripsi tambahan."}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => handleOpenEditCategory(cat)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-blue-500 transition-colors text-xs flex items-center gap-1 font-semibold"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => setDeletingCategory(cat)}
                      className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-500 transition-colors text-xs flex items-center gap-1 font-semibold"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ==================== MODAL: ROOM FORM ==================== */}
      {roomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#0c1220] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-500" />
                <span>{editingRoom ? "Edit Master Ruangan" : "Tambah Master Ruangan"}</span>
              </h2>
              <button
                onClick={() => setRoomModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRoom} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Ruangan / Fasilitas *
                </label>
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="Contoh: Auditorium Utama Lt. 3"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Kapasitas (Orang)
                  </label>
                  <input
                    type="number"
                    value={roomCapacity}
                    onChange={(e) => setRoomCapacity(parseInt(e.target.value) || 0)}
                    min={1}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tipe Ruangan
                  </label>
                  <select
                    value={roomType}
                    onChange={(e) => setRoomType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="ROOM">Ruang Fisik (Offline)</option>
                    <option value="ZOOM_ACCOUNT">Zoom / Akun Online</option>
                    <option value="HYBRID">Hybrid Studio</option>
                    <option value="EQUIPMENT">Peralatan Khusus</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Status Ketersediaan
                </label>
                <select
                  value={roomStatus}
                  onChange={(e) => setRoomStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="AVAILABLE">Tersedia (AVAILABLE)</option>
                  <option value="MAINTENANCE">Dalam Perbaikan (MAINTENANCE)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Fasilitas & Kelengkapan
                </label>
                <textarea
                  value={roomFacility}
                  onChange={(e) => setRoomFacility(e.target.value)}
                  rows={2}
                  placeholder="Proyektor 4K, 4 Mic Wireless, AC Sentral"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRoomModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingRoom}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-md disabled:opacity-60"
                >
                  {submittingRoom ? "Menyimpan..." : "Simpan Ruangan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: CATEGORY FORM ==================== */}
      {categoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#0c1220] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Tag className="w-5 h-5 text-blue-500" />
                <span>{editingCategory ? "Edit Master Kategori" : "Tambah Master Kategori"}</span>
              </h2>
              <button
                onClick={() => setCategoryModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Kategori *
                </label>
                <input
                  type="text"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="Contoh: Rapat Koordinasi"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              {!editingCategory && (
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Kode Unik (Opsional, otomatis dari nama)
                  </label>
                  <input
                    type="text"
                    value={categoryCode}
                    onChange={(e) => setCategoryCode(e.target.value.toUpperCase())}
                    placeholder="Contoh: RAPAT_KOORDINASI"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Pilih Warna Badge Kalender
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={categoryColor}
                    onChange={(e) => setCategoryColor(e.target.value)}
                    className="w-10 h-10 rounded-xl cursor-pointer border border-slate-300 dark:border-slate-700 bg-transparent"
                  />
                  <span className="font-mono text-xs text-slate-600 dark:text-slate-300">
                    {categoryColor}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Deskripsi Kategori
                </label>
                <textarea
                  value={categoryDesc}
                  onChange={(e) => setCategoryDesc(e.target.value)}
                  rows={2}
                  placeholder="Deskripsi singkat jenis agenda..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCategoryModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingCategory}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-md disabled:opacity-60"
                >
                  {submittingCategory ? "Menyimpan..." : "Simpan Kategori"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Room Dialog */}
      <ConfirmDialog
        isOpen={!!deletingRoom}
        title="Hapus Master Ruangan"
        message={`Apakah Anda yakin ingin menghapus ruangan "${deletingRoom?.name}"?`}
        confirmLabel="Ya, Hapus Ruangan"
        onConfirm={handleDeleteRoom}
        onCancel={() => setDeletingRoom(null)}
      />

      {/* Delete Category Dialog */}
      <ConfirmDialog
        isOpen={!!deletingCategory}
        title="Hapus Master Kategori"
        message={`Apakah Anda yakin ingin menghapus kategori "${deletingCategory?.name}"?`}
        confirmLabel="Ya, Hapus Kategori"
        onConfirm={handleDeleteCategory}
        onCancel={() => setDeletingCategory(null)}
      />
    </div>
  );
}
