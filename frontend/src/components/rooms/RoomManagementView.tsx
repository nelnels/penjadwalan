import React, { useState, useEffect } from "react";
import { useNotificationStore } from "../../stores/notificationStore";
import axios from "axios";
import {
  Building2,
  Plus,
  Video,
  Edit,
  Trash2,
  Users,
  CheckCircle2,
  AlertCircle,
  X,
  Radio,
} from "lucide-react";

export default function RoomManagementView() {
  const { showToast } = useNotificationStore();

  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<any | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState(20);
  const [type, setType] = useState("ROOM");
  const [facility, setFacility] = useState("");
  const [status, setStatus] = useState("AVAILABLE");
  const [submitting, setSubmitting] = useState(false);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/rooms");
      if (res.data) setRooms(res.data);
    } catch {
      showToast("error", "Error", "Gagal memuat master data ruangan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleOpenCreate = () => {
    setEditingRoom(null);
    setName("");
    setCapacity(20);
    setType("ROOM");
    setFacility("Proyektor, AC, Sound System");
    setStatus("AVAILABLE");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (room: any) => {
    setEditingRoom(room);
    setName(room.name);
    setCapacity(room.capacity);
    setType(room.type);
    setFacility(room.facility || "");
    setStatus(room.status);
    setIsModalOpen(true);
  };

  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast("error", "Validasi Gagal", "Nama ruangan wajib diisi");
      return;
    }

    setSubmitting(true);
    try {
      if (editingRoom) {
        await axios.patch(`/api/rooms/${editingRoom.id}`, {
          name,
          capacity,
          type,
          facility,
          status,
        });
        showToast("success", "Ruangan Diperbarui", `Data "${name}" berhasil disimpan.`);
      } else {
        await axios.post("/api/rooms", {
          name,
          capacity,
          type,
          facility,
          status,
        });
        showToast("success", "Ruangan Ditambahkan", `Master ruangan "${name}" berhasil dibuat.`);
      }
      setIsModalOpen(false);
      fetchRooms();
    } catch (err: any) {
      showToast("error", "Gagal Menyimpan", err?.response?.data?.error || "Terjadi kesalahan server");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRoom = async (room: any) => {
    if (!confirm(`Yakin ingin menghapus data ruangan "${room.name}"?`)) return;

    try {
      await axios.delete(`/api/rooms/${room.id}`);
      showToast("success", "Ruangan Dihapus", `Ruangan "${room.name}" telah dihapus.`);
      fetchRooms();
    } catch (err: any) {
      showToast("error", "Gagal Menghapus", err?.response?.data?.error || "Tidak dapat menghapus ruangan.");
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0c121e] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Building2 className="w-5 h-5" />
            </span>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100">
              Master Data Ruangan & Fasilitas
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Kelola daftar ruangan rapat fisik, akun virtual meeting, kapasitas, dan status ketersediaan
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Ruangan Baru</span>
        </button>
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {rooms.map((room) => (
          <div
            key={room.id}
            className="p-4 rounded-2xl bg-white dark:bg-[#0c121e] border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-all space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span
                  className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full ${
                    room.type === "ONLINE"
                      ? "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                      : room.type === "HYBRID"
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                      : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                  }`}
                >
                  {room.type}
                </span>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                    room.status === "AVAILABLE"
                      ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                      : "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      room.status === "AVAILABLE" ? "bg-emerald-500" : "bg-rose-500"
                    }`}
                  />
                  {room.status === "AVAILABLE" ? "Siap Dipakai" : "Maintenance"}
                </span>
              </div>

              <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{room.name}</h3>

              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <Users className="w-3.5 h-3.5 text-blue-500" />
                <span>Kapasitas: {room.capacity} Orang</span>
              </div>

              {room.facility && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl">
                  🛠️ {room.facility}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => handleOpenEdit(room)}
                className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Edit Ruangan"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDeleteRoom(room)}
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Hapus Ruangan"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Room Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-500" />
                {editingRoom ? "Edit Data Ruangan" : "Tambah Ruangan Baru"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRoom} className="p-6 space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Nama Ruangan / Fasilitas <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Auditorium Utama Lt. 3"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Tipe Ruangan</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                  >
                    <option value="ROOM">Fisik (Room Offline)</option>
                    <option value="ZOOM_ACCOUNT">Virtual Online</option>
                    <option value="HYBRID">Hybrid Hall</option>
                    <option value="EQUIPMENT">Peralatan</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Kapasitas (Orang)</label>
                  <input
                    type="number"
                    value={capacity}
                    onChange={(e) => setCapacity(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Fasilitas / Peralatan</label>
                <input
                  type="text"
                  value={facility}
                  onChange={(e) => setFacility(e.target.value)}
                  placeholder="Proyektor 4K, 4 Mic Wireless, AC Sentral"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Status Ketersediaan</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                >
                  <option value="AVAILABLE">AVAILABLE (Siap Digunakan)</option>
                  <option value="MAINTENANCE">MAINTENANCE (Perbaikan)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50"
                >
                  {submitting ? "Menyimpan..." : "Simpan Ruangan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
