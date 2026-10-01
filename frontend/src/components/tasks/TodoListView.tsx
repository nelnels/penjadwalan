import { FormEvent, useEffect, useMemo, useState } from "react";
import { Check, Circle, ListTodo, Plus, Trash2 } from "lucide-react";
import { TaskDTO } from "../../lib/types";
import { TasksService } from "../../services/api";
import { useNotificationStore } from "../../stores/notificationStore";

const priorities = ["LOW", "MEDIUM", "HIGH", "URGENT"];
const priorityLabels: Record<string, string> = { LOW: "Rendah", MEDIUM: "Sedang", HIGH: "Tinggi", URGENT: "Mendesak" };

export default function TodoListView() {
  const [tasks, setTasks] = useState<TaskDTO[]>([]);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "open" | "done">("open");
  const { showToast } = useNotificationStore();

  const loadTasks = async () => {
    setLoading(true);
    try { setTasks(await TasksService.getAll()); }
    catch { showToast("error", "To-do tidak termuat", "Periksa backend lalu coba lagi."); }
    finally { setLoading(false); }
  };
  useEffect(() => { void loadTasks(); }, []);

  const visibleTasks = useMemo(() => tasks.filter((task) => filter === "all" || (filter === "done" ? task.status === "DONE" : task.status !== "DONE")), [tasks, filter]);
  const completed = tasks.filter((task) => task.status === "DONE").length;

  const addTask = async (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;
    try {
      const created = await TasksService.create({ title: title.trim(), priority, dueDate: dueDate || null, status: "TODO" });
      setTasks((items) => [created, ...items]); setTitle(""); setDueDate("");
      showToast("success", "To-do ditambahkan", "Tugas baru siap dikerjakan.");
    } catch { showToast("error", "Gagal menambah to-do", "Coba lagi setelah backend aktif."); }
  };

  const toggleTask = async (task: TaskDTO) => {
    const status = task.status === "DONE" ? "TODO" : "DONE";
    try {
      const updated = await TasksService.update(task.id, { status });
      setTasks((items) => items.map((item) => item.id === task.id ? { ...item, ...updated } : item));
    } catch { showToast("error", "Perubahan gagal", "Status to-do belum tersimpan."); }
  };

  const deleteTask = async (id: string) => {
    try { await TasksService.delete(id); setTasks((items) => items.filter((item) => item.id !== id)); }
    catch { showToast("error", "Gagal menghapus", "To-do masih tersimpan."); }
  };

  return <main className="mx-auto max-w-5xl space-y-6 p-4 sm:p-8">
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7"><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="mb-3 flex items-center gap-2 text-sm font-semibold text-blue-700 dark:text-blue-300"><ListTodo className="h-4 w-4" />To-do List</div><h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Selesaikan hal kecil dengan jelas.</h1><p className="mt-2 text-sm text-slate-500">{completed} dari {tasks.length} tugas sudah selesai.</p></div></div>
      <form onSubmit={addTask} className="mt-6 grid gap-2 md:grid-cols-[1fr_140px_170px_auto]"><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Apa yang ingin dikerjakan?" className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800" /><select value={priority} onChange={(event) => setPriority(event.target.value)} className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800">{priorities.map((item) => <option key={item} value={item}>{priorityLabels[item]}</option>)}</select><input value={dueDate} onChange={(event) => setDueDate(event.target.value)} type="date" className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800" /><button className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"><Plus className="h-4 w-4" />Tambah</button></form>
    </section>
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"><div className="flex items-center gap-2 border-b border-slate-200 p-3 dark:border-slate-800">{(["open", "done", "all"] as const).map((item) => <button key={item} onClick={() => setFilter(item)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${filter === item ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"}`}>{item === "open" ? "Belum selesai" : item === "done" ? "Selesai" : "Semua"}</button>)}</div><div className="divide-y divide-slate-100 dark:divide-slate-800">{loading ? Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-16 animate-pulse bg-slate-50 dark:bg-slate-800/40" />) : visibleTasks.length === 0 ? <div className="p-10 text-center"><p className="font-semibold text-slate-700 dark:text-slate-200">Tidak ada to-do di sini.</p><p className="mt-1 text-sm text-slate-500">Tambahkan tugas pertama Anda di atas.</p></div> : visibleTasks.map((task) => <article key={task.id} className="flex items-center gap-3 p-4"><button onClick={() => void toggleTask(task)} className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border ${task.status === "DONE" ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300 text-transparent dark:border-slate-600"}`} aria-label="Ubah status tugas"><Check className="h-4 w-4" /></button><div className="min-w-0 flex-1"><p className={`font-semibold ${task.status === "DONE" ? "text-slate-400 line-through" : "text-slate-800 dark:text-slate-100"}`}>{task.title}</p><p className="mt-0.5 text-xs text-slate-500">{priorityLabels[task.priority]}{task.dueDate ? ` · ${new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(task.dueDate))}` : ""}</p></div><button onClick={() => void deleteTask(task.id)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30" aria-label="Hapus to-do"><Trash2 className="h-4 w-4" /></button></article>)}</div></section>
  </main>;
}
