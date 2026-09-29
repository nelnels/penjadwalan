import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rooms = await prisma.resourceRoom.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(rooms);
  } catch (error: any) {
    console.error("Error fetching rooms:", error);
    return NextResponse.json(
      { error: "Gagal memuat master data ruangan", details: error?.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (authUser && authUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Hanya Administrator yang memiliki wewenang mengelola master ruangan." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, capacity, type, facility, status } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Nama ruangan/fasilitas wajib diisi." }, { status: 400 });
    }

    const newRoom = await prisma.resourceRoom.create({
      data: {
        name: name.trim(),
        capacity: capacity ? parseInt(String(capacity), 10) : 20,
        type: type || "ROOM",
        facility: facility || null,
        status: status || "AVAILABLE",
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: authUser?.id,
        action: "CREATE_ROOM",
        description: `Admin menambahkan master ruangan: "${newRoom.name}" (Kapasitas: ${newRoom.capacity})`,
        targetEntity: "ResourceRoom",
        targetId: newRoom.id,
      },
    });

    return NextResponse.json({ room: newRoom, message: "Ruangan berhasil ditambahkan" }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating room:", error);
    return NextResponse.json(
      { error: "Gagal membuat ruangan baru", details: error?.message },
      { status: 500 }
    );
  }
}
