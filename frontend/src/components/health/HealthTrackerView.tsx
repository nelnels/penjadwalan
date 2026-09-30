import { useEffect, useMemo, useState } from "react";
import { Activity, Apple, Bike, Flame, Footprints, HeartPulse, RefreshCw, Smartphone, Timer, Watch } from "lucide-react";
import { HealthSummaryDTO } from "../../lib/types";
import { HealthService } from "../../services/api";
import { useNotificationStore } from "../../stores/notificationStore";
import { useAuthStore } from "../../stores/authStore";

function formatNumber(value: number) {
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(value);
}

function dateRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 6);
  return { from: start.toISOString().slice(0, 10), to: end.toISOString().slice(0, 10) };
}

export default function HealthTrackerView() {
  const [summary, setSummary] = useState<HealthSummaryDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { showToast } = useNotificationStore();
  const { currentUser, switchUser } = useAuthStore();

  const loadSummary = async () => {
    setLoading(true);
    setError("");
    try {
      setSummary(await HealthService.getSummary(dateRange()));
    } catch (requestError: any) {
      const status = requestError?.response?.status;
      setError(status === 401 || status === 403 ? "Masuk ke akun JadwalKu terlebih dahulu agar data kesehatan Anda aman dan personal." : "Ringkasan kesehatan belum dapat dimuat. Periksa koneksi backend lalu coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadSummary(); }, []);

  const latest = summary?.latest;
  const metricCards = useMemo(() => [
    { label: "Langkah hari ini", value: latest ? formatNumber(latest.steps) : "-", unit: "langkah", icon: Footprints, color: "text-blue-600 dark:text-blue-300", tint: "bg-blue-50 dark:bg-blue-950/35" },
    { label: "Energi aktif", value: latest ? formatNumber(latest.activeEnergyKcal) : "-", unit: "kkal", icon: Flame, color: "text-orange-600 dark:text-orange-300", tint: "bg-orange-50 dark:bg-orange-950/35" },
    { label: "Olahraga", value: latest ? formatNumber(latest.exerciseMinutes) : "-", unit: "menit", icon: Timer, color: "text-emerald-600 dark:text-emerald-300", tint: "bg-emerald-50 dark:bg-emerald-950/35" },
    { label: "Jarak berjalan", value: latest ? (latest.distanceMeters / 1000).toFixed(1) : "-", unit: "km", icon: Bike, color: "text-violet-600 dark:text-violet-300", tint: "bg-violet-50 dark:bg-violet-950/35" },
  ], [latest]);

  return (
    <main className="mx-auto max-w-7xl space-y-6 p-4 sm:p-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-blue-700 dark:text-blue-300"><Activity className="h-4 w-4" />Health Tracker</div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Jadwal yang selaras dengan ritme tubuh Anda.</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">Ringkasan Apple Health membantu Anda melihat aktivitas sebelum merencanakan agenda yang padat.</p>
          </div>
          <button onClick={() => { void loadSummary(); showToast("info", "Memuat ulang", "Mengambil ringkasan kesehatan terbaru."); }} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />Muat ulang
          </button>
        </div>
      </section>

      {loading ? <HealthSkeleton /> : error ? <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100"><h2 className="font-bold">Data belum tersedia</h2><p className="mt-1 text-sm">{error}</p>{error.startsWith("Masuk") && <button onClick={async () => { await switchUser(currentUser.id); await loadSummary(); }} className="mt-4 rounded-xl bg-amber-800 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-900 dark:bg-amber-200 dark:text-amber-950 dark:hover:bg-amber-100">Gunakan akun demo</button>}</section> : <>
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {metricCards.map(({ label, value, unit, icon: Icon, color, tint }) => <article key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"><div className={`mb-5 grid h-9 w-9 place-items-center rounded-xl ${tint} ${color}`}><Icon className="h-4 w-4" /></div><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{value}<span className="ml-1 text-sm font-medium text-slate-500">{unit}</span></p></article>)}
        </section>

        {summary?.connected ? <section className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]"><article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"><h2 className="font-bold text-slate-900 dark:text-slate-100">Aktivitas 7 hari terakhir</h2><div className="mt-5 grid grid-cols-7 gap-2">{summary.daily.map((item) => <div key={item.id} className="min-w-0 rounded-xl bg-slate-50 p-2 text-center dark:bg-slate-800/70"><p className="text-[10px] font-medium text-slate-400">{new Intl.DateTimeFormat("id-ID", { weekday: "short" }).format(new Date(item.date))}</p><p className="mt-2 truncate text-sm font-bold text-slate-800 dark:text-slate-100">{formatNumber(item.steps)}</p><p className="text-[10px] text-slate-400">langkah</p></div>)}</div></article><article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"><h2 className="font-bold text-slate-900 dark:text-slate-100">Detak jantung</h2><div className="mt-6 space-y-3"><div className="flex items-center gap-3"><HeartPulse className="h-5 w-5 text-rose-500" /><div><p className="text-xs text-slate-500">Saat istirahat</p><p className="font-bold">{latest?.restingHeartRate ?? "-"} {latest?.restingHeartRate ? "BPM" : ""}</p></div></div><div className="flex items-center gap-3"><HeartPulse className="h-5 w-5 text-rose-400" /><div><p className="text-xs text-slate-500">Saat berjalan</p><p className="font-bold">{latest?.walkingHeartRate ?? "-"} {latest?.walkingHeartRate ? "BPM" : ""}</p></div></div></div></article></section> : <AppleHealthSetup />}
      </>}
    </main>
  );
}

function AppleHealthSetup() {
  return <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:grid-cols-[auto_1fr]"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"><Apple className="h-6 w-6" /></div><div><h2 className="font-bold text-slate-900 dark:text-slate-100">Hubungkan melalui aplikasi iPhone</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">Apple Watch menyimpan data di Apple Health pada iPhone. Buka source aplikasi pendamping pada folder <code className="rounded bg-slate-100 px-1 py-0.5 text-xs dark:bg-slate-800">ios/JadwalKuHealthBridge</code>, pasang lewat Xcode, lalu izinkan akses Health.</p><div className="mt-4 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200"><Smartphone className="h-4 w-4 text-blue-600" />Data akan muncul di sini setelah sinkronisasi pertama.</div></div></section>;
}

function HealthSkeleton() {
  return <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-40 animate-pulse rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800" />)}</section>;
}
