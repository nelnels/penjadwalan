import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    await prisma.notification.updateMany({
      where: { isRead: false },
      data: { isRead: true },
    });
    return NextResponse.json({ message: "Semua notifikasi ditandai sudah dibaca" });
  } catch (error: any) {
    return NextResponse.json({ error: "Gagal update notifikasi" }, { status: 500 });
  }
}
