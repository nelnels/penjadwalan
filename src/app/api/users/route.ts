import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, getAuthUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const role = searchParams.get("role");
    const department = searchParams.get("department");
    const page = searchParams.get("page");
    const limit = searchParams.get("limit");
    const paginate = searchParams.get("paginate") === "true" || !!page || !!limit;

    const where: any = {};

    if (role && role !== "ALL") {
      where.role = role;
    }

    if (department && department !== "ALL" && department !== "Semua Divisi") {
      where.department = department;
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q } },
        { email: { contains: q } },
        { position: { contains: q } },
        { department: { contains: q } },
      ];
    }

    if (!paginate) {
      const users = await prisma.user.findMany({
        where,
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
          createdAt: true,
        },
        orderBy: { name: "asc" },
      });
      return NextResponse.json(users);
    }

    const pageNum = Math.max(1, parseInt(page || "1", 10));
    const limitNum = Math.max(1, Math.min(50, parseInt(limit || "10", 10)));
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
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
          createdAt: true,
          _count: {
            select: {
              picEvents: true,
              tasks: true,
            },
          },
        },
        orderBy: { name: "asc" },
        take: limitNum,
        skip,
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      users,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1,
    });
  } catch (error: any) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Gagal memuat daftar user", details: error?.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    // Allow if admin or if no users exist yet
    if (authUser && authUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Hanya Administrator yang memiliki wewenang menambahkan pengguna baru." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, email, password, role, department, position, phone } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Nama pengguna wajib diisi." }, { status: 400 });
    }

    if (!email || !email.trim() || !email.includes("@")) {
      return NextResponse.json({ error: "Email pengguna tidak valid." }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return NextResponse.json({ error: "Email sudah terdaftar." }, { status: 409 });
    }

    const hashedPassword = await hashPassword(password || "password123");
    const assignedRole = role === "ADMIN" ? "ADMIN" : "USER";

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role: assignedRole,
        department: department || "Divisi Umum",
        position: position || "Staff",
        phone: phone || null,
        avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
        isActive: true,
      },
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
        createdAt: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: authUser?.id || newUser.id,
        action: "CREATE_USER",
        description: `Admin menambahkan pengguna baru: "${newUser.name}" (${newUser.role})`,
        targetEntity: "User",
        targetId: newUser.id,
      },
    });

    return NextResponse.json({ user: newUser, message: "Pengguna berhasil ditambahkan" }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Gagal menambahkan user", details: error?.message },
      { status: 500 }
    );
  }
}
