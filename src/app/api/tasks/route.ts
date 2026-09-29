import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const assigneeId = searchParams.get("assigneeId");

    const where: any = {};
    if (eventId && eventId !== "ALL") where.eventId = eventId;
    if (status && status !== "ALL") where.status = status;
    if (priority && priority !== "ALL") where.priority = priority;
    if (assigneeId && assigneeId !== "ALL") where.assigneeId = assigneeId;

    const tasks = await prisma.task.findMany({
      where,
      include: {
        event: {
          select: { id: true, title: true, category: true, color: true },
        },
        assignee: {
          select: { id: true, name: true, email: true, avatar: true, position: true },
        },
        subtasks: true,
      },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(tasks);
  } catch (error: any) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Gagal memuat daftar task", details: error?.message },
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
      status,
      priority,
      dueDate,
      estimatedHours,
      eventId,
      assigneeId,
      subtasks, // array of string or { title: string }
    } = body;

    if (!title) {
      return NextResponse.json({ error: "Judul task wajib diisi" }, { status: 400 });
    }

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

    if (assigneeId) {
      await prisma.notification.create({
        data: {
          userId: assigneeId,
          title: "Task Baru Ditugaskan",
          message: `Anda ditugaskan pada task: "${title}"`,
          type: "INFO",
          link: "/tasks",
        },
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: assigneeId,
        action: "CREATE_TASK",
        description: `Menambahkan task baru: "${title}" (Status: ${newTask.status})`,
        targetEntity: "Task",
        targetId: newTask.id,
      },
    });

    return NextResponse.json(newTask, { status: 201 });
  } catch (error: any) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Gagal membuat task", details: error?.message },
      { status: 500 }
    );
  }
}
