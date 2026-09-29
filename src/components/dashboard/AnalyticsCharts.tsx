"use client";

import React from "react";
import { DashboardStats } from "@/lib/types";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import {
  PieChart as PieIcon,
  BarChart3,
  TrendingUp,
  Users,
  Layers,
} from "lucide-react";

interface AnalyticsChartsProps {
  stats: DashboardStats;
}

export default function AnalyticsCharts({ stats }: AnalyticsChartsProps) {
  const categoryData = stats.categoryBreakdown || [];
  const monthlyData = stats.monthlyVolume || [];
  const workloadData = (stats.picWorkload || []).slice(0, 5);
  const priorityData = stats.priorityBreakdown || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Monthly Volume & Trend (Area Chart) */}
      <div className="bg-white dark:bg-[#0c121e] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                Tren Volume Agenda & Penyelesaian
              </h3>
              <p className="text-[11px] text-slate-400">
                Aktivitas program kerja 5 bulan terakhir
              </p>
            </div>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="doneGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#334155",
                  borderRadius: "12px",
                  color: "#fff",
                  fontSize: "12px",
                }}
              />
              <Area
                type="monotone"
                dataKey="total"
                name="Total Agenda"
                stroke="#3b82f6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#totalGrad)"
              />
              <Area
                type="monotone"
                dataKey="completed"
                name="Selesai Terlaksana"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#doneGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Category Breakdown (Donut Chart) */}
      <div className="bg-white dark:bg-[#0c121e] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <PieIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                Distribusi Kategori Program Kerja
              </h3>
              <p className="text-[11px] text-slate-400">
                Persentase agenda berdasarkan jenis kegiatan
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-4 h-64">
          <div className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 overflow-y-auto max-h-56 pr-2">
            {categoryData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-slate-700 dark:text-slate-300 truncate">
                    {item.name}
                  </span>
                </div>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100 ml-2">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. PIC Workload Distribution (Bar Chart) */}
      <div className="bg-white dark:bg-[#0c121e] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                Beban Kerja Penanggung Jawab (PIC)
              </h3>
              <p className="text-[11px] text-slate-400">
                Jumlah agenda & task aktif per anggota
              </p>
            </div>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={workloadData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#334155",
                  borderRadius: "12px",
                  color: "#fff",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="eventsCount" name="Agenda PIC" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              <Bar dataKey="tasksCount" name="Task Kanban" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Priority Breakdown Cards */}
      <div className="bg-white dark:bg-[#0c121e] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                Tingkat Urgensi & Prioritas Agenda
              </h3>
              <p className="text-[11px] text-slate-400">
                Segmentasi prioritas untuk efektivitas alokasi waktu
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 h-64 items-center">
          {priorityData.map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col justify-between h-28"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {item.priority}
                </span>
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color || "#3b82f6" }}
                />
              </div>

              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                  {item.count}
                </span>
                <span className="text-[11px] text-slate-400">agenda</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
