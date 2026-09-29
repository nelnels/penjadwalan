import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, hashPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await getAuthUser(req);
    if (authUser && authUser.role !== "ADMIN" && authUser.id !== params.id) {
      return NextResponse.json(
        { error: "Anda tidak memiliki wewenang mengubah data pengguna ini." },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await req.json();
    const { name, email, role, department, position, phone, isActive, password } = body;

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Pengguna tidak ditemukan." }, { status: 404 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (department !== undefined) updateData.department = department;
    if (position !== undefined) updateData.position = position;
    if (phone !== undefined) updateData.phone = phone;

    // Role and active status can only be modified by admin
    if (authUser?.role === "ADMIN" || !authUser) {
      if (role !== undefined) updateData.role = role;
      if (isActive !== undefined) updateData.isActive = !!isActive;
    }

    if (email && email.toLowerCase().trim() !== existing.email) {
      const emailTaken = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
      });
      if (emailTaken) {
        return NextResponse.json({ error: "Email sudah digunakan oleh akun lain." }, { status: 409 });
      }
      updateData.email = email.toLowerCase().trim();
    }

    if (password && password.trim().length >= 6) {
      updateData.password = await hashPassword(password.trim());
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        position: true,
        avatar: true,
        phone: true,
        isActive: true,
        updatedAt: true,
      },
    });

    let actionName = "UPDATE_USER";
    let desc = `Memperbarui profil pengguna: "${updatedUser.name}"`;
    if (isActive !== undefined && isActive !== existing.isActive) {
      actionName = isActive ? "ACTIVATE_USER" : "DEACTIVATE_USER";
      desc = isActive
        ? `Admin mengaktifkan kembali akun pengguna: "${updatedUser.name}"`
        : `Admin menonaktifkan akun pengguna: "${updatedUser.name}"`;
    }

    await prisma.auditLog.create({
      data: {
        userId: authUser?.id || id,
        action: actionName,
        description: desc,
        targetEntity: "User",
        targetId: id,
      },
    });

    return NextResponse.json({
      message: "Data pengguna berhasil diperbarui.",
      user: updatedUser,
    });
  } catch (error: any) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui pengguna", details: error?.message },
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
        { error: "Hanya Administrator yang dapat menghapus data pengguna." },
        { status: 403 }
      );
    }

    const { id } = params;

    // Prevent deleting self if logged in as admin
    if (authUser && authUser.id === id) {
      return NextResponse.json(
        { error: "Anda tidak dapat menghapus akun Anda sendiri saat sedang aktif." },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Pengguna tidak ditemukan." }, { status: 404 });
    }

    await prisma.user.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: authUser?.id,
        action: "DELETE_USER",
        description: `Admin menghapus pengguna: "${existing.name}" (${existing.email})`,
        targetEntity: "User",
        targetId: id,
      },
    });

    return NextResponse.json({ message: `Pengguna "${existing.name}" berhasil dihapus.` });
  } catch (error: any) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Gagal menghapus user", details: error?.message },
      { status: 500 }
    );
  }
}
