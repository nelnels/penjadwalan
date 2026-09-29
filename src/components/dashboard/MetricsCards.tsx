"use client";

import React from "react";
import { DashboardStats } from "@/lib/types";
import { formatRupiah } from "@/lib/utils";
import {
  CalendarDays,
  Activity,
  CheckCircle2,
  AlertTriangle,
  DollarSign,
  Users,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";

interface MetricsCardsProps {
  stats: DashboardStats;
}

export default function MetricsCards({ stats }: MetricsCardsProps) {
  const cards = [
    {
      title: "Total Agenda Organisasi",
      value: stats.totalEvents,
      subtext: `${stats.upcomingEvents} agenda mendatang`,
      icon: CalendarDays,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-500/10 dark:bg-blue-500/20",
      border: "border-blue-200/80 dark:border-blue-900/40",
      href: "/calendar",
    },
    {
      title: "Kegiatan Sedang Berjalan",
      value: stats.inProgressEvents,
      subtext: `${stats.completedEvents} telah selesai terlaksana`,
      icon: Activity,
      color: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-500/10 dark:bg-indigo-500/20",
      border: "border-indigo-200/80 dark:border-indigo-900/40",
      href: "/timeline",
    },
    {
      title: "Tingkat Penyelesaian Task",
      value: `${stats.taskCompletionRate}%`,
      subtext: `${stats.completedTasks} dari ${stats.totalTasks} task selesai`,
      icon: CheckCircle2,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10 dark:bg-emerald-500/20",
      border: "border-emerald-200/80 dark:border-emerald-900/40",
      href: "/tasks",
    },
    {
      title: "Total Alokasi Anggaran",
      value: formatRupiah(stats.totalBudget),
      subtext: `Di ${stats.totalEvents} kegiatan divisi`,
      icon: DollarSign,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-500/10 dark:bg-amber-500/20",
      border: "border-amber-200/80 dark:border-amber-900/40",
      href: "/calendar",
    },
    {
      title: "Pusat Deteksi Bentrok",
      value: stats.conflictsCount,
      subtext: stats.conflictsCount > 0 ? "Perlu penyesuaian jadwal" : "Semua jadwal aman",
      icon: AlertTriangle,
      color: stats.conflictsCount > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400",
      bg: stats.conflictsCount > 0 ? "bg-rose-500/10 dark:bg-rose-500/20" : "bg-emerald-500/10 dark:bg-emerald-500/20",
      border: stats.conflictsCount > 0 ? "border-rose-200/80 dark:border-rose-900/40" : "border-emerald-200/80 dark:border-emerald-900/40",
      href: "/conflicts",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <Link
            key={idx}
            href={card.href}
            className={`p-4 rounded-2xl bg-white dark:bg-[#0c121e] border ${card.border} shadow-sm hover:shadow-md transition-all group flex flex-col justify-between`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                {card.title}
              </span>
              <div className={`p-2 rounded-xl ${card.bg} ${card.color} group-hover:scale-110 transition-transform`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3">
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                {card.value}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                {card.subtext}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
