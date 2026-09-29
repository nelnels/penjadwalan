import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { detectEventConflicts } from "../lib/conflict-detector.js";
import { AuthRequest, optionalAuth } from "../middleware/auth.js";

const router = Router();

// GET /api/events
router.get("/", async (req: Request, res: Response) => {
  try {
    const { category, status, priority, department, search, picId, startDate, endDate } = req.query;

    const where: any = {};

    if (category && category !== "ALL") where.category = String(category);
    if (status && status !== "ALL") where.status = String(status);
    if (priority && priority !== "ALL") where.priority = String(priority);
    if (department && department !== "Semua Divisi" && department !== "ALL") where.department = String(department);

    if (search) {
      const q = String(search);
      where.OR = [
        { title: { contains: q } },
        { description: { contains: q } },
        { locationName: { contains: q } },
      ];
    }

    if (picId && picId !== "ALL") {
      where.assignees = {
        some: { userId: String(picId) },
      };
    }

    if (startDate && endDate) {
      where.OR = [
        {
          startDate: {
            gte: new Date(String(startDate)),
            lte: new Date(String(endDate)),
          },
        },
        {
          endDate: {
            gte: new Date(String(startDate)),
            lte: new Date(String(endDate)),
          },
        },
      ];
    }

    const events = await prisma.event.findMany({
      where,
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, role: true, department: true, position: true, avatar: true },
        },
        assignees: {
          include: {
            user: {
              select: { id: true, name: true, email: true, role: true, department: true, position: true, avatar: true },
            },
          },
        },
        tasks: {
          include: {
            subtasks: true,
            assignee: { select: { id: true, name: true, avatar: true } },
          },
        },
        milestones: { orderBy: { order: "asc" } },
      },
      orderBy: { startDate: "asc" },
    });

    return res.json(events);
  } catch (error: any) {
    console.error("Error fetching events:", error);
    return res.status(500).json({ error: "Gagal memuat agenda", details: error?.message });
  }
});

// GET /api/events/:id
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        createdBy: true,
        assignees: { include: { user: true } },
        tasks: {
          include: { subtasks: true, assignee: true },
          orderBy: { order: "asc" },
        },
        milestones: { orderBy: { order: "asc" } },
      },
    });

    if (!event) {
      return res.status(404).json({ error: "Agenda tidak ditemukan" });
    }

    return res.json(event);
  } catch (error: any) {
    return res.status(500).json({ error: "Gagal memuat detail agenda" });
  }
});

// POST /api/events
router.post("/", optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const {
      title,
      description,
      category,
      priority,
      status,
      startDate,
      endDate,
      isAllDay,
      isRecurring,
      recurrenceRule,
      locationType,
      locationName,
      locationUrl,
      department,
      budget,
      color,
      createdById,
      assigneeIds,
      milestones,
    } = req.body;

    if (!title || !startDate || !endDate) {
      return res.status(400).json({ error: "Judul, waktu mulai, dan waktu selesai wajib diisi" });
    }

    const existingEvents = await prisma.event.findMany({
      include: { assignees: { include: { user: true } } },
    });

    const userIdsToCheck = assigneeIds ? assigneeIds.map((a: any) => (typeof a === "string" ? a : a.userId)) : [];
    const conflicts = detectEventConflicts(
      {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        locationName,
        locationType,
        assigneeIds: userIdsToCheck,
      },
      existingEvents as any
    );

    let creatorId = createdById || req.user?.id;
    if (!creatorId) {
      const firstUser = await prisma.user.findFirst();
      creatorId = firstUser?.id;
    }

    const newEvent = await prisma.event.create({
      data: {
        title,
        description,
        category: category || "INTERNAL_TEAM",
        priority: priority || "MEDIUM",
        status: status || "UPCOMING",
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isAllDay: !!isAllDay,
        isRecurring: !!isRecurring,
        recurrenceRule: recurrenceRule || null,
        locationType: locationType || "OFFLINE",
        locationName: locationName || "Ruang Rapat Utama",
        locationUrl: locationUrl || null,
        department: department || "Semua Divisi",
        budget: budget ? parseFloat(budget) : 0,
        progress: 0,
        color: color || "#3B82F6",
        createdById: creatorId,
        assignees: {
          create: userIdsToCheck.map((uId: string, idx: number) => ({
            userId: uId,
            roleInEvent: idx === 0 ? "PIC_UTAMA" : "ANGGOTA",
          })),
        },
        milestones: milestones && milestones.length > 0 ? {
          create: milestones.map((m: any, idx: number) => ({
            title: m.title,
            targetDate: new Date(m.targetDate || startDate),
            order: idx + 1,
            isCompleted: false,
          })),
        } : undefined,
      },
      include: {
        createdBy: true,
        assignees: { include: { user: true } },
        milestones: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: creatorId,
        action: "CREATE_EVENT",
        description: `Menjadwalkan agenda baru: "${title}" pada ${locationName}`,
        targetEntity: "Event",
        targetId: newEvent.id,
      },
    });

    return res.status(201).json({
      event: newEvent,
      conflicts,
      message: conflicts.length > 0 ? "Agenda dibuat dengan catatan bentrok" : "Agenda berhasil dibuat",
    });
  } catch (error: any) {
    console.error("Error creating event:", error);
    return res.status(500).json({ error: "Gagal membuat agenda", details: error?.message });
  }
});

