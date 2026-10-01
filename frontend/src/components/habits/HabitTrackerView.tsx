import { FormEvent, useEffect, useMemo, useState } from "react";
import { Check, Circle, Flame, Plus, Repeat2, Trash2 } from "lucide-react";
import { HabitDTO } from "../../lib/types";
import { HabitsService } from "../../services/api";
import { useAuthStore } from "../../stores/authStore";
import { useNotificationStore } from "../../stores/notificationStore";

const COLORS = ["#2563EB", "#059669", "#EA580C", "#DB2777", "#7C3AED"];
const today = () => new Date().toISOString().slice(0, 10);

export default function HabitTrackerView() {
  const [habits, setHabits] = useState<HabitDTO[]>([]);
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { switchUser } = useAuthStore();
  const { showToast } = useNotificationStore();
  const selectedDate = today();

  const loadHabits = async () => {
    setLoading(true); setError("");
    try { setHabits((await HabitsService.getAll(selectedDate)).habits); }
    catch (requestError: any) { setError([401, 403].includes(requestError?.response?.status) ? "Masuk ke akun JadwalKu untuk menyimpan kebiasaan pribadi." : "Kebiasaan belum dapat dimuat."); }
    finally { setLoading(false); }
  };
  useEffect(() => { void loadHabits(); }, []);

  const addHabit = async (event: FormEvent) => {
    event.preventDefault(); if (!name.trim()) return;
    try { const created = await HabitsService.create({ name: name.trim(), color, targetPerWeek: 7 }); setHabits((items) => [...items, created]); setName(""); showToast("success", "Kebiasaan ditambahkan", "Mulai checklist hari ini."); }
    catch { showToast("error", "Gagal menambah kebiasaan", "Coba lagi setelah masuk ke akun Anda."); }
  };
  const toggle = async (habit: HabitDTO) => {
    try { await HabitsService.toggle(habit.id, selectedDate); await loadHabits(); }
    catch { showToast("error", "Checklist gagal", "Perubahan belum disimpan."); }
  };
  const archive = async (id: string) => {
    try { await HabitsService.archive(id); setHabits((items) => items.filter((item) => item.id !== id)); }
    catch { showToast("error", "Gagal mengarsipkan", "Kebiasaan masih tersimpan."); }
  };
  const completedCount = useMemo(() => habits.filter((habit) => habit.logs.some((log) => log.date.slice(0, 10) === selectedDate)).length, [habits, selectedDate]);

  return <main className="mx-auto max-w-5xl space-y-6 p-4 sm:p-8"><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7"><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="mb-3 flex items-center gap-2 text-sm font-semibold text-blue-700 dark:text-blue-300"><Repeat2 className="h-4 w-4" />Habit Tracker</div><h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Bangun kebiasaan, satu hari sekali.</h1><p className="mt-2 text-sm text-slate-500">{completedCount} dari {habits.length} kebiasaan selesai hari ini.</p></div><Flame className="h-9 w-9 text-orange-500" /></div><form onSubmit={addHabit} className="mt-6 flex flex-wrap gap-2"><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Contoh: Minum air putih" className="min-w-[220px] flex-1 rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800" /><div className="flex items-center gap-1.5">{COLORS.map((item) => <button type="button" key={item} onClick={() => setColor(item)} aria-label="Pilih warna" className={`h-7 w-7 rounded-full ${color === item ? "ring-2 ring-offset-2 ring-slate-500 dark:ring-offset-slate-900" : ""}`} style={{ backgroundColor: item }} />)}</div><button className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"><Plus className="h-4 w-4" />Tambah</button></form></section>{loading ? <section className="grid gap-3 sm:grid-cols-2">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-24 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />)}</section> : error ? <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100"><p className="font-bold">Kebiasaan belum tersedia</p><p className="mt-1 text-sm">{error}</p>{error.startsWith("Masuk") && <button onClick={async () => { await switchUser(""); await loadHabits(); }} className="mt-4 rounded-xl bg-amber-800 px-3.5 py-2 text-sm font-semibold text-white dark:bg-amber-200 dark:text-amber-950">Gunakan akun demo</button>}</section> : <section className="grid gap-3 sm:grid-cols-2">{habits.length === 0 ? <div className="col-span-full rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-500 dark:border-slate-700">Tambahkan kebiasaan pertama Anda untuk mulai mencatat konsistensi.</div> : habits.map((habit) => { const done = habit.logs.some((log) => log.date.slice(0, 10) === selectedDate); return <article key={habit.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"><button onClick={() => void toggle(habit)} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-white" style={{ backgroundColor: done ? habit.color : "#94a3b8" }} aria-label="Tandai kebiasaan"><Check className="h-5 w-5" /></button><div className="min-w-0 flex-1"><p className={`font-bold ${done ? "text-slate-400 line-through" : "text-slate-800 dark:text-slate-100"}`}>{habit.name}</p><p className="mt-0.5 text-xs text-slate-500">Target harian · {done ? "Selesai hari ini" : "Belum dicentang"}</p></div><button onClick={() => void archive(habit.id)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label="Arsipkan kebiasaan"><Trash2 className="h-4 w-4" /></button></article>; })}</section>}</main>;
}
