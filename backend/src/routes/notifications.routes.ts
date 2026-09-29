import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

// GET /api/notifications
router.get("/", async (req: Request, res: Response) => {
  try {
    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    return res.json(notifications);
  } catch (error: any) {
    return res.status(500).json({ error: "Gagal memuat notifikasi" });
  }
});

// PATCH /api/notifications/:id
router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
    return res.json(updated);
  } catch (error: any) {
    return res.status(500).json({ error: "Gagal memperbarui notifikasi" });
  }
});

// POST /api/notifications/read-all
router.post("/read-all", async (req: Request, res: Response) => {
  try {
    await prisma.notification.updateMany({
      where: { isRead: false },
      data: { isRead: true },
    });
    return res.json({ message: "Semua notifikasi ditandai dibaca" });
  } catch (error: any) {
    return res.status(500).json({ error: "Gagal memperbarui notifikasi" });
  }
});

export default router;
