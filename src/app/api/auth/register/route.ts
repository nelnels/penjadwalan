import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, generateAccessToken, generateRefreshToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, confirmPassword, role, department, position, phone } = body;

    // Validation
    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Nama lengkap wajib diisi." }, { status: 400 });
    }

    if (!email || !email.trim() || !email.includes("@")) {
      return NextResponse.json({ error: "Format email tidak valid." }, { status: 400 });
    }

    if (!password || password.length < 6) {
      return NextResponse.json({ error: "Password minimal harus 6 karakter." }, { status: 400 });
    }

    if (confirmPassword && password !== confirmPassword) {
      return NextResponse.json({ error: "Konfirmasi password tidak cocok." }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email sudah terdaftar. Silakan masuk atau gunakan email lain." },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);
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

    const tokenPayload = {
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      name: newUser.name,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Save refresh token
    await prisma.user.update({
      where: { id: newUser.id },
      data: { refreshToken },
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        userId: newUser.id,
        action: "USER_REGISTER",
        description: `Pengguna baru berhasil mendaftar akun: "${newUser.name}" (${newUser.role})`,
        targetEntity: "User",
        targetId: newUser.id,
      },
    });

    const response = NextResponse.json(
      {
        message: "Pendaftaran akun berhasil!",
        user: newUser,
        accessToken,
        refreshToken,
      },
      { status: 201 }
    );

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
    console.error("Register API error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server saat mendaftar.", details: error?.message },
      { status: 500 }
    );
  }
}
