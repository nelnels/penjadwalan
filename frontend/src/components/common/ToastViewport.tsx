import { useNotificationStore } from "../../stores/notificationStore";

export default function ToastViewport() {
  const { toasts, removeToast } = useNotificationStore();
  return <div className="fixed right-4 top-4 z-50 space-y-2" role="status">
    {toasts.map((toast) => <button key={toast.id} onClick={() => removeToast(toast.id)} className={`block w-80 rounded-xl border p-3 text-left shadow-lg ${toast.type === "error" ? "border-rose-200 bg-rose-50 text-rose-800" : "border-blue-200 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"}`}>
      <p className="text-sm font-bold">{toast.title}</p><p className="mt-0.5 text-xs opacity-80">{toast.message}</p>
    </button>)}
  </div>;
}
