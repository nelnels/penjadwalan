import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO, isToday, isTomorrow, isYesterday, formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { EventCategory, EventPriority, EventStatus, TaskStatus } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateIndo(dateStr: string | Date, pattern: string = "d MMMM yyyy"): string {
  try {
    const date = typeof dateStr === "string" ? parseISO(dateStr) : dateStr;
    return format(date, pattern, { locale: id });
  } catch (err) {
    return String(dateStr);
  }
}

export function formatTimeRange(startStr: string | Date, endStr: string | Date, isAllDay: boolean = false): string {
  try {
    const start = typeof startStr === "string" ? parseISO(startStr) : startStr;
    const end = typeof endStr === "string" ? parseISO(endStr) : endStr;

    if (isAllDay) {
      return "Sepanjang Hari";
    }

    const startFormatted = format(start, "HH:mm");
    const endFormatted = format(end, "HH:mm");
    return `${startFormatted} - ${endFormatted} WIB`;
  } catch (err) {
    return "";
  }
}

export function formatRelativeDate(dateStr: string | Date): string {
  try {
    const date = typeof dateStr === "string" ? parseISO(dateStr) : dateStr;
    if (isToday(date)) return `Hari ini, ${format(date, "HH:mm")}`;
    if (isTomorrow(date)) return `Besok, ${format(date, "HH:mm")}`;
    if (isYesterday(date)) return `Kemarin, ${format(date, "HH:mm")}`;
    return formatDistanceToNow(date, { addSuffix: true, locale: id });
  } catch {
    return String(dateStr);
  }
}

export function formatRupiah(amount?: number | null): string {
  if (amount === undefined || amount === null) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export const CATEGORY_META: Record<
  EventCategory,
  { label: string; bg: string; text: string; border: string; color: string }
> = {
  SEMINAR_WORKSHOP: {
    label: "Seminar & Workshop",
    bg: "bg-blue-500/10 dark:bg-blue-500/20",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-200 dark:border-blue-800",
    color: "#3b82f6",
  },
  RAPAT_KOORDINASI: {
    label: "Rapat Koordinasi",
    bg: "bg-purple-500/10 dark:bg-purple-500/20",
    text: "text-purple-600 dark:text-purple-400",
    border: "border-purple-200 dark:border-purple-800",
    color: "#8b5cf6",
  },
  DEADLINE_PROYEK: {
    label: "Deadline & Milestone",
    bg: "bg-amber-500/10 dark:bg-amber-500/20",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-800",
    color: "#f59e0b",
  },
  KEGIATAN_SOSIAL: {
    label: "Kegiatan Sosial / Expo",
    bg: "bg-emerald-500/10 dark:bg-emerald-500/20",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-800",
    color: "#10b981",
  },
  KOMPETISI_LOMBA: {
    label: "Kompetisi & Lomba",
    bg: "bg-rose-500/10 dark:bg-rose-500/20",
    text: "text-rose-600 dark:text-rose-400",
    border: "border-rose-200 dark:border-rose-800",
    color: "#f43f5e",
  },
  INTERNAL_TEAM: {
    label: "Internal Tim & Briefing",
    bg: "bg-cyan-500/10 dark:bg-cyan-500/20",
    text: "text-cyan-600 dark:text-cyan-400",
    border: "border-cyan-200 dark:border-cyan-800",
    color: "#06b6d4",
  },
};

export const PRIORITY_META: Record<
  EventPriority,
  { label: string; bg: string; text: string; dot: string }
> = {
  LOW: {
    label: "Rendah",
    bg: "bg-slate-100 dark:bg-slate-800",
    text: "text-slate-600 dark:text-slate-300",
    dot: "bg-slate-400",
  },
  MEDIUM: {
    label: "Sedang",
    bg: "bg-blue-50 dark:bg-blue-950/50",
    text: "text-blue-600 dark:text-blue-400",
    dot: "bg-blue-500",
  },
  HIGH: {
    label: "Tinggi",
    bg: "bg-amber-50 dark:bg-amber-950/50",
    text: "text-amber-600 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  URGENT: {
    label: "Mendesak",
    bg: "bg-rose-50 dark:bg-rose-950/50",
    text: "text-rose-600 dark:text-rose-400",
    dot: "bg-rose-500",
  },
};

export const STATUS_META: Record<
  EventStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  UPCOMING: {
    label: "Mendatang",
    bg: "bg-sky-50 dark:bg-sky-950/50",
    text: "text-sky-600 dark:text-sky-400",
    border: "border-sky-200 dark:border-sky-800",
  },
  IN_PROGRESS: {
    label: "Sedang Berjalan",
    bg: "bg-indigo-50 dark:bg-indigo-950/50",
    text: "text-indigo-600 dark:text-indigo-400",
    border: "border-indigo-200 dark:border-indigo-800",
  },
  COMPLETED: {
    label: "Selesai",
    bg: "bg-emerald-50 dark:bg-emerald-950/50",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-800",
  },
  POSTPONED: {
    label: "Ditunda",
    bg: "bg-amber-50 dark:bg-amber-950/50",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-800",
  },
  CANCELLED: {
    label: "Dibatalkan",
    bg: "bg-rose-50 dark:bg-rose-950/50",
    text: "text-rose-600 dark:text-rose-400",
    border: "border-rose-200 dark:border-rose-800",
  },
};

export const TASK_STATUS_META: Record<
  TaskStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  TODO: {
    label: "Belum Dikerjakan",
    bg: "bg-slate-100 dark:bg-slate-800",
    text: "text-slate-700 dark:text-slate-300",
    border: "border-slate-200 dark:border-slate-700",
  },
  IN_PROGRESS: {
    label: "Dalam Proses",
    bg: "bg-blue-100 dark:bg-blue-900/40",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-800",
  },
  REVIEW: {
    label: "Review & Evaluasi",
    bg: "bg-purple-100 dark:bg-purple-900/40",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-200 dark:border-purple-800",
  },
  DONE: {
    label: "Selesai",
    bg: "bg-emerald-100 dark:bg-emerald-900/40",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800",
  },
};

export const DEPARTMENTS = [
  "Semua Divisi",
  "Biro Eksekutif & Pimpinan",
  "Divisi Acara & Program",
  "Divisi Humas, Publikasi & Dokumentasi",
  "Divisi Logistik & IT Support",
  "Divisi Sponsorship & Keuangan",
  "Divisi Konsumsi & Perlengkapan",
];

export const ROOMS_LIST = [
  { name: "Auditorium Utama Lt. 3", capacity: 250, type: "OFFLINE" },
  { name: "Ruang Rapat Eksekutif A-101", capacity: 20, type: "OFFLINE" },
  { name: "Ruang Diskusi & Workshop B-204", capacity: 40, type: "OFFLINE" },
  { name: "Coworking Space Divisi", capacity: 30, type: "OFFLINE" },
  { name: "Zoom Meeting Room Pro 1 (Capacity 500)", capacity: 500, type: "ONLINE" },
  { name: "Google Meet Enterprise Link", capacity: 250, type: "ONLINE" },
  { name: "Hybrid Hall & Webcast Studio", capacity: 100, type: "HYBRID" },
];
