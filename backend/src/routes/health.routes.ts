import { Router, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { AuthRequest, authenticateToken } from "../middleware/auth.js";

const router = Router();

function asDate(value: unknown, fallback: Date) {
  if (typeof value !== "string") return fallback;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

function startOfDay(value: Date) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

function numberOrZero(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

router.get("/summary", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const end = startOfDay(asDate(req.query.to, new Date()));
    const defaultStart = new Date(end);
    defaultStart.setUTCDate(defaultStart.getUTCDate() - 6);
    const start = startOfDay(asDate(req.query.from, defaultStart));

    if (start > end) {
      return res.status(400).json({ error: "Rentang tanggal tidak valid." });
    }

    const daily = await prisma.healthDailySummary.findMany({
      where: { userId: req.user!.id, date: { gte: start, lte: end } },
      orderBy: { date: "asc" },
    });
    const latest = daily.at(-1) ?? null;
    const totals = daily.reduce(
      (result, item) => ({
        steps: result.steps + item.steps,
        activeEnergyKcal: result.activeEnergyKcal + item.activeEnergyKcal,
        exerciseMinutes: result.exerciseMinutes + item.exerciseMinutes,
        distanceMeters: result.distanceMeters + item.distanceMeters,
      }),
      { steps: 0, activeEnergyKcal: 0, exerciseMinutes: 0, distanceMeters: 0 },
    );

    return res.json({ daily, latest, totals, connected: daily.length > 0 });
  } catch (error) {
    console.error("Health summary error:", error);
    return res.status(500).json({ error: "Gagal memuat ringkasan kesehatan." });
  }
});

router.post("/sync", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const summaries = Array.isArray(req.body?.dailySummaries) ? req.body.dailySummaries : [];
    if (summaries.length === 0 || summaries.length > 31) {
      return res.status(400).json({ error: "Kirim 1 sampai 31 ringkasan harian untuk disinkronkan." });
    }

    const operations = summaries.map((item: Record<string, unknown>) => {
      const date = startOfDay(asDate(item.date, new Date("invalid")));
      if (Number.isNaN(date.getTime())) throw new Error("Tanggal data kesehatan tidak valid.");
      const data = {
        steps: Math.round(numberOrZero(item.steps)),
        activeEnergyKcal: numberOrZero(item.activeEnergyKcal),
        exerciseMinutes: Math.round(numberOrZero(item.exerciseMinutes)),
        standHours: Math.round(numberOrZero(item.standHours)),
        distanceMeters: numberOrZero(item.distanceMeters),
        restingHeartRate: item.restingHeartRate == null ? null : Math.round(numberOrZero(item.restingHeartRate)),
        walkingHeartRate: item.walkingHeartRate == null ? null : Math.round(numberOrZero(item.walkingHeartRate)),
        sleepHours: item.sleepHours == null ? null : numberOrZero(item.sleepHours),
        source: "APPLE_HEALTH",
      };
      return prisma.healthDailySummary.upsert({
        where: { userId_date: { userId: req.user!.id, date } },
        create: { userId: req.user!.id, date, ...data },
        update: data,
      });
    });

    await prisma.$transaction(operations);
    return res.status(200).json({ message: "Data Apple Health berhasil disinkronkan.", syncedDays: summaries.length });
  } catch (error: any) {
    const message = error?.message || "Gagal menyinkronkan data Apple Health.";
    return res.status(400).json({ error: message });
  }
});

export default router;
