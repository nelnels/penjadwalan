import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, generateAccessToken, generateRefreshToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !email.trim()) {
      return NextResponse.json({ error: "Email wajib diisi." }, { status: 400 });
    }

    if (!password) {
      return NextResponse.json({ error: "Password wajib diisi." }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return NextResponse.json({ error: "Email atau kata sandi tidak sesuai." }, { status: 401 });
    }

    if (user.isActive === false) {
      return NextResponse.json(
        { error: "Akun Anda dinonaktifkan oleh administrator. Hubungi tim admin untuk pengaktifan kembali." },
        { status: 403 }
      );
    }

    const isMatch = await verifyPassword(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ error: "Email atau kata sandi tidak sesuai." }, { status: 401 });
    }

    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Update refresh token in DB
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "USER_LOGIN",
        description: `Pengguna masuk ke sistem: "${user.name}" (${user.role})`,
        targetEntity: "User",
        targetId: user.id,
      },
    });

    const { password: _, refreshToken: __, ...userProfile } = user;

    const response = NextResponse.json({
      message: "Login berhasil!",
      user: userProfile,
      accessToken,
      refreshToken,
    });

    // Set cookie
    response.cookies.set("jadwalku_token", accessToken, {
      httpOnly: false,
      secure: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 1 day
      path: "/",
    });

    response.cookies.set("jadwalku_refresh_token", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server saat login.", details: error?.message },
      { status: 500 }
    );
  }
}
