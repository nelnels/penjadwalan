import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { AuthRequest, authenticateToken, requireRole } from "../middleware/auth.js";

const router = Router();

// GET /api/users
router.get("/", async (req: Request, res: Response) => {
  try {
    const { search, role, department, page, limit } = req.query;

    const where: any = {};
    if (role && role !== "ALL") where.role = String(role);
    if (department && department !== "Semua Divisi" && department !== "ALL") {
      where.department = String(department);
    }
    if (search) {
      const q = String(search);
      where.OR = [
        { name: { contains: q } },
        { email: { contains: q } },
        { position: { contains: q } },
      ];
    }

    const take = limit ? parseInt(String(limit), 10) : undefined;
    const skip = page && limit ? (parseInt(String(page), 10) - 1) * (take || 10) : undefined;

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
          createdAt: true,
          _count: {
            select: {
              picEvents: true,
              tasks: true,
            },
          },
        },
        orderBy: { name: "asc" },
        take,
        skip,
      }),
      prisma.user.count({ where }),
    ]);

    return res.json({
      users,
      total,
      page: page ? parseInt(String(page), 10) : 1,
      limit: take || total,
      totalPages: take ? Math.ceil(total / take) : 1,
    });
  } catch (error: any) {
    console.error("Error fetching users:", error);
    return res.status(500).json({ error: "Gagal memuat daftar user", details: error?.message });
  }
});

// POST /api/users (Admin Create User)
router.post("/", authenticateToken, requireRole(["ADMIN"]), async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, password, role, department, position, phone, avatar } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: "Nama dan email wajib diisi." });
    }

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (existing) {
      return res.status(409).json({ error: "Email sudah terdaftar." });
    }

    const hashedPassword = await bcrypt.hash(password || "password123", 10);
    const assignedRole = role === "ADMIN" ? "ADMIN" : role === "MANAGER" ? "MANAGER" : "MEMBER";

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: assignedRole,
        department: department || "Umum",
        position: position || "Staff",
        phone: phone || null,
        avatar: avatar || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
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
        createdAt: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        action: "CREATE_USER",
        description: `Admin menambahkan anggota baru: "${newUser.name}" (${newUser.role})`,
        targetEntity: "User",
        targetId: newUser.id,
      },
    });

    return res.status(201).json({ user: newUser, message: "Anggota tim berhasil ditambahkan" });
  } catch (error: any) {
    return res.status(500).json({ error: "Gagal membuat user baru", details: error?.message });
  }
});

// PATCH /api/users/:id (Admin Update User)
router.patch("/:id", authenticateToken, requireRole(["ADMIN"]), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, role, department, position, phone, password } = req.body;

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "User tidak ditemukan" });

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (email !== undefined) updateData.email = email.toLowerCase().trim();
    if (role !== undefined) updateData.role = role;
    if (department !== undefined) updateData.department = department;
    if (position !== undefined) updateData.position = position;
    if (phone !== undefined) updateData.phone = phone;
    if (password && password.trim().length >= 6) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updated = await prisma.user.update({
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
        updatedAt: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        action: "UPDATE_USER",
        description: `Admin memperbarui data anggota: "${updated.name}" (${updated.role})`,
        targetEntity: "User",
        targetId: id,
      },
    });

    return res.json({ user: updated, message: "Data anggota berhasil diperbarui" });
  } catch (error: any) {
    return res.status(500).json({ error: "Gagal memperbarui user" });
  }
});

// DELETE /api/users/:id (Admin Delete User)
router.delete("/:id", authenticateToken, requireRole(["ADMIN"]), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (req.user?.id === id) {
      return res.status(400).json({ error: "Anda tidak dapat menghapus akun Anda sendiri saat sedang login." });
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "User tidak ditemukan" });

    await prisma.user.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        action: "DELETE_USER",
        description: `Admin menghapus akun anggota: "${existing.name}" (${existing.email})`,
        targetEntity: "User",
        targetId: id,
      },
    });

    return res.json({ message: "User berhasil dihapus" });
  } catch (error: any) {
    return res.status(500).json({ error: "Gagal menghapus user" });
  }
});

export default router;
