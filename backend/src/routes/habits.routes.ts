import { Router, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { AuthRequest, authenticateToken } from "../middleware/auth.js";

const router = Router();

function normalizeDate(value: unknown) {
  const parsed = typeof value === "string" ? new Date(value) : new Date();
  if (Number.isNaN(parsed.getTime())) return null;
  return new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate()));
}

router.get("/", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const selectedDate = normalizeDate(req.query.date) ?? normalizeDate(new Date())!;
    const weekStart = new Date(selectedDate);
    weekStart.setUTCDate(weekStart.getUTCDate() - 6);
    const habits = await prisma.habit.findMany({
      where: { userId: req.user!.id, archived: false },
      include: { logs: { where: { date: { gte: weekStart, lte: selectedDate } }, orderBy: { date: "asc" } } },
      orderBy: { createdAt: "asc" },
    });
    return res.json({ habits, date: selectedDate });
  } catch (error) {
    console.error("Get habits error:", error);
    return res.status(500).json({ error: "Gagal memuat kebiasaan." });
  }
});

router.post("/", authenticateToken, async (req: AuthRequest, res: Response) => {
  const name = String(req.body?.name || "").trim();
  if (!name) return res.status(400).json({ error: "Nama kebiasaan wajib diisi." });
  try {
    const habit = await prisma.habit.create({
      data: { userId: req.user!.id, name: name.slice(0, 80), color: String(req.body?.color || "#2563EB"), targetPerWeek: Math.min(7, Math.max(1, Number(req.body?.targetPerWeek) || 7)) },
      include: { logs: true },
    });
    return res.status(201).json(habit);
  } catch {
    return res.status(500).json({ error: "Gagal menambahkan kebiasaan." });
  }
});

router.post("/:id/toggle", authenticateToken, async (req: AuthRequest, res: Response) => {
  const date = normalizeDate(req.body?.date);
  if (!date) return res.status(400).json({ error: "Tanggal tidak valid." });
  try {
    const habit = await prisma.habit.findFirst({ where: { id: req.params.id, userId: req.user!.id } });
    if (!habit) return res.status(404).json({ error: "Kebiasaan tidak ditemukan." });
    const existing = await prisma.habitLog.findUnique({ where: { habitId_date: { habitId: habit.id, date } } });
    if (existing) {
      await prisma.habitLog.delete({ where: { id: existing.id } });
      return res.json({ completed: false });
    }
    await prisma.habitLog.create({ data: { habitId: habit.id, date } });
    return res.json({ completed: true });
  } catch {
    return res.status(500).json({ error: "Gagal memperbarui kebiasaan." });
  }
});

router.delete("/:id", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const result = await prisma.habit.updateMany({ where: { id: req.params.id, userId: req.user!.id }, data: { archived: true } });
    if (result.count === 0) return res.status(404).json({ error: "Kebiasaan tidak ditemukan." });
    return res.json({ message: "Kebiasaan diarsipkan." });
  } catch {
    return res.status(500).json({ error: "Gagal mengarsipkan kebiasaan." });
  }
});

export default router;
