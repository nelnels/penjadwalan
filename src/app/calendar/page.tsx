"use client";

import React, { Suspense } from "react";
import DashboardShell from "@/components/layout/DashboardShell";
import CalendarView from "@/components/calendar/CalendarView";

export default function CalendarPage() {
  return (
    <DashboardShell>
      <div className="space-y-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Kalender Jadwal & Agenda Organisasi
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Tampilan interaktif bulanan, mingguan, dan agenda harian dengan filter divisi & PIC terpadu
          </p>
        </div>

        <Suspense
          fallback={
            <div className="flex items-center justify-center p-12 bg-white dark:bg-[#0c121e] rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          }
        >
          <CalendarView />
        </Suspense>
      </div>
    </DashboardShell>
  );
}
