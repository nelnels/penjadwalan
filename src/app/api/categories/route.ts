import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(categories);
  } catch (error: any) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Gagal memuat master data kategori", details: error?.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (authUser && authUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Hanya Administrator yang memiliki wewenang mengelola master kategori." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, code, color, description } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Nama kategori wajib diisi." }, { status: 400 });
    }

    const generatedCode = code ? code.trim().toUpperCase().replace(/\s+/g, "_") : name.trim().toUpperCase().replace(/\s+/g, "_");

    const existing = await prisma.category.findUnique({
      where: { code: generatedCode },
    });

    if (existing) {
      return NextResponse.json({ error: "Kode kategori sudah ada, silakan gunakan kode lain." }, { status: 409 });
    }

    const newCategory = await prisma.category.create({
      data: {
        name: name.trim(),
        code: generatedCode,
        color: color || "#3B82F6",
        description: description || null,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: authUser?.id,
        action: "CREATE_CATEGORY",
        description: `Admin menambahkan kategori agenda baru: "${newCategory.name}" (${newCategory.code})`,
        targetEntity: "Category",
        targetId: newCategory.id,
      },
    });

    return NextResponse.json({ category: newCategory, message: "Kategori berhasil ditambahkan" }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Gagal membuat kategori baru", details: error?.message },
      { status: 500 }
    );
  }
}
