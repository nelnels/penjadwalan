import React, { useState, useRef, useEffect } from "react";
import { useAuthStore } from "../../stores/authStore";
import { useThemeStore } from "../../stores/themeStore";
import { useNotificationStore } from "../../stores/notificationStore";
import { formatRelativeDate } from "../../lib/utils";
import {
  Bell,
  Sun,
  Moon,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Info,
  ChevronDown,
  ShieldCheck,
  Sparkles,
  Menu,
} from "lucide-react";

interface NavbarProps {
  onOpenCreateModal?: () => void;
  onToggleSidebar?: () => void;
  onSearchChange?: (val: string) => void;
  searchValue?: string;
}

export default function Navbar({
  onOpenCreateModal,
  onToggleSidebar,
  onSearchChange,
  searchValue = "",
}: NavbarProps) {
  const { currentUser, users, switchUser } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotificationStore();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userRef.current && !userRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-[#0c121e]/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-4 lg:px-8 flex items-center justify-between transition-colors">
      {/* Left side: Mobile Sidebar Toggle + Search */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onToggleSidebar}
          className="p-2 -ml-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 lg:hidden transition-colors"
          aria-label="Toggle Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative w-full max-w-md hidden sm:block">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari agenda, tugas, PIC, atau ruangan..."
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-100/80 dark:bg-slate-800/60 border border-transparent focus:border-blue-500 dark:focus:border-blue-500 text-sm rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>
      </div>

      {/* Right side: Actions + Role Switcher Demo + Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Recruiter / Demo Role Switcher Badge */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100/70 transition-all text-xs font-medium"
            title="Klik untuk simulasi login sebagai role lain (Portfolio Demo)"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 animate-pulse" />
            <span className="hidden md:inline font-semibold">Simulasi Role:</span>
            <span className="bg-blue-600 text-white px-2 py-0.5 rounded-md text-[11px] font-bold tracking-wide">
              {currentUser.role}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-blue-500 opacity-70" />
          </button>

          {/* Role Switcher Menu */}
          {showUserDropdown && (
            <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800/80 mb-1">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-500" />
                  Portfolio Demo Switcher
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                  Pilih profil untuk mencoba permission & pengalaman tiap role
                </p>
              </div>

              <div className="space-y-1">
                {users.map((u) => {
                  const isSelected = u.id === currentUser.id;
                  return (
                    <button
                      key={u.id}
                      onClick={() => {
                        switchUser(u.id);
                        setShowUserDropdown(false);
                      }}
                      className={`w-full flex items-center gap-3 p-2 rounded-xl text-left transition-all ${
                        isSelected
                          ? "bg-blue-500 text-white shadow-md shadow-blue-500/20"
                          : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <img
                        src={u.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
                        alt={u.name}
                        className="w-8 h-8 rounded-full object-cover border border-white/20 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-xs font-bold truncate ${isSelected ? "text-white" : ""}`}>
                            {u.name}
                          </p>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold ${
                              isSelected
                                ? "bg-white/20 text-white"
                                : u.role === "ADMIN"
                                ? "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                                : u.role === "MANAGER"
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                                : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                            }`}
                          >
                            {u.role}
                          </span>
                        </div>
                        <p className={`text-[11px] truncate mt-0.5 ${isSelected ? "text-blue-100" : "text-slate-400"}`}>
                          {u.position}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Quick Action: + Buat Agenda */}
        {onOpenCreateModal && (
          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-blue-500/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Buat Agenda</span>
          </button>
        )}

        {/* Dark / Light Mode Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 border border-transparent dark:border-slate-800 transition-colors"
          title={`Ganti ke mode ${theme === "light" ? "Gelap (Dark)" : "Terang (Light)"}`}
        >
          {theme === "light" ? <Moon className="w-4 h-4 text-slate-600" /> : <Sun className="w-4 h-4 text-amber-400" />}
        </button>

        {/* Notification Bell Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 border border-transparent dark:border-slate-800 transition-colors"
            title="Pemberitahuan"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900 animate-pulse" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-3 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100">Pemberitahuan</h4>
                  {unreadCount > 0 && (
                    <span className="bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {unreadCount} baru
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-medium"
                  >
                    Tandai semua dibaca
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto space-y-1.5 pr-1">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">Tidak ada notifikasi saat ini</p>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => markAsRead(notif.id)}
                      className={`p-2.5 rounded-xl transition-all cursor-pointer flex items-start gap-2.5 ${
                        notif.isRead
                          ? "bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50 opacity-70"
                          : "bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40"
                      }`}
                    >
                      {notif.type === "URGENT" && <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />}
                      {notif.type === "WARNING" && <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />}
                      {notif.type === "SUCCESS" && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />}
                      {notif.type === "INFO" && <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />}

                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{notif.title}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">{notif.message}</p>
                        <p className="text-[10px] text-slate-400 mt-1">{formatRelativeDate(notif.createdAt)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
          <img
            src={currentUser.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
            alt={currentUser.name}
            className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-500/20"
          />
          <div className="hidden xl:block text-left">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">
              {currentUser.name.split(",")[0]}
            </p>
            <p className="text-[10px] text-slate-400 leading-tight truncate max-w-[120px]">
              {currentUser.position}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
