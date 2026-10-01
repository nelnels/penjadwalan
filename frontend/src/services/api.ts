import axios from "axios";
import { EventDTO, TaskDTO, DashboardStats, ScheduleConflict, UserDTO, AuditLogDTO, HealthSummaryDTO, HabitDTO } from "../lib/types";

export interface PaginatedSchedules {
  data: EventDTO[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export const apiClient = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT token automatically
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("jadwalku_jwt_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// API Services
export const EventsService = {
  getAll: async (params?: Record<string, any>) => {
    const res = await apiClient.get<EventDTO[]>("/events", { params });
    return res.data;
  },
  getById: async (id: string) => {
    const res = await apiClient.get<EventDTO>(`/events/${id}`);
    return res.data;
  },
  create: async (data: any) => {
    const res = await apiClient.post<{ event: EventDTO; conflicts: ScheduleConflict[]; message: string }>("/events", data);
    return res.data;
  },
  update: async (id: string, data: any) => {
    const res = await apiClient.patch<{ event: EventDTO; message: string }>(`/events/${id}`, data);
    return res.data;
  },
  delete: async (id: string) => {
    const res = await apiClient.delete<{ message: string }>(`/events/${id}`);
    return res.data;
  },
};

export const SchedulesService = {
  getAll: async (params: object) => {
    const res = await apiClient.get<PaginatedSchedules>("/schedules", { params });
    return res.data;
  },
};

export const GoogleCalendarService = {
  status: async () => (await apiClient.get<{ configured: boolean; connected: boolean; accountEmail: string | null }>("/google-calendar/status")).data,
  getEvents: async (params: { startDate: string; endDate: string }) => (await apiClient.get<any[]>("/google-calendar/events", { params })).data,
  connect: () => { window.location.href = "/api/google-calendar/connect"; },
};

export const HealthService = {
  getSummary: async (params?: { from?: string; to?: string }) => (await apiClient.get<HealthSummaryDTO>("/health/summary", { params })).data,
};

export const HabitsService = {
  getAll: async (date?: string) => (await apiClient.get<{ habits: HabitDTO[] }>("/habits", { params: { date } })).data,
  create: async (data: { name: string; color: string; targetPerWeek: number }) => (await apiClient.post<HabitDTO>("/habits", data)).data,
  toggle: async (id: string, date: string) => (await apiClient.post<{ completed: boolean }>(`/habits/${id}/toggle`, { date })).data,
  archive: async (id: string) => (await apiClient.delete(`/habits/${id}`)).data,
};

export const TasksService = {
  getAll: async (params?: Record<string, any>) => {
    const res = await apiClient.get<TaskDTO[]>("/tasks", { params });
    return res.data;
  },
  create: async (data: any) => {
    const res = await apiClient.post<TaskDTO>("/tasks", data);
    return res.data;
  },
  update: async (id: string, data: any) => {
    const res = await apiClient.patch<TaskDTO>(`/tasks/${id}`, data);
    return res.data;
  },
  delete: async (id: string) => {
    const res = await apiClient.delete<{ message: string }>(`/tasks/${id}`);
    return res.data;
  },
  addSubtask: async (taskId: string, title: string) => {
    const res = await apiClient.post(`/tasks/${taskId}/subtasks`, { title });
    return res.data;
  },
  toggleSubtask: async (taskId: string, subtaskId: string, isCompleted: boolean) => {
    const res = await apiClient.patch(`/tasks/${taskId}/subtasks`, { subtaskId, isCompleted });
    return res.data;
  },
};

export const StatsService = {
  getStats: async () => {
    const res = await apiClient.get<DashboardStats>("/stats");
    return res.data;
  },
};

export const ConflictsService = {
  getAll: async () => {
    const res = await apiClient.get<any[]>("/conflicts");
    return res.data;
  },
  checkConflict: async (payload: any) => {
    const res = await apiClient.post("/conflicts", payload);
    return res.data;
  },
  findSlot: async (payload: any) => {
    const res = await apiClient.post("/conflicts", { ...payload, action: "FIND_SLOT" });
    return res.data;
  },
};

export const UsersService = {
  getAll: async () => {
    const res = await apiClient.get<UserDTO[]>("/users");
    return res.data;
  },
};

export const AuditService = {
  getLogs: async (limit: number = 50) => {
    const res = await apiClient.get<AuditLogDTO[]>("/audit-logs", { params: { limit } });
    return res.data;
  },
};
