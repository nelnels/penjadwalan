import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const { title, description, status, priority, dueDate, estimatedHours, assigneeId, eventId, order } = body;

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

    // If status changed to DONE, recalculate event progress if attached to an event
    if (status === "DONE" && updatedTask.eventId) {
      const allEventTasks = await prisma.task.findMany({
        where: { eventId: updatedTask.eventId },
      });
      if (allEventTasks.length > 0) {
        const doneCount = allEventTasks.filter((t) => t.status === "DONE").length;
        const progressPercentage = Math.round((doneCount / allEventTasks.length) * 100);
        await prisma.event.update({
          where: { id: updatedTask.eventId },
          data: { progress: progressPercentage },
        });
      }
    }

    return NextResponse.json(updatedTask);
  } catch (error: any) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui task", details: error?.message },
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
    await prisma.task.delete({ where: { id } });
    return NextResponse.json({ message: "Task berhasil dihapus" });
  } catch (error: any) {
    console.error("Error deleting task:", error);
    return NextResponse.json(
      { error: "Gagal menghapus task", details: error?.message },
      { status: 500 }
    );
  }
}
