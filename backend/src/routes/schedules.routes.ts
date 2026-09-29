import { Router, Request, Response } from "express";
import { listSchedules } from "../services/schedule.service.js";

const router = Router();

// GET /api/schedules?search=&category=&status=&startDate=&endDate=&sortBy=&sortOrder=&page=&limit=
router.get("/", async (req: Request, res: Response) => {
  try {
    return res.json(await listSchedules(req.query));
  } catch (error: any) {
    console.error("Error fetching schedules:", error);
    return res.status(500).json({ error: "Gagal memuat daftar jadwal", details: error?.message });
  }
});

export default router;
