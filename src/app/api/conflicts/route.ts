import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { detectEventConflicts, findNextAvailableSlot } from "@/lib/conflict-detector";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const events = await prisma.event.findMany({
      where: {
        status: { not: "CANCELLED" },
      },
      include: {
        assignees: { include: { user: true } },
      },
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
          assigneeIds: e.assignees.map((a) => a.userId),
        },
        events.slice(i + 1) as any
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

    return NextResponse.json(conflictsSummary);
  } catch (error: any) {
    console.error("Error checking all conflicts:", error);
    return NextResponse.json(
      { error: "Gagal mendeteksi bentrok jadwal", details: error?.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, startDate, endDate, locationName, locationType, assigneeIds, action } = body;

    const allEvents = await prisma.event.findMany({
      include: {
        assignees: { include: { user: true } },
      },
    });

    if (action === "FIND_SLOT") {
      const durationMinutes = body.durationMinutes || 60;
      const baseDate = startDate ? new Date(startDate) : new Date();
      const picId = assigneeIds && assigneeIds.length > 0 ? (typeof assigneeIds[0] === "string" ? assigneeIds[0] : assigneeIds[0].userId) : undefined;
      const slot = findNextAvailableSlot(baseDate, durationMinutes, allEvents as any, picId, locationName);

      return NextResponse.json({
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
      allEvents as any
    );

    return NextResponse.json({
      hasConflicts: conflicts.length > 0,
      conflicts,
    });
  } catch (error: any) {
    console.error("Error checking conflict payload:", error);
    return NextResponse.json(
      { error: "Gagal memproses validasi bentrok", details: error?.message },
      { status: 500 }
    );
  }
}
