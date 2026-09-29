import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const { title } = body;

    if (!title) {
      return NextResponse.json({ error: "Judul subtask wajib diisi" }, { status: 400 });
    }

    const subtask = await prisma.taskSubitem.create({
      data: {
        taskId: id,
        title,
        isCompleted: false,
      },
    });

    return NextResponse.json(subtask, { status: 201 });
  } catch (error: any) {
    console.error("Error creating subtask:", error);
    return NextResponse.json(
      { error: "Gagal membuat subtask", details: error?.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { subtaskId, isCompleted } = body;

    const updated = await prisma.taskSubitem.update({
      where: { id: subtaskId },
      data: { isCompleted },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Error updating subtask:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui subtask", details: error?.message },
      { status: 500 }
    );
  }
}
