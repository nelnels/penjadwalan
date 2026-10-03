import { Activity, CalendarDays, List, ListTodo, LogIn, Moon, Repeat2, Sun } from "lucide-react";
import { useThemeStore } from "../../stores/themeStore";

const items = [
  { href: "/schedules", label: "Schedule", icon: List },
  { href: "/schedules/calendar", label: "Kalender", icon: CalendarDays },
  { href: "/todo", label: "To-do", icon: ListTodo },
  { href: "/habits", label: "Habit", icon: Repeat2 },
  { href: "/health", label: "Health Tracker", icon: Activity },
];

interface AppNavigationProps {
  onOpenAuthModal: () => void;
}

export default function AppNavigation({ onOpenAuthModal }: AppNavigationProps) {
  const { theme, toggleTheme } = useThemeStore();
  const currentPath = window.location.pathname;

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-[#090d16]/90">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-8">
        <a href="/schedules" className="flex shrink-0 items-center gap-2.5 text-slate-900 dark:text-slate-100" aria-label="JadwalKu">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-500/30"><CalendarDays className="h-5 w-5" /></span>
          <span className="text-base font-bold tracking-tight">JadwalKu</span>
        </a>
        <nav className="flex min-w-0 items-center gap-1 overflow-x-auto" aria-label="Navigasi utama">
          {items.map(({ href, label, icon: Icon }) => {
            const active = currentPath === href;
            return (
              <a key={href} href={href} className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-semibold transition-colors sm:px-3 ${active ? "bg-blue-50 text-blue-700 dark:bg-blue-950/45 dark:text-blue-300" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"}`}>
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </a>
            );
          })}
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          <button onClick={onOpenAuthModal} className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-blue-200 px-3 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-50 dark:border-blue-900/70 dark:text-blue-300 dark:hover:bg-blue-950/40" aria-label="Masuk atau daftar akun">
            <LogIn className="h-4 w-4" />
            <span className="hidden sm:inline">Masuk</span>
          </button>
          <button onClick={toggleTheme} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800" aria-label="Ubah tema">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </header>
  );
}
