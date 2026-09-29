export type UserRole = "ADMIN" | "MANAGER" | "MEMBER";

export type EventCategory =
  | "SEMINAR_WORKSHOP"
  | "RAPAT_KOORDINASI"
  | "DEADLINE_PROYEK"
  | "KEGIATAN_SOSIAL"
  | "KOMPETISI_LOMBA"
  | "INTERNAL_TEAM";

export type EventPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type EventStatus =
  | "UPCOMING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "POSTPONED"
  | "CANCELLED";

export type LocationType = "OFFLINE" | "ONLINE" | "HYBRID";

export type TaskStatus = "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";

export interface UserDTO {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  position: string;
  avatar?: string | null;
  phone?: string | null;
}

export interface EventAssigneeDTO {
  id: string;
  eventId: string;
  userId: string;
  roleInEvent: string;
  user: UserDTO;
}

export interface TaskSubitemDTO {
  id: string;
  taskId: string;
  title: string;
  isCompleted: boolean;
}

export interface TaskDTO {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: EventPriority;
  dueDate?: string | null;
  estimatedHours?: number | null;
  eventId?: string | null;
  assigneeId?: string | null;
  order: number;
  event?: {
    id: string;
    title: string;
    category: EventCategory;
    color: string;
  } | null;
  assignee?: UserDTO | null;
  subtasks: TaskSubitemDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface MilestoneDTO {
  id: string;
  eventId: string;
  title: string;
  targetDate: string;
  isCompleted: boolean;
  order: number;
}

export interface EventDTO {
  id: string;
  title: string;
  description?: string | null;
  category: EventCategory;
  priority: EventPriority;
  status: EventStatus;
  startDate: string;
  endDate: string;
  isAllDay: boolean;
  isRecurring: boolean;
  recurrenceRule?: string | null;
  locationType: LocationType;
  locationName: string;
  locationUrl?: string | null;
  department: string;
  budget?: number | null;
  progress: number;
  color: string;
  createdById: string;
  createdBy?: UserDTO;
  assignees: EventAssigneeDTO[];
  tasks?: TaskDTO[];
  milestones?: MilestoneDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleConflict {
  type: "PIC_OVERLAP" | "ROOM_OVERLAP";
  severity: "CRITICAL" | "WARNING";
  description: string;
  conflictingEventId: string;
  conflictingEventTitle: string;
  conflictingEntityName: string;
  timeRange: string;
}

export interface NotificationDTO {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "INFO" | "WARNING" | "SUCCESS" | "URGENT";
  isRead: boolean;
  link?: string | null;
  createdAt: string;
}

export interface AuditLogDTO {
  id: string;
  userId?: string | null;
  user?: UserDTO | null;
  action: string;
  description: string;
  targetEntity?: string | null;
  targetId?: string | null;
  createdAt: string;
}

export interface DashboardStats {
  totalEvents: number;
  upcomingEvents: number;
  inProgressEvents: number;
  completedEvents: number;
  totalTasks: number;
  completedTasks: number;
  taskCompletionRate: number;
  totalBudget: number;
  activePICCount: number;
  conflictsCount: number;
  categoryBreakdown: { name: string; category: string; count: number; color: string }[];
  monthlyVolume: { month: string; total: number; completed: number }[];
  picWorkload: { id: string; name: string; fullName: string; department: string; avatar?: string | null; eventsCount: number; tasksCount: number }[];
  priorityBreakdown: { priority: string; key?: string; count: number; color?: string }[];
}
