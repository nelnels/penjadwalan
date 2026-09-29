import { useCallback, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin, { DateClickArg } from "@fullcalendar/interaction";
import { EventClickArg, EventDropArg, EventInput, DatesSetArg } from "@fullcalendar/core";
import { ArrowLeft, Moon, Plus, Sun } from "lucide-react";
import { EventDTO } from "../../lib/types";
import { EventsService, GoogleCalendarService, SchedulesService } from "../../services/api";
import { useNotificationStore } from "../../stores/notificationStore";
import { useThemeStore } from "../../stores/themeStore";

const categoryColors: Record<string, string> = {
  SEMINAR_WORKSHOP: "#3b82f6", RAPAT_KOORDINASI: "#8b5cf6", DEADLINE_PROYEK: "#f59e0b", KEGIATAN_SOSIAL: "#10b981", KOMPETISI_LOMBA: "#f43f5e", INTERNAL_TEAM: "#64748b",
};

type ModalState = { mode: "create"; start: string; end: string } | { mode: "edit"; schedule: EventDTO } | null;

function toInputDate(value: Date | string) { return new Date(value).toISOString().slice(0, 16); }

export default function ScheduleCalendarView() {
  const calendarRef = useRef<FullCalendar>(null);
  const [events, setEvents] = useState<EventInput[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState>(null);
  const [googleStatus, setGoogleStatus] = useState<{ configured: boolean; connected: boolean } | null>(null);
  const { showToast } = useNotificationStore();
  const { theme, toggleTheme } = useThemeStore();

  const fetchSchedules = useCallback(async (range: DatesSetArg) => {
    setLoading(true);
    try {
      const params = { startDate: range.startStr.slice(0, 10), endDate: range.endStr.slice(0, 10) };
      const [result, status] = await Promise.all([SchedulesService.getAll({ all: "true", ...params }), GoogleCalendarService.status()]);
      setGoogleStatus(status);
      const localEvents = result.data.map((schedule) => ({ id: schedule.id, title: schedule.title, start: schedule.startDate, end: schedule.endDate, allDay: schedule.isAllDay, backgroundColor: schedule.color || categoryColors[schedule.category], borderColor: schedule.color || categoryColors[schedule.category], extendedProps: { schedule } }));
      const googleEvents = status.connected ? await GoogleCalendarService.getEvents(params) : [];
      setEvents([...localEvents, ...googleEvents.map((schedule) => ({ id: schedule.id, title: `Google: ${schedule.title}`, start: schedule.startDate, end: schedule.endDate, allDay: schedule.isAllDay, backgroundColor: schedule.color, borderColor: schedule.color, editable: false, extendedProps: { google: true } }))]);
    } catch {
      showToast("error", "Gagal memuat kalender", "Periksa koneksi ke API backend lalu coba lagi.");
    } finally { setLoading(false); }
  }, [showToast]);

  const saveSchedule = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const payload = {
      title: String(data.get("title") || "").trim(), description: String(data.get("description") || ""), category: String(data.get("category")), status: String(data.get("status")),
      startDate: new Date(String(data.get("startDate"))).toISOString(), endDate: new Date(String(data.get("endDate"))).toISOString(), locationName: String(data.get("locationName") || "Ruang Rapat Utama"), color: categoryColors[String(data.get("category"))] || "#3b82f6",
    };
    if (!payload.title) return showToast("warning", "Judul wajib", "Masukkan judul jadwal terlebih dahulu.");
    try {
      if (modal?.mode === "edit") await EventsService.update(modal.schedule.id, payload);
      else await EventsService.create(payload);
      showToast("success", "Jadwal disimpan", "Perubahan jadwal telah disimpan.");
      setModal(null);
      const api = calendarRef.current?.getApi();
      if (api) await fetchSchedules({ start: api.view.activeStart, end: api.view.activeEnd, startStr: api.view.activeStart.toISOString(), endStr: api.view.activeEnd.toISOString(), timeZone: "local", view: api.view });
    } catch { showToast("error", "Gagal menyimpan", "Jadwal tidak dapat disimpan. Silakan coba lagi."); }
  };

  const onEventDrop = async (info: EventDropArg) => {
    const schedule = info.event.extendedProps.schedule as EventDTO;
    try {
      await EventsService.update(schedule.id, { startDate: info.event.start?.toISOString(), endDate: (info.event.end || info.event.start)?.toISOString() });
      showToast("success", "Jadwal dipindahkan", "Waktu jadwal berhasil diperbarui.");
    } catch { info.revert(); showToast("error", "Gagal memindahkan jadwal", "Perubahan dibatalkan karena API gagal menyimpan."); }
  };

  return <main className="mx-auto max-w-7xl space-y-4 p-4 sm:p-8">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-bold">Calendar Schedule</h1><p className="text-sm text-slate-500">Tampilan bulan, minggu, dan hari. Seret event untuk reschedule.</p></div><div className="flex flex-wrap gap-2">{googleStatus?.configured && !googleStatus.connected && <button onClick={GoogleCalendarService.connect} className="rounded-xl bg-[#4285F4] px-3 py-2 text-sm font-semibold text-white">Hubungkan Google Calendar</button>}{googleStatus?.connected && <span className="rounded-xl bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">Google Calendar tersambung</span>}<a href="/schedules" className="inline-flex items-center gap-1 rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-700"><ArrowLeft className="h-4 w-4" />List</a><button onClick={toggleTheme} className="rounded-xl border border-slate-300 p-2 dark:border-slate-700" aria-label="Ubah tema">{theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</button></div></div>
    <section className="relative rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900"><FullCalendar ref={calendarRef} plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]} initialView="dayGridMonth" headerToolbar={{ left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek,timeGridDay" }} locale="id" firstDay={1} height="auto" editable selectable selectMirror events={events} datesSet={fetchSchedules} dateClick={(info: DateClickArg) => setModal({ mode: "create", start: toInputDate(info.date), end: toInputDate(new Date(info.date.getTime() + 60 * 60 * 1000)) })} eventClick={(info: EventClickArg) => { if (info.event.extendedProps.google) return; setModal({ mode: "edit", schedule: info.event.extendedProps.schedule as EventDTO }); }} eventDrop={onEventDrop} />{loading && <div className="absolute inset-0 grid grid-cols-7 gap-px overflow-hidden rounded-2xl bg-slate-200/70 dark:bg-slate-800/70">{Array.from({ length: 35 }).map((_, index) => <div key={index} className="animate-pulse bg-white p-2 dark:bg-slate-900"><div className="ml-auto h-4 w-4 rounded bg-slate-200 dark:bg-slate-700" />{index % 3 === 0 && <div className="mt-5 h-5 w-3/4 rounded bg-slate-200 dark:bg-slate-700" />}</div>)}</div>}</section>
    {modal && <ScheduleModal modal={modal} onClose={() => setModal(null)} onSubmit={saveSchedule} />}
  </main>;
}

function ScheduleModal({ modal, onClose, onSubmit }: { modal: ModalState; onClose: () => void; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void }) {
  const schedule = modal?.mode === "edit" ? modal.schedule : undefined;
  return <div className="fixed inset-0 z-40 grid place-items-center bg-slate-950/50 p-4"><form onSubmit={onSubmit} className="w-full max-w-lg space-y-3 rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-900"><div className="flex items-center justify-between"><h2 className="font-bold">{schedule ? "Detail / Edit Jadwal" : "Tambah Jadwal Baru"}</h2><button type="button" onClick={onClose}>×</button></div><input required name="title" defaultValue={schedule?.title} placeholder="Judul jadwal" className="w-full rounded-lg border p-2 dark:bg-slate-800"/><textarea name="description" defaultValue={schedule?.description || ""} placeholder="Deskripsi" className="w-full rounded-lg border p-2 dark:bg-slate-800"/><div className="grid grid-cols-2 gap-3"><select name="category" defaultValue={schedule?.category || "INTERNAL_TEAM"} className="rounded-lg border p-2 dark:bg-slate-800"><option value="INTERNAL_TEAM">Internal Team</option><option value="SEMINAR_WORKSHOP">Seminar / Workshop</option><option value="RAPAT_KOORDINASI">Rapat Koordinasi</option><option value="DEADLINE_PROYEK">Deadline Proyek</option><option value="KEGIATAN_SOSIAL">Kegiatan Sosial</option><option value="KOMPETISI_LOMBA">Kompetisi / Lomba</option></select><select name="status" defaultValue={schedule?.status || "UPCOMING"} className="rounded-lg border p-2 dark:bg-slate-800"><option value="UPCOMING">Upcoming</option><option value="IN_PROGRESS">Ongoing</option><option value="COMPLETED">Selesai</option><option value="CANCELLED">Dibatalkan</option></select></div><div className="grid grid-cols-2 gap-3"><input required type="datetime-local" name="startDate" defaultValue={toInputDate(schedule?.startDate || (modal as any).start)} className="rounded-lg border p-2 dark:bg-slate-800"/><input required type="datetime-local" name="endDate" defaultValue={toInputDate(schedule?.endDate || (modal as any).end)} className="rounded-lg border p-2 dark:bg-slate-800"/></div><input name="locationName" defaultValue={schedule?.locationName || ""} placeholder="Lokasi" className="w-full rounded-lg border p-2 dark:bg-slate-800"/><button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white"><Plus className="h-4 w-4" />Simpan Jadwal</button></form></div>;
}
