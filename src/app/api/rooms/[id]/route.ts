import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await getAuthUser(req);
    if (authUser && authUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Hanya Administrator yang memiliki wewenang mengubah master ruangan." },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await req.json();
    const { name, capacity, type, facility, status } = body;

    const existing = await prisma.resourceRoom.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Ruangan tidak ditemukan." }, { status: 404 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (capacity !== undefined) updateData.capacity = parseInt(String(capacity), 10);
    if (type !== undefined) updateData.type = type;
    if (facility !== undefined) updateData.facility = facility;
    if (status !== undefined) updateData.status = status;

    const updated = await prisma.resourceRoom.update({
      where: { id },
      data: updateData,
    });

    await prisma.auditLog.create({
      data: {
        userId: authUser?.id,
        action: "UPDATE_ROOM",
        description: `Admin memperbarui master ruangan: "${updated.name}" (Status: ${updated.status})`,
        targetEntity: "ResourceRoom",
        targetId: id,
      },
    });

    return NextResponse.json({ room: updated, message: "Data ruangan berhasil diperbarui" });
  } catch (error: any) {
    console.error("Error updating room:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui ruangan", details: error?.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await getAuthUser(req);
    if (authUser && authUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Hanya Administrator yang memiliki wewenang menghapus master ruangan." },
        { status: 403 }
      );
    }

    const { id } = params;
    const existing = await prisma.resourceRoom.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Ruangan tidak ditemukan." }, { status: 404 });
    }

    await prisma.resourceRoom.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: authUser?.id,
        action: "DELETE_ROOM",
        description: `Admin menghapus master ruangan: "${existing.name}"`,
        targetEntity: "ResourceRoom",
        targetId: id,
      },
    });

    return NextResponse.json({ message: `Ruangan "${existing.name}" berhasil dihapus.` });
  } catch (error: any) {
    console.error("Error deleting room:", error);
    return NextResponse.json(
      { error: "Gagal menghapus ruangan", details: error?.message },
      { status: 500 }
    );
  }
}
