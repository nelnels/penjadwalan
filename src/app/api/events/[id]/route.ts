import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { detectEventConflicts } from "@/lib/conflict-detector";
import { getAuthUser } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            department: true,
            position: true,
            avatar: true,
            phone: true,
          },
        },
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                department: true,
                position: true,
                avatar: true,
                phone: true,
              },
            },
          },
        },
        tasks: {
          include: {
            subtasks: true,
            assignee: {
              select: { id: true, name: true, avatar: true },
            },
          },
          orderBy: { order: "asc" },
        },
        milestones: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Agenda tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json(event);
  } catch (error: any) {
    console.error("Error fetching single event:", error);
    return NextResponse.json(
      { error: "Gagal memuat detail agenda", details: error?.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
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

    const existing = await prisma.event.findUnique({
      where: { id },
      include: { assignees: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Agenda tidak ditemukan" }, { status: 404 });
    }

    const authUser = await getAuthUser(req);
    if (authUser && authUser.role !== "ADMIN") {
      const isOwner = existing.createdById === authUser.id;
      const isAssignee = existing.assignees.some((a) => a.userId === authUser.id);
      if (!isOwner && !isAssignee) {
        return NextResponse.json(
          { error: "Anda tidak memiliki izin untuk mengubah agenda ini." },
          { status: 403 }
        );
      }
    }

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

    // Handle assignees update if provided
    if (assigneeIds && Array.isArray(assigneeIds)) {
      await prisma.eventAssignee.deleteMany({ where: { eventId: id } });
      updateData.assignees = {
        create: assigneeIds.map((uId: string, idx: number) => ({
          userId: uId,
          roleInEvent: idx === 0 ? "PIC_UTAMA" : "ANGGOTA",
        })),
      };
    }

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: true,
        assignees: {
          include: { user: true },
        },
        milestones: true,
      },
    });

    // Check conflicts
    const allEvents = await prisma.event.findMany({
      where: { id: { not: id } },
      include: {
        assignees: {
          include: { user: true },
        },
      },
    });

    const currentAssigneeIds = updatedEvent.assignees.map((a) => a.userId);
    const conflicts = detectEventConflicts(
      {
        startDate: updatedEvent.startDate,
        endDate: updatedEvent.endDate,
        locationName: updatedEvent.locationName,
        locationType: updatedEvent.locationType as any,
        assigneeIds: currentAssigneeIds,
      },
      allEvents as any
    );

    // Audit Log
    await prisma.auditLog.create({
      data: {
        userId: authUser?.id || updatedById || updatedEvent.createdById,
        action: "UPDATE_EVENT",
        description: `Memperbarui agenda: "${updatedEvent.title}" (Status: ${updatedEvent.status}, Progress: ${updatedEvent.progress}%)`,
        targetEntity: "Event",
        targetId: updatedEvent.id,
      },
    });

    return NextResponse.json({
      event: updatedEvent,
      conflicts,
      message: "Agenda berhasil diperbarui",
    });
  } catch (error: any) {
    console.error("Error updating event:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui agenda", details: error?.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const existing = await prisma.event.findUnique({
      where: { id },
      include: { assignees: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Agenda tidak ditemukan" }, { status: 404 });
    }

    const authUser = await getAuthUser(req);
    if (authUser && authUser.role !== "ADMIN") {
      const isOwner = existing.createdById === authUser.id;
      if (!isOwner) {
        return NextResponse.json(
          { error: "Anda tidak memiliki wewenang untuk menghapus agenda ini. Hanya pembuat atau Admin yang diizinkan." },
          { status: 403 }
        );
      }
    }

    await prisma.event.delete({
      where: { id },
    });

    await prisma.auditLog.create({
      data: {
        userId: authUser?.id,
        action: "DELETE_EVENT",
        description: `Menghapus agenda: "${existing.title}"`,
        targetEntity: "Event",
        targetId: id,
      },
    });

    return NextResponse.json({ message: "Agenda berhasil dihapus" });
  } catch (error: any) {
    console.error("Error deleting event:", error);
    return NextResponse.json(
      { error: "Gagal menghapus agenda", details: error?.message },
      { status: 500 }
    );
  }
}
