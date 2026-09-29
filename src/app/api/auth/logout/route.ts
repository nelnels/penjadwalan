import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);

    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: null },
      });

      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "USER_LOGOUT",
          description: `Pengguna keluar dari sistem: "${user.name}"`,
          targetEntity: "User",
          targetId: user.id,
        },
      });
    }

    const response = NextResponse.json({ message: "Logout berhasil." });

    response.cookies.set("jadwalku_token", "", {
      httpOnly: false,
      maxAge: 0,
      path: "/",
    });

    response.cookies.set("jadwalku_refresh_token", "", {
      httpOnly: true,
      maxAge: 0,
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Logout error:", error);
    return NextResponse.json({ error: "Gagal memproses logout." }, { status: 500 });
  }
}
