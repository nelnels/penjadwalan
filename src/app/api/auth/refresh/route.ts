import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyRefreshToken, generateAccessToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    let refreshToken: string | undefined;

    // Check cookie
    refreshToken = req.cookies.get("jadwalku_refresh_token")?.value;

    // Check body fallback
    if (!refreshToken) {
      try {
        const body = await req.json();
        refreshToken = body.refreshToken;
      } catch {}
    }

    if (!refreshToken) {
      return NextResponse.json({ error: "Refresh token tidak ditemukan." }, { status: 401 });
    }

    const payload = verifyRefreshToken(refreshToken);
    if (!payload || !payload.id) {
      return NextResponse.json({ error: "Refresh token kedaluwarsa atau tidak valid." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
    });

    if (!user || user.isActive === false || user.refreshToken !== refreshToken) {
      return NextResponse.json({ error: "Sesi tidak valid." }, { status: 403 });
    }

    const newAccessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    const response = NextResponse.json({
      message: "Token berhasil diperbarui.",
      accessToken: newAccessToken,
    });

    response.cookies.set("jadwalku_token", newAccessToken, {
      httpOnly: false,
      secure: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Refresh token error:", error);
    return NextResponse.json({ error: "Gagal memperbarui sesi token." }, { status: 500 });
  }
}