// PATCH /api/events/:id
router.patch("/:id", optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const {
      title,
      description,
      category,
      priority,
      status,
      startDate,
      endDate,
      isAllDay,
      isRecurring,
      recurrenceRule,
      locationType,
      locationName,
      locationUrl,
      department,
      budget,
      progress,
      color,
      assigneeIds,
      updatedById,
    } = body;

    const existing = await prisma.event.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Agenda tidak ditemukan" });

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (priority !== undefined) updateData.priority = priority;
    if (status !== undefined) updateData.status = status;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = new Date(endDate);
    if (isAllDay !== undefined) updateData.isAllDay = !!isAllDay;
    if (isRecurring !== undefined) updateData.isRecurring = !!isRecurring;
    if (recurrenceRule !== undefined) updateData.recurrenceRule = recurrenceRule;
    if (locationType !== undefined) updateData.locationType = locationType;
    if (locationName !== undefined) updateData.locationName = locationName;
    if (locationUrl !== undefined) updateData.locationUrl = locationUrl;
    if (department !== undefined) updateData.department = department;
    if (budget !== undefined) updateData.budget = parseFloat(budget);
    if (progress !== undefined) updateData.progress = parseInt(progress, 10);
    if (color !== undefined) updateData.color = color;

    if (assigneeIds && Array.isArray(assigneeIds)) {
      const userIds = assigneeIds.map((a: any) => (typeof a === "string" ? a : a.userId));
      await prisma.eventAssignee.deleteMany({ where: { eventId: id } });
      if (userIds.length > 0) {
        await prisma.eventAssignee.createMany({
          data: userIds.map((uId: string, idx: number) => ({
            eventId: id,
            userId: uId,
            roleInEvent: idx === 0 ? "PIC_UTAMA" : "ANGGOTA",
          })),
        });
      }
    }

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: true,
        assignees: { include: { user: true } },
        milestones: true,
        tasks: { include: { subtasks: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: updatedById || req.user?.id || updatedEvent.createdById,
        action: "UPDATE_EVENT",
        description: `Memperbarui agenda: "${updatedEvent.title}" (Status: ${updatedEvent.status}, Progress: ${updatedEvent.progress}%)`,
        targetEntity: "Event",
        targetId: updatedEvent.id,
      },
    });

    return res.json({ event: updatedEvent, message: "Agenda berhasil diperbarui" });
  } catch (error: any) {
    console.error("Error updating event:", error);
    return res.status(500).json({ error: "Gagal memperbarui agenda" });
  }
});

// DELETE /api/events/:id
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await prisma.event.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Agenda tidak ditemukan" });

    await prisma.event.delete({ where: { id } });
    await prisma.auditLog.create({
      data: {
        action: "DELETE_EVENT",
        description: `Menghapus agenda: "${existing.title}"`,
        targetEntity: "Event",
        targetId: id,
      },
    });

    return res.json({ message: "Agenda berhasil dihapus" });
  } catch (error: any) {
    return res.status(500).json({ error: "Gagal menghapus agenda" });
  }
});

export default router;
