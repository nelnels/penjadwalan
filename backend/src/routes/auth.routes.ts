import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";
import { AuthRequest, authenticateToken } from "../middleware/auth.js";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "jadwalku_jwt_secret_key_2026";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

// POST /api/auth/register
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { name, email, password, department, position, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Nama, email, dan password wajib diisi." });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password minimal harus 6 karakter." });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return res.status(409).json({ error: "Email sudah terdaftar. Silakan gunakan email lain atau login." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const assignedRole = role === "ADMIN" ? "ADMIN" : role === "MANAGER" ? "MANAGER" : "MEMBER";

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: assignedRole,
        department: department || "Divisi Anggota",
        position: position || "Staff Anggota",
        avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        position: true,
        avatar: true,
        createdAt: true,
      },
    });

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role, name: newUser.name },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    await prisma.auditLog.create({
      data: {
        userId: newUser.id,
        action: "USER_REGISTER",
        description: `Pengguna baru mendaftar akun: "${newUser.name}" (${newUser.role})`,
        targetEntity: "User",
        targetId: newUser.id,
      },
    });

    return res.status(201).json({
      message: "Registrasi akun berhasil.",
      token,
      user: newUser,
    });
  } catch (error: any) {
    console.error("Register error:", error);
    return res.status(500).json({ error: "Terjadi kesalahan server saat registrasi." });
  }
});

// POST /api/auth/login
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email dan password wajib diisi." });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return res.status(401).json({ error: "Email atau password salah." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Email atau password salah." });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    const { password: _, ...userWithoutPassword } = user;

    return res.json({
      message: "Login berhasil",
      token,
      user: userWithoutPassword,
    });
  } catch (error: any) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Terjadi kesalahan server saat login." });
  }
});

// POST /api/auth/switch-demo (Simulate one-click login for portfolio demo)
router.post("/switch-demo", async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    let user;

    if (userId) {
      user = await prisma.user.findUnique({ where: { id: userId } });
    } else {
      user = await prisma.user.findFirst();
    }

    if (!user) {
      return res.status(404).json({ error: "User tidak ditemukan" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    const { password: _, ...userWithoutPassword } = user;

    return res.json({
      token,
      user: userWithoutPassword,
    });
  } catch (error: any) {
    return res.status(500).json({ error: "Gagal switch demo user" });
  }
});

// GET /api/auth/me
router.get("/me", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        position: true,
        avatar: true,
        phone: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User tidak ditemukan" });
    }

    return res.json(user);
  } catch (error: any) {
    return res.status(500).json({ error: "Gagal memuat profil user" });
  }
});

export default router;
