"use client";

import React, { useState, useEffect, useMemo } from "react";
import { EventDTO } from "@/lib/types";
import {
  CATEGORY_META,
  STATUS_META,
  formatDateIndo,
  formatTimeRange,
  DEPARTMENTS,
} from "@/lib/utils";
import {
  format,
  addDays,
  subDays,
  differenceInDays,
  parseISO,
  isSameDay,
  isToday,
  startOfDay,
  eachDayOfInterval,
} from "date-fns";
import { id } from "date-fns/locale";
import {
  GanttChart,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Filter,
  Users,
  Sparkles,
  Layers,
} from "lucide-react";

export default function TimelineGanttView() {
  const [events, setEvents] = useState<EventDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<Date>(subDays(startOfDay(new Date()), 3));
  const [daysCount, setDaysCount] = useState<number>(18);
  const [selectedDept, setSelectedDept] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/events");
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    const handleRefresh = () => fetchEvents();
    window.addEventListener("refresh-events", handleRefresh);
    return () => window.removeEventListener("refresh-events", handleRefresh);
  }, []);

  const timelineDays = useMemo(() => {
    return eachDayOfInterval({
      start: startDate,
      end: addDays(startDate, daysCount - 1),
    });
  }, [startDate, daysCount]);

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (selectedDept !== "ALL" && e.department !== selectedDept) return false;
      if (selectedCategory !== "ALL" && e.category !== selectedCategory) return false;
      return true;
    });
  }, [events, selectedDept, selectedCategory]);

  const handlePrev = () => setStartDate((d) => subDays(d, 7));
  const handleNext = () => setStartDate((d) => addDays(d, 7));
  const handleToday = () => setStartDate(subDays(startOfDay(new Date()), 3));

  const handleOpenDetail = (eventId: string) => {
    window.dispatchEvent(new CustomEvent("open-event-detail", { detail: { eventId } }));
  };

  return (
    <div className="space-y-4 animate-in fade-in">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0c121e] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        <div>
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <GanttChart className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Project Roadmap & Timeline Gantt
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Visualisasi rentang waktu pelaksanaan, progress penyelesaian, dan milestone acara
          </p>
        </div>

        {/* Zoom & Navigator */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
            <button
              onClick={handlePrev}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-3 py-1 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              Hari Ini
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
            <button
              onClick={() => setDaysCount(14)}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                daysCount === 14
                  ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              2 Minggu
            </button>
            <button
              onClick={() => setDaysCount(21)}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                daysCount === 21
                  ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              3 Minggu
            </button>
            <button
              onClick={() => setDaysCount(30)}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                daysCount === 30
                  ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              1 Bulan
            </button>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-[#0c121e] p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-wrap items-center gap-3 text-xs">
        <span className="font-bold text-slate-500 flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-blue-500" />
          Filter Timeline:
        </span>

        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
        >
          <option value="ALL">Semua Divisi</option>
          {DEPARTMENTS.map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
        >
          <option value="ALL">Semua Kategori</option>
          {Object.entries(CATEGORY_META).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
      </div>

      {/* Gantt Timeline Container */}
      <div className="bg-white dark:bg-[#0c121e] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 overflow-x-auto shadow-sm">
        <div className="min-w-[900px]">
          {/* Header Row with Days */}
          <div className="grid grid-cols-[260px_1fr] border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 sticky top-0 z-10">
            <div className="p-3 font-bold text-xs text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800">
              Agenda & Penanggung Jawab
            </div>

            <div className="grid" style={{ gridTemplateColumns: `repeat(${daysCount}, minmax(0, 1fr))` }}>
              {timelineDays.map((day, idx) => {
                const isDayToday = isToday(day);
                return (
                  <div
                    key={idx}
                    className={`p-2 text-center border-r border-slate-200/60 dark:border-slate-800/60 ${
                      isDayToday ? "bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-extrabold" : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    <p className="text-[10px] font-semibold uppercase">{format(day, "EEE", { locale: id })}</p>
                    <p className="text-xs font-bold">{format(day, "d")}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Event Gantt Rows */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {filteredEvents.map((event) => {
              const meta = CATEGORY_META[event.category] || CATEGORY_META.INTERNAL_TEAM;
              const eventStart = parseISO(event.startDate);
              const eventEnd = parseISO(event.endDate);

              // Calculate start offset and span in days relative to current timeline start
              const startOffset = differenceInDays(startOfDay(eventStart), startOfDay(startDate));
              const duration = Math.max(1, differenceInDays(startOfDay(eventEnd), startOfDay(eventStart)) + 1);

              const isVisibleInWindow = startOffset + duration > 0 && startOffset < daysCount;

              return (
                <div
                  key={event.id}
                  onClick={() => handleOpenDetail(event.id)}
                  className="grid grid-cols-[260px_1fr] hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors cursor-pointer group"
                >
                  {/* Left Column: Title & PIC */}
                  <div className="p-3 border-r border-slate-200 dark:border-slate-800 flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: event.color || meta.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-blue-600 transition-colors">
                        {event.title}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {event.assignees[0]?.user.name.split(",")[0] || "No PIC"} • {event.department}
                      </p>
                    </div>
                  </div>

                  {/* Right Column: Timeline Grid Bar */}
                  <div
                    className="grid relative py-2.5 items-center"
                    style={{ gridTemplateColumns: `repeat(${daysCount}, minmax(0, 1fr))` }}
                  >
                    {/* Vertical grid lines */}
                    {timelineDays.map((day, idx) => (
                      <div
                        key={idx}
                        className={`h-full border-r border-slate-100 dark:border-slate-800/40 pointer-events-none ${
                          isToday(day) ? "bg-blue-500/5" : ""
                        }`}
                      />
                    ))}

                    {/* Horizontal Gantt Bar */}
                    {isVisibleInWindow && (
                      <div
                        className="absolute h-8 rounded-xl shadow-sm border flex items-center justify-between px-2.5 transition-all hover:shadow-md hover:scale-[1.01] z-10 overflow-hidden"
                        style={{
                          left: `${Math.max(0, (startOffset / daysCount) * 100)}%`,
                          width: `${Math.min(
                            100,
                            ((Math.min(startOffset + duration, daysCount) - Math.max(0, startOffset)) / daysCount) * 100
                          )}%`,
                          backgroundColor: `${event.color || meta.color}25`,
                          borderColor: `${event.color || meta.color}60`,
                        }}
                      >
                        {/* Progress Fill Indicator */}
                        <div
                          className="absolute inset-0 opacity-20 pointer-events-none"
                          style={{
                            width: `${event.progress}%`,
                            backgroundColor: event.color || meta.color,
                          }}
                        />

                        <div className="flex items-center gap-1.5 min-w-0 relative z-10">
                          <span
                            className="text-[11px] font-bold truncate"
                            style={{ color: event.color || meta.color }}
                          >
                            {event.title}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 relative z-10 shrink-0">
                          {event.milestones && event.milestones.length > 0 && (
                            <span className="text-[10px] font-bold text-amber-500 bg-amber-500/20 px-1 rounded">
                              ◆ {event.milestones.length}
                            </span>
                          )}
                          <span
                            className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/70 dark:bg-slate-900/70"
                            style={{ color: event.color || meta.color }}
                          >
                            {event.progress}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
