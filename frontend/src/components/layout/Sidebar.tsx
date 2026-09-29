import React from "react";
import { useAuthStore } from "../../stores/authStore";
import {
  LayoutDashboard,
  CalendarDays,
  GanttChart,
  KanbanSquare,
  AlertOctagon,
  Users,
  Building2,
  History,
  ShieldCheck,
  CalendarCheck,
  Database,
  UserCog,
  LogOut,
  User,
} from "lucide-react";

export type NavTab =
  | "dashboard"
  | "calendar"
  | "timeline"
  | "tasks"
  | "conflicts"
  | "team"
  | "users-manage"
  | "rooms-manage"
  | "audit";

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isOpen?: boolean;
  onClose?: () => void;
  conflictsCount?: number;
  onOpenAuthModal?: () => void;
}

export default function Sidebar({
  currentTab,
  onSelectTab,
  isOpen = false,
  onClose,
  conflictsCount = 0,
  onOpenAuthModal,
}: SidebarProps) {
  const { currentUser, isAdmin, isManager, isAuthenticated, logout } = useAuthStore();

  const NAV_ITEMS: { id: NavTab; label: string; icon: any; badge?: string | null; badgeVariant?: string; adminOnly?: boolean }[] = [
    {
      id: "dashboard",
      label: "Dashboard & Ringkasan",
      icon: LayoutDashboard,
    },
    {
      id: "calendar",
      label: "Kalender Jadwal",
      icon: CalendarDays,
    },
    {
      id: "timeline",
      label: "Timeline Roadmap Gantt",
      icon: GanttChart,
      badge: "Visual",
    },
    {
      id: "tasks",
      label: "Papan Tugas & PIC",
      icon: KanbanSquare,
    },
    {
      id: "conflicts",
      label: "Pusat Deteksi Bentrok",
      icon: AlertOctagon,
      badge: conflictsCount > 0 ? `${conflictsCount} Bentrok` : null,
      badgeVariant: conflictsCount > 0 ? "danger" : "default",
    },
    {
      id: "team",
      label: "Direktori Tim & PIC",
      icon: Users,
    },
    {
      id: "users-manage",
      label: "Kelola Pengguna (User)",
      icon: UserCog,
      adminOnly: true,
      badge: "Admin",
    },
    {
      id: "rooms-manage",
      label: "Master Data Ruangan",
      icon: Building2,
      adminOnly: true,
      badge: "Admin",
    },
    {
      id: "audit",
      label: "Log Aktivitas & Audit",
      icon: History,
      adminOnly: true,
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
        <div>
          {/* Brand Header */}
          <div className="h-16 px-5 flex items-center gap-3 border-b border-slate-200/80 dark:border-slate-800/80">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 shrink-0">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-300 bg-clip-text text-transparent">
                  JadwalKu
                </span>
                <span className="text-[10px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                  VITE
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium truncate">
                Enterprise Schedule Hub
              </p>
            </div>
          </div>

          {/* User Profile Card in Sidebar */}
          <div className="p-3 mx-3 my-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={currentUser.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
                alt={currentUser.name}
                className="w-8 h-8 rounded-full object-cover shrink-0"
              />
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                  {currentUser.name.split(",")[0]}
                </p>
                <div className="flex items-center gap-1">
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
                      isAdmin
                        ? "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                        : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                    }`}
                  >
                    {currentUser.role}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={onOpenAuthModal}
              title="Ganti Akun / Login Form"
              className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-colors"
            >
              <User className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-280px)]">
            <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Menu Utama
            </p>

            {NAV_ITEMS.map((item) => {
              if (item.adminOnly && !isAdmin) return null;
              const isActive = currentTab === item.id;
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    onClose?.();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all group ${
                    isActive
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/25"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
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
                      className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
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
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Tech & DB Status */}
        <div className="p-3 border-t border-slate-200/80 dark:border-slate-800/80 space-y-2">
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-emerald-500" />
                MySQL + Express REST
              </span>
              <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Live
              </span>
            </div>

            <div className="text-[10px] text-slate-400 space-y-0.5">
              <p>• Prisma ORM MySQL Provider</p>
              <p>• JWT Authentication + BCrypt</p>
              <p>• React 18 + Zustand + TanStack</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
