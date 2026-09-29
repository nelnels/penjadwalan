"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  CalendarDays,
  GanttChart,
  KanbanSquare,
  AlertOctagon,
  Users,
  History,
  Sparkles,
  CalendarCheck,
  ChevronRight,
  Database,
  UserCog,
  Layers,
  ShieldCheck,
  LogOut,
} from "lucide-react";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  conflictsCount?: number;
}

export default function Sidebar({
  isOpen = false,
  onClose,
  conflictsCount = 0,
}: SidebarProps) {
  const pathname = usePathname();
  const { isAdmin, currentUser, logout } = useAuth();

  const NAV_ITEMS = [
    {
      label: "Dashboard & Ringkasan",
      href: "/",
      icon: LayoutDashboard,
      badge: null,
    },
    {
      label: "Kalender Jadwal",
      href: "/calendar",
      icon: CalendarDays,
      badge: null,
    },
    {
      label: "Timeline & Roadmap Gantt",
      href: "/timeline",
      icon: GanttChart,
      badge: "Visual",
    },
    {
      label: "Papan Tugas & PIC",
      href: "/tasks",
      icon: KanbanSquare,
      badge: null,
    },
    {
      label: "Pusat Deteksi Bentrok",
      href: "/conflicts",
      icon: AlertOctagon,
      badge: conflictsCount > 0 ? `${conflictsCount} Bentrok` : null,
      badgeVariant: conflictsCount > 0 ? "danger" : "default",
    },
    {
      label: "Tim & PIC Organisasi",
      href: "/team",
      icon: Users,
      badge: null,
    },
    {
      label: "Log Aktivitas & Audit",
      href: "/audit",
      icon: History,
      badge: null,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden animate-in fade-in"
        />
      )}

      <aside
        className={`fixed top-0 left-0 bottom-0 z-40 w-64 bg-white dark:bg-[#0c121e] border-r border-slate-200/80 dark:border-slate-800/80 flex flex-col justify-between transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div>
          <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-200/80 dark:border-slate-800/80">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-300 bg-clip-text text-transparent">
                  JadwalKu
                </span>
                <span className="text-[10px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Sistem Penjadwalan Organisasi
              </p>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="p-4 space-y-1.5">
            <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Menu Utama
            </p>

            {NAV_ITEMS.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                    isActive
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/25"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive
                          ? "text-white"
                          : "text-slate-400 group-hover:text-blue-500 dark:group-hover:text-blue-400"
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        item.badgeVariant === "danger"
                          ? "bg-rose-500 text-white animate-pulse"
                          : isActive
                          ? "bg-white/20 text-white"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}

            {/* Admin Management Section */}
            {isAdmin && (
              <div className="pt-3 space-y-1">
                <p className="px-3 text-[11px] font-bold text-amber-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Menu Khusus Admin</span>
                  <ShieldCheck className="w-3.5 h-3.5" />
                </p>

                <Link
                  href="/admin/users"
                  onClick={onClose}
                  className={`flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold transition-all group ${
                    pathname.startsWith("/admin/users")
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/25"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <UserCog className="w-4 h-4 text-amber-500" />
                    <span>Kelola Pengguna</span>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    RBAC
                  </span>
                </Link>

                <Link
                  href="/admin/master-data"
                  onClick={onClose}
                  className={`flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold transition-all group ${
                    pathname.startsWith("/admin/master-data")
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/25"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    <span>Ruangan & Kategori</span>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    Master
                  </span>
                </Link>
              </div>
            )}
          </nav>
        </div>

        {/* Bottom Section: Current User & Logout */}
        <div className="p-4 border-t border-slate-200/80 dark:border-slate-800/80 space-y-2.5">
          {currentUser && (
            <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={currentUser.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-500/20 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    {currentUser.name.split(",")[0]}
                  </p>
                  <span
                    className={`inline-block text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded ${
                      isAdmin
                        ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                        : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                    }`}
                  >
                    {currentUser.role}
                  </span>
                </div>
              </div>

              <button
                onClick={() => logout()}
                title="Keluar (Logout)"
                className="p-1.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="p-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 text-[10px] text-slate-400 space-y-1">
            <div className="flex items-center justify-between font-semibold text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1">
                <Database className="w-3 h-3 text-emerald-500" />
                Database Engine
              </span>
              <span className="text-emerald-500 font-bold">Aktif</span>
            </div>
            <p>SQLite + Next.js 14 App Router</p>
          </div>
        </div>
      </aside>
    </>
  );
}
