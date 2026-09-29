import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { detectEventConflicts } from "@/lib/conflict-detector";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const department = searchParams.get("department");
    const search = searchParams.get("search");
    const picId = searchParams.get("picId");
    const userId = searchParams.get("userId") || searchParams.get("ownerId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const sortBy = searchParams.get("sortBy") || "startDate";
    const sortOrder = searchParams.get("sortOrder") === "desc" ? "desc" : "asc";
    const page = searchParams.get("page");
    const limit = searchParams.get("limit");
    const paginate = searchParams.get("paginate") === "true";

    const where: any = {};

    if (category && category !== "ALL") {
      where.category = category;
    }
    if (status && status !== "ALL") {
      where.status = status;
    }
    if (priority && priority !== "ALL") {
      where.priority = priority;
    }
    if (department && department !== "Semua Divisi" && department !== "ALL") {
      where.department = department;
    }

    if (userId && userId !== "ALL") {
      where.OR = [
        { createdById: userId },
        { assignees: { some: { userId } } },
      ];
    }

    if (picId && picId !== "ALL") {
      where.assignees = {
        some: {
          userId: picId,
        },
      };
    }

    if (search && search.trim()) {
      const q = search.trim();
      const searchConditions = [
        { title: { contains: q } },
        { description: { contains: q } },
        { locationName: { contains: q } },
        { assignees: { some: { user: { name: { contains: q } } } } },
      ];

      if (where.OR) {
        where.AND = [
          { OR: where.OR },
          { OR: searchConditions },
        ];
        delete where.OR;
      } else {
        where.OR = searchConditions;
      }
    }

    if (startDate && endDate) {
      const dateRangeConditions = [
        {
          startDate: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        },
        {
          endDate: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        },
      ];

      if (where.AND) {
        where.AND.push({ OR: dateRangeConditions });
      } else if (where.OR) {
        where.AND = [
          { OR: where.OR },
          { OR: dateRangeConditions },
        ];
        delete where.OR;
      } else {
        where.OR = dateRangeConditions;
      }
    }

    const orderBy: any = {};
    if (["startDate", "endDate", "title", "status", "category", "createdAt"].includes(sortBy)) {
      orderBy[sortBy] = sortOrder;
    } else {
      orderBy.startDate = "asc";
    }

    const pageNum = Math.max(1, parseInt(page || "1", 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit || "10", 10)));
    const skip = (pageNum - 1) * limitNum;

    const includeConfig = {
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          department: true,
          position: true,
          avatar: true,
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
      },
      milestones: {
        orderBy: { order: "asc" as const },
      },
    };

    if (!paginate) {
      const events = await prisma.event.findMany({
        where,
        include: includeConfig,
        orderBy,
      });
      return NextResponse.json(events);
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        include: includeConfig,
        orderBy,
        take: limitNum,
        skip,
      }),
      prisma.event.count({ where }),
    ]);

    return NextResponse.json({
      events,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1,
    });
  } catch (error: any) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: "Gagal memuat daftar agenda", details: error?.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
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
      color,
      createdById,
      assigneeIds, // array of { userId: string, roleInEvent?: string }
      milestones,  // array of { title: string, targetDate: string }
    } = body;

    if (!title || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Judul, waktu mulai, dan waktu selesai wajib diisi" },
        { status: 400 }
      );
    }

    // Check conflicts before creation
    const existingEvents = await prisma.event.findMany({
      include: {
        assignees: {
          include: { user: true },
        },
      },
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

    // Fallback user if not specified
    let creatorId = createdById;
    if (!creatorId) {
      const firstUser = await prisma.user.findFirst();
      creatorId = firstUser?.id;
    }

    // Create the event in database
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
        assignees: {
          include: { user: true },
        },
        milestones: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: creatorId,
        action: "CREATE_EVENT",
        description: `Menjadwalkan agenda baru: "${title}" pada ${locationName}`,
        targetEntity: "Event",
        targetId: newEvent.id,
      },
    });

    // Notify assigned PICs
    if (userIdsToCheck.length > 0) {
      for (const uId of userIdsToCheck) {
        await prisma.notification.create({
          data: {
            userId: uId,
            title: "Penugasan Agenda Baru",
            message: `Anda ditugaskan sebagai PIC untuk agenda: "${title}"`,
            type: conflicts.length > 0 ? "WARNING" : "INFO",
            link: `/events/${newEvent.id}`,
          },
        });
      }
    }

    return NextResponse.json({
      event: newEvent,
      conflicts,
      message: conflicts.length > 0 ? "Agenda dibuat dengan catatan bentrok jadwal" : "Agenda berhasil dibuat",
    }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { error: "Gagal membuat agenda", details: error?.message },
      { status: 500 }
    );
  }
}
