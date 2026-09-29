import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { AuthRequest, authenticateToken, requireRole } from "../middleware/auth.js";

const router = Router();

// GET /api/rooms
router.get("/", async (req: Request, res: Response) => {
  try {
    const rooms = await prisma.resourceRoom.findMany({
      orderBy: { name: "asc" },
    });
    return res.json(rooms);
  } catch (error: any) {
    return res.status(500).json({ error: "Gagal memuat master data ruangan" });
  }
});

// POST /api/rooms (Admin only)
router.post("/", authenticateToken, requireRole(["ADMIN"]), async (req: AuthRequest, res: Response) => {
  try {
    const { name, capacity, type, facility, status } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Nama ruangan/fasilitas wajib diisi." });
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
        userId: req.user?.id,
        action: "CREATE_ROOM",
        description: `Admin menambahkan master ruangan: "${newRoom.name}" (Kapasitas: ${newRoom.capacity})`,
        targetEntity: "ResourceRoom",
        targetId: newRoom.id,
      },
    });

    return res.status(201).json({ room: newRoom, message: "Ruangan berhasil ditambahkan" });
  } catch (error: any) {
    return res.status(500).json({ error: "Gagal membuat ruangan baru" });
  }
});

// PATCH /api/rooms/:id (Admin only)
router.patch("/:id", authenticateToken, requireRole(["ADMIN"]), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, capacity, type, facility, status } = req.body;

    const existing = await prisma.resourceRoom.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Ruangan tidak ditemukan" });

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (capacity !== undefined) updateData.capacity = parseInt(String(capacity), 10);
    if (type !== undefined) updateData.type = type;
    if (facility !== undefined) updateData.facility = facility;
    if (status !== undefined) updateData.status = status;

    const updated = await prisma.resourceRoom.update({
      where: { id },
      data: updateData,
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        action: "UPDATE_ROOM",
        description: `Admin memperbarui master ruangan: "${updated.name}" (Status: ${updated.status})`,
        targetEntity: "ResourceRoom",
        targetId: id,
      },
    });

    return res.json({ room: updated, message: "Data ruangan berhasil diperbarui" });
  } catch (error: any) {
    return res.status(500).json({ error: "Gagal memperbarui ruangan" });
  }
});

// DELETE /api/rooms/:id (Admin only)
router.delete("/:id", authenticateToken, requireRole(["ADMIN"]), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await prisma.resourceRoom.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Ruangan tidak ditemukan" });

    await prisma.resourceRoom.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        action: "DELETE_ROOM",
        description: `Admin menghapus master ruangan: "${existing.name}"`,
        targetEntity: "ResourceRoom",
        targetId: id,
      },
    });

    return res.json({ message: "Ruangan berhasil dihapus" });
  } catch (error: any) {
    return res.status(500).json({ error: "Gagal menghapus ruangan" });
  }
});

export default router;
