import { create } from "zustand";
import { NotificationDTO } from "../lib/types";
import axios from "axios";

export interface Toast {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
}

interface NotificationState {
  notifications: NotificationDTO[];
  toasts: Toast[];
  unreadCount: number;
  showToast: (type: "success" | "error" | "warning" | "info", title: string, message: string) => void;
  removeToast: (id: string) => void;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  toasts: [],
  unreadCount: 0,

  showToast: (type, title, message) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({ toasts: [...state.toasts, { id, type, title, message }] }));
    setTimeout(() => {
      get().removeToast(id);
    }, 4000);
  },

  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },

  fetchNotifications: async () => {
    try {
      const res = await axios.get("/api/notifications");
      if (res.data && Array.isArray(res.data)) {
        const unread = res.data.filter((n: NotificationDTO) => !n.isRead).length;
        set({ notifications: res.data, unreadCount: unread });
      }
    } catch {
      // ignore
    }
  },

  markAsRead: async (id) => {
    set((state) => {
      const updated = state.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n));
      return { notifications: updated, unreadCount: updated.filter((n) => !n.isRead).length };
    });
    try {
      await axios.patch(`/api/notifications/${id}`);
    } catch {
      // ignore
    }
  },

  markAllAsRead: async () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    }));
    try {
      await axios.post("/api/notifications/read-all");
    } catch {
      // ignore
    }
  },
}));
