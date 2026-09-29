import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

// GET /api/audit-logs
router.get("/", async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 50;
    const logs = await prisma.auditLog.findMany({
      include: {
        user: { select: { id: true, name: true, role: true, avatar: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return res.json(logs);
  } catch (error: any) {
    return res.status(500).json({ error: "Gagal memuat log audit" });
  }
});

export default router;
