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
        { error: "Hanya Administrator yang memiliki wewenang mengubah master kategori." },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await req.json();
    const { name, color, description } = body;

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Kategori tidak ditemukan." }, { status: 404 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (color !== undefined) updateData.color = color;
    if (description !== undefined) updateData.description = description;

    const updated = await prisma.category.update({
      where: { id },
      data: updateData,
    });

    await prisma.auditLog.create({
      data: {
        userId: authUser?.id,
        action: "UPDATE_CATEGORY",
        description: `Admin memperbarui master kategori: "${updated.name}"`,
        targetEntity: "Category",
        targetId: id,
      },
    });

    return NextResponse.json({ category: updated, message: "Kategori berhasil diperbarui" });
  } catch (error: any) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui kategori", details: error?.message },
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
        { error: "Hanya Administrator yang memiliki wewenang menghapus master kategori." },
        { status: 403 }
      );
    }

    const { id } = params;
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Kategori tidak ditemukan." }, { status: 404 });
    }

    await prisma.category.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: authUser?.id,
        action: "DELETE_CATEGORY",
        description: `Admin menghapus master kategori: "${existing.name}"`,
        targetEntity: "Category",
        targetId: id,
      },
    });

    return NextResponse.json({ message: `Kategori "${existing.name}" berhasil dihapus.` });
  } catch (error: any) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { error: "Gagal menghapus kategori", details: error?.message },
      { status: 500 }
    );
  }
}
