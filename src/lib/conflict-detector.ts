import { EventDTO, ScheduleConflict } from "./types";
import { areIntervalsOverlapping, parseISO, addHours, addMinutes, format } from "date-fns";

function toDateSafe(input: string | Date | number): Date {
  if (input instanceof Date) return input;
  if (typeof input === "string") {
    try {
      return parseISO(input);
    } catch {
      return new Date(input);
    }
  }
  return new Date(input);
}

export function detectEventConflicts(
  targetEvent: {
    id?: string;
    startDate: string | Date;
    endDate: string | Date;
    locationName?: string;
    locationType?: string;
    assigneeIds?: string[];
  },
  existingEvents: EventDTO[]
): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = [];

  const targetStart = toDateSafe(targetEvent.startDate);
  const targetEnd = toDateSafe(targetEvent.endDate);

  if (targetEnd <= targetStart || isNaN(targetStart.getTime()) || isNaN(targetEnd.getTime())) {
    return conflicts;
  }

  for (const event of existingEvents) {
    // Skip comparing with itself if editing
    if (targetEvent.id && event.id === targetEvent.id) {
      continue;
    }

    // Skip cancelled events
    if (event.status === "CANCELLED") {
      continue;
    }

    const eventStart = toDateSafe(event.startDate);
    const eventEnd = toDateSafe(event.endDate);

    if (isNaN(eventStart.getTime()) || isNaN(eventEnd.getTime())) continue;

    const isOverlapping = areIntervalsOverlapping(
      { start: targetStart, end: targetEnd },
      { start: eventStart, end: eventEnd },
      { inclusive: false }
    );

    if (!isOverlapping) continue;

    const timeRangeStr = `${format(eventStart, "dd/MM HH:mm")} - ${format(eventEnd, "HH:mm")}`;

    // Check Room / Location Overlap (for offline and hybrid rooms)
    if (
      targetEvent.locationName &&
      event.locationName &&
      targetEvent.locationName.trim().toLowerCase() === event.locationName.trim().toLowerCase() &&
      targetEvent.locationType !== "ONLINE" &&
      event.locationType !== "ONLINE"
    ) {
      conflicts.push({
        type: "ROOM_OVERLAP",
        severity: "CRITICAL",
        conflictingEventId: event.id,
        conflictingEventTitle: event.title,
        conflictingEntityName: event.locationName,
        timeRange: timeRangeStr,
        description: `Ruangan "${event.locationName}" sudah dibooking untuk event "${event.title}" (${timeRangeStr})`,
      });
    }

    // Check PIC Overlap
    if (targetEvent.assigneeIds && targetEvent.assigneeIds.length > 0 && event.assignees) {
      for (const targetPicId of targetEvent.assigneeIds) {
        const matchedAssignee = event.assignees.find((a) => a.userId === targetPicId || a.user?.id === targetPicId);
        if (matchedAssignee) {
          conflicts.push({
            type: "PIC_OVERLAP",
            severity: "WARNING",
            conflictingEventId: event.id,
            conflictingEventTitle: event.title,
            conflictingEntityName: matchedAssignee.user?.name || "PIC",
            timeRange: timeRangeStr,
            description: `PIC ${matchedAssignee.user?.name || "anggota"} sudah memiliki jadwal di event "${event.title}" (${timeRangeStr})`,
          });
        }
      }
    }
  }

  return conflicts;
}

export function findNextAvailableSlot(
  baseDate: Date,
  durationMinutes: number = 60,
  existingEvents: EventDTO[],
  picId?: string,
  roomName?: string
): { startDate: Date; endDate: Date } {
  let candidateStart = new Date(baseDate);
  // Round to nearest 30 min
  candidateStart.setMinutes(candidateStart.getMinutes() >= 30 ? 60 : 30, 0, 0);

  // Check up to 14 days ahead
  for (let attempt = 0; attempt < 48; attempt++) {
    const candidateEnd = addMinutes(candidateStart, durationMinutes);

    // Filter out late nights (keep between 08:00 and 19:00)
    const hour = candidateStart.getHours();
    if (hour < 8 || hour >= 19) {
      candidateStart = addHours(candidateStart, hour < 8 ? 8 - hour : 24 - hour + 8);
      continue;
    }

    const conflicts = detectEventConflicts(
      {
        startDate: candidateStart,
        endDate: candidateEnd,
        locationName: roomName,
        locationType: "OFFLINE",
        assigneeIds: picId ? [picId] : [],
      },
      existingEvents
    );

    if (conflicts.length === 0) {
      return { startDate: candidateStart, endDate: candidateEnd };
    }

    candidateStart = addMinutes(candidateStart, 30);
  }

  // fallback
  const fallbackStart = addHours(new Date(), 24);
  return { startDate: fallbackStart, endDate: addMinutes(fallbackStart, durationMinutes) };
}
