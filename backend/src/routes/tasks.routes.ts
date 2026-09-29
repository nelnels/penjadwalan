import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { AuthRequest, optionalAuth } from "../middleware/auth.js";

const router = Router();

// GET /api/tasks
router.get("/", async (req: Request, res: Response) => {
  try {
    const { eventId, status, priority, assigneeId } = req.query;
    const where: any = {};
    if (eventId && eventId !== "ALL") where.eventId = String(eventId);
    if (status && status !== "ALL") where.status = String(status);
    if (priority && priority !== "ALL") where.priority = String(priority);
    if (assigneeId && assigneeId !== "ALL") where.assigneeId = String(assigneeId);

    const tasks = await prisma.task.findMany({
      where,
      include: {
        event: { select: { id: true, title: true, category: true, color: true } },
        assignee: { select: { id: true, name: true, email: true, avatar: true, position: true } },
        subtasks: true,
      },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });

    return res.json(tasks);
  } catch (error: any) {
    return res.status(500).json({ error: "Gagal memuat task", details: error?.message });
  }
});

// POST /api/tasks
router.post("/", optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, status, priority, dueDate, estimatedHours, eventId, assigneeId, subtasks } = req.body;

    if (!title) return res.status(400).json({ error: "Judul task wajib diisi" });

    const newTask = await prisma.task.create({
      data: {
        title,
        description,
        status: status || "TODO",
        priority: priority || "MEDIUM",
        dueDate: dueDate ? new Date(dueDate) : null,
        estimatedHours: estimatedHours ? parseFloat(estimatedHours) : null,
        eventId: eventId || null,
        assigneeId: assigneeId || null,
        subtasks: subtasks && subtasks.length > 0 ? {
          create: subtasks.map((st: any) => ({
            title: typeof st === "string" ? st : st.title,
            isCompleted: false,
          })),
        } : undefined,
      },
      include: {
        event: true,
        assignee: true,
        subtasks: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: assigneeId || req.user?.id,
        action: "CREATE_TASK",
        description: `Menambahkan task baru: "${title}" (Status: ${newTask.status})`,
        targetEntity: "Task",
        targetId: newTask.id,
      },
    });

    return res.status(201).json(newTask);
  } catch (error: any) {
    return res.status(500).json({ error: "Gagal membuat task" });
  }
});

// PATCH /api/tasks/:id
router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, dueDate, estimatedHours, assigneeId, eventId, order } = req.body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (estimatedHours !== undefined) updateData.estimatedHours = estimatedHours ? parseFloat(estimatedHours) : null;
    if (assigneeId !== undefined) updateData.assigneeId = assigneeId || null;
    if (eventId !== undefined) updateData.eventId = eventId || null;
    if (order !== undefined) updateData.order = order;

    const updatedTask = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        event: { select: { id: true, title: true, color: true } },
        assignee: true,
        subtasks: true,
      },
    });

    if (status === "DONE" && updatedTask.eventId) {
      const allTasks = await prisma.task.findMany({ where: { eventId: updatedTask.eventId } });
      if (allTasks.length > 0) {
        const doneCount = allTasks.filter((t) => t.status === "DONE").length;
        const progress = Math.round((doneCount / allTasks.length) * 100);
        await prisma.event.update({ where: { id: updatedTask.eventId }, data: { progress } });
      }
    }

    return res.json(updatedTask);
  } catch (error: any) {
    return res.status(500).json({ error: "Gagal memperbarui task" });
  }
});

// DELETE /api/tasks/:id
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.task.delete({ where: { id } });
    return res.json({ message: "Task berhasil dihapus" });
  } catch (error: any) {
    return res.status(500).json({ error: "Gagal menghapus task" });
  }
});

// POST /api/tasks/:id/subtasks
router.post("/:id/subtasks", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title } = req.body;
    if (!title) return res.status(400).json({ error: "Judul subtask wajib diisi" });

    const subtask = await prisma.taskSubitem.create({
      data: { taskId: id, title, isCompleted: false },
    });
    return res.status(201).json(subtask);
  } catch (error: any) {
    return res.status(500).json({ error: "Gagal membuat subtask" });
  }
});

// PATCH /api/tasks/:id/subtasks
router.patch("/:id/subtasks", async (req: Request, res: Response) => {
  try {
    const { subtaskId, isCompleted } = req.body;
    const updated = await prisma.taskSubitem.update({
      where: { id: subtaskId },
      data: { isCompleted },
    });
    return res.json(updated);
  } catch (error: any) {
    return res.status(500).json({ error: "Gagal memperbarui subtask" });
  }
});

export default router;
