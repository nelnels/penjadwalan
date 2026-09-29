import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { detectEventConflicts, findNextAvailableSlot } from "../lib/conflict-detector.js";

const router = Router();

// GET /api/conflicts
router.get("/", async (req: Request, res: Response) => {
  try {
    const events = await prisma.event.findMany({
      where: { status: { not: "CANCELLED" } },
      include: { assignees: { include: { user: true } } },
      orderBy: { startDate: "asc" },
    });

    const conflictsSummary: any[] = [];

    for (let i = 0; i < events.length; i++) {
      const e = events[i];
      const detected = detectEventConflicts(
        {
          id: e.id,
          startDate: e.startDate,
          endDate: e.endDate,
          locationName: e.locationName,
          locationType: e.locationType,
          assigneeIds: e.assignees.map((a: any) => a.userId),
        },
        events.slice(i + 1)
      );

      detected.forEach((conflict) => {
        conflictsSummary.push({
          id: `${e.id}-${conflict.conflictingEventId}`,
          eventA: {
            id: e.id,
            title: e.title,
            startDate: e.startDate,
            endDate: e.endDate,
            locationName: e.locationName,
            color: e.color,
          },
          eventB: {
            id: conflict.conflictingEventId,
            title: conflict.conflictingEventTitle,
          },
          type: conflict.type,
          severity: conflict.severity,
          entityName: conflict.conflictingEntityName,
          timeRange: conflict.timeRange,
          description: conflict.description,
        });
      });
    }

    return res.json(conflictsSummary);
  } catch (error: any) {
    return res.status(500).json({ error: "Gagal mendeteksi bentrok jadwal", details: error?.message });
  }
});

// POST /api/conflicts
router.post("/", async (req: Request, res: Response) => {
  try {
    const { id, startDate, endDate, locationName, locationType, assigneeIds, action, durationMinutes } = req.body;

    const allEvents = await prisma.event.findMany({
      include: { assignees: { include: { user: true } } },
    });

    if (action === "FIND_SLOT") {
      const duration = durationMinutes || 60;
      const baseDate = startDate ? new Date(startDate) : new Date();
      const picId = assigneeIds && assigneeIds.length > 0 ? (typeof assigneeIds[0] === "string" ? assigneeIds[0] : assigneeIds[0].userId) : undefined;
      const slot = findNextAvailableSlot(baseDate, duration, allEvents, picId, locationName);

      return res.json({
        recommendedSlot: slot,
        formattedStart: slot.startDate.toISOString(),
        formattedEnd: slot.endDate.toISOString(),
      });
    }

    const conflicts = detectEventConflicts(
      {
        id,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        locationName,
        locationType,
        assigneeIds: assigneeIds ? assigneeIds.map((a: any) => (typeof a === "string" ? a : a.userId)) : [],
      },
      allEvents
    );

    return res.json({
      hasConflicts: conflicts.length > 0,
      conflicts,
    });
  } catch (error: any) {
    return res.status(500).json({ error: "Gagal memproses validasi bentrok", details: error?.message });
  }
});

export default router;
