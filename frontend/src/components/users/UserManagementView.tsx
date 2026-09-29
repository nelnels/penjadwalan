import React, { useState, useEffect } from "react";
import { UserDTO } from "../../lib/types";
import { DEPARTMENTS } from "../../lib/utils";
import { useAuthStore } from "../../stores/authStore";
import { useNotificationStore } from "../../stores/notificationStore";
import axios from "axios";
import {
  UserCog,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit,
  Shield,
  ShieldCheck,
  Building2,
  Mail,
  ChevronLeft,
  ChevronRight,
  X,
  Lock,
} from "lucide-react";

export default function UserManagementView() {
  const { currentUser, isAdmin } = useAuthStore();
  const { showToast } = useNotificationStore();

  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(8);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  // Form Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState("MEMBER");
  const [formDept, setFormDept] = useState("Divisi Acara & Program");
  const [formPosition, setFormPosition] = useState("Staff");
  const [formPhone, setFormPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/users", {
        params: {
          search,
          role: roleFilter !== "ALL" ? roleFilter : undefined,
          department: deptFilter !== "ALL" ? deptFilter : undefined,
          page,
          limit,
        },
      });

      if (res.data) {
        setUsers(res.data.users || []);
        setTotal(res.data.total || 0);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch {
      showToast("error", "Error", "Gagal memuat data pengguna");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter, deptFilter, search]);

  const handleOpenCreate = () => {
    setFormName("");
    setFormEmail("");
    setFormPassword("");
    setFormRole("MEMBER");
    setFormDept(DEPARTMENTS[1]);
    setFormPosition("Staff");
    setFormPhone("");
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (user: any) => {
    setEditingUser(user);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormPassword("");
    setFormRole(user.role);
    setFormDept(user.department);
    setFormPosition(user.position);
    setFormPhone(user.phone || "");
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) {
      showToast("error", "Validasi Gagal", "Nama dan email wajib diisi");
      return;
    }

    setSubmitting(true);
    try {
      if (editingUser) {
        // Update
        const res = await axios.patch(`/api/users/${editingUser.id}`, {
          name: formName,
          email: formEmail,
          role: formRole,
          department: formDept,
          position: formPosition,
          phone: formPhone,
          password: formPassword || undefined,
        });
        showToast("success", "User Diperbarui", `Data "${formName}" berhasil diperbarui.`);
        setEditingUser(null);
      } else {
        // Create
        const res = await axios.post("/api/users", {
          name: formName,
          email: formEmail,
          password: formPassword || "password123",
          role: formRole,
          department: formDept,
          position: formPosition,
          phone: formPhone,
        });
        showToast("success", "User Ditambahkan", `Anggota "${formName}" berhasil dibuat.`);
        setIsCreateOpen(false);
      }
      fetchUsers();
    } catch (err: any) {
      showToast("error", "Gagal Menyimpan", err?.response?.data?.error || "Terjadi kesalahan server");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (user: any) => {
    if (!confirm(`Yakin ingin menghapus user "${user.name}"? Tindakan ini tidak dapat dibatalkan.`)) return;

    try {
      await axios.delete(`/api/users/${user.id}`);
      showToast("success", "User Dihapus", `Akun "${user.name}" telah dihapus dari sistem.`);
      fetchUsers();
    } catch (err: any) {
      showToast("error", "Gagal Menghapus", err?.response?.data?.error || "Tidak dapat menghapus user.");
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0c121e] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <UserCog className="w-5 h-5" />
            </span>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100">
              Manajemen Pengguna & Hak Akses (RBAC)
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Khusus Super Admin: kelola akun anggota, setel peran (Admin/Manager/Member), dan hak akses
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Pengguna Baru</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-[#0c121e] p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama, email, atau jabatan..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
          >
            <option value="ALL">Semua Role</option>
            <option value="ADMIN">Super Admin</option>
            <option value="MANAGER">Manager / Koordinator</option>
            <option value="MEMBER">Member / Staff</option>
          </select>

          <select
            value={deptFilter}
            onChange={(e) => {
              setDeptFilter(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold max-w-[160px] truncate"
          >
            <option value="ALL">Semua Divisi</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-[#0c121e] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Pengguna</th>
                <th className="py-3 px-4">Role Hak Akses</th>
                <th className="py-3 px-4">Divisi & Posisi</th>
                <th className="py-3 px-4 text-center">Agenda PIC</th>
                <th className="py-3 px-4 text-center">Task Aktif</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={user.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
                        alt={user.name}
                        className="w-8 h-8 rounded-full object-cover shrink-0"
                      />
                      <div>
                        <p className="font-extrabold text-slate-900 dark:text-slate-100">{user.name}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{user.email}</p>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                        user.role === "ADMIN"
                          ? "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                          : user.role === "MANAGER"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                          : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{user.department}</p>
                    <p className="text-[11px] text-slate-400">{user.position}</p>
                  </td>

                  <td className="py-3 px-4 text-center font-mono font-bold text-blue-600 dark:text-blue-400">
                    {user._count?.picEvents || 0}
                  </td>

                  <td className="py-3 px-4 text-center font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {user._count?.tasks || 0}
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleOpenEdit(user)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Edit User"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user)}
                        disabled={user.id === currentUser.id}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-30"
                        title={user.id === currentUser.id ? "Tidak dapat menghapus akun sendiri" : "Hapus User"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>
            Menampilkan {users.length} dari total {total} pengguna
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold font-mono">
              Halaman {page} dari {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Create / Edit User Modal Dialog */}
      {(isCreateOpen || editingUser) && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <UserCog className="w-4 h-4 text-blue-500" />
                {editingUser ? "Edit Data Pengguna" : "Tambah Pengguna Baru"}
              </h3>
              <button
                onClick={() => {
                  setIsCreateOpen(false);
                  setEditingUser(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Nama Lengkap <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: Rahmat Hidayat"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Alamat Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="rahmat@jadwalku.org"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {editingUser ? "Password Baru (Kosongkan jika tidak diubah)" : "Password Awal"}
                </label>
                <input
                  type="password"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder={editingUser ? "••••••••" : "Default: password123"}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Role Akses</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                  >
                    <option value="MEMBER">MEMBER (Staff User)</option>
                    <option value="MANAGER">MANAGER (Koordinator)</option>
                    <option value="ADMIN">ADMIN (Super Admin)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">No. Telp / WA</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+62 812..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Divisi</label>
                  <select
                    value={formDept}
                    onChange={(e) => setFormDept(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs truncate"
                  >
                    {DEPARTMENTS.slice(1).map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Jabatan / Posisi</label>
                  <input
                    type="text"
                    value={formPosition}
                    onChange={(e) => setFormPosition(e.target.value)}
                    placeholder="Staff Divisi"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateOpen(false);
                    setEditingUser(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50"
                >
                  {submitting ? "Menyimpan..." : "Simpan Data Pengguna"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
