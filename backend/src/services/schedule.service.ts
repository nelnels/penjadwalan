import { prisma } from "../lib/prisma.js";

const STATUS_ALIASES: Record<string, string> = {
  upcoming: "UPCOMING",
  ongoing: "IN_PROGRESS",
  selesai: "COMPLETED",
  completed: "COMPLETED",
  dibatalkan: "CANCELLED",
  cancelled: "CANCELLED",
  postponed: "POSTPONED",
};

const SORTABLE_FIELDS = new Set(["startDate", "title", "status"]);

export interface ScheduleListQuery {
  search?: unknown;
  category?: unknown;
  status?: unknown;
  startDate?: unknown;
  endDate?: unknown;
  sortBy?: unknown;
  sortOrder?: unknown;
  page?: unknown;
  limit?: unknown;
  all?: unknown;
}

function toValidDate(value: unknown, endOfDay = false): Date | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  if (endOfDay) date.setHours(23, 59, 59, 999);
  else date.setHours(0, 0, 0, 0);
  return date;
}

/** Builds an AND-based Prisma query, so filtering remains efficient for large datasets. */
export async function listSchedules(query: ScheduleListQuery) {
  const filters: any[] = [];
  const search = typeof query.search === "string" ? query.search.trim() : "";
  const category = typeof query.category === "string" ? query.category.trim() : "";
  const rawStatus = typeof query.status === "string" ? query.status.trim() : "";
  const startDate = toValidDate(query.startDate);
  const endDate = toValidDate(query.endDate, true);

  if (search) {
    filters.push({
      OR: [
        { title: { contains: search } },
        { description: { contains: search } },
      ],
    });
  }

  if (category && category !== "ALL") filters.push({ category });

  if (rawStatus && rawStatus !== "ALL") {
    const status = STATUS_ALIASES[rawStatus.toLowerCase()] || rawStatus.toUpperCase();
    filters.push({ status });
  }

  if (startDate) filters.push({ startDate: { gte: startDate } });
  if (endDate) filters.push({ endDate: { lte: endDate } });

  const where = filters.length ? { AND: filters } : {};
  const parsedPage = Number.parseInt(String(query.page || "1"), 10);
  const parsedLimit = Number.parseInt(String(query.limit || "10"), 10);
  const fetchAll = String(query.all).toLowerCase() === "true";
  const page = Number.isFinite(parsedPage) ? Math.max(1, parsedPage) : 1;
  const limit = Number.isFinite(parsedLimit) ? Math.min(20, Math.max(10, parsedLimit)) : 10;
  const sortByCandidate = String(query.sortBy || "startDate");
  const sortBy = SORTABLE_FIELDS.has(sortByCandidate) ? sortByCandidate : "startDate";
  const sortOrder = String(query.sortOrder).toLowerCase() === "desc" ? "desc" : "asc";

  const [schedules, total, categories] = await Promise.all([
    prisma.event.findMany({
      where,
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        assignees: { include: { user: { select: { id: true, name: true, avatar: true } } } },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: fetchAll ? undefined : (page - 1) * limit,
      take: fetchAll ? undefined : limit,
    }),
    prisma.event.count({ where }),
    prisma.category.findMany({ select: { code: true, color: true } }),
  ]);

  const categoryColors = new Map(categories.map((category) => [category.code, category.color]));

  return {
    data: schedules.map((schedule) => ({ ...schedule, color: categoryColors.get(schedule.category) || schedule.color })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}
