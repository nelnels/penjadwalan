import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.routes.js";
import eventsRoutes from "./routes/events.routes.js";
import tasksRoutes from "./routes/tasks.routes.js";
import conflictsRoutes from "./routes/conflicts.routes.js";
import statsRoutes from "./routes/stats.routes.js";
import usersRoutes from "./routes/users.routes.js";
import roomsRoutes from "./routes/rooms.routes.js";
import auditRoutes from "./routes/audit.routes.js";
import notificationsRoutes from "./routes/notifications.routes.js";
import schedulesRoutes from "./routes/schedules.routes.js";
import googleCalendarRoutes from "./routes/google-calendar.routes.js";
import healthRoutes from "./routes/health.routes.js";
import habitsRoutes from "./routes/habits.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middlewares
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
  })
);
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    app: "JadwalKu Express API",
    database: "MySQL (Prisma ORM)",
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/events", eventsRoutes);
app.use("/api/schedules", schedulesRoutes);
app.use("/api/google-calendar", googleCalendarRoutes);
app.use("/api/health", healthRoutes);
app.use("/api/habits", habitsRoutes);
app.use("/api/tasks", tasksRoutes);
app.use("/api/conflicts", conflictsRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/rooms", roomsRoutes);
app.use("/api/audit-logs", auditRoutes);
app.use("/api/notifications", notificationsRoutes);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Unhandled Error:", err);
  res.status(500).json({
    error: "Internal Server Error",
    message: err?.message || "Terjadi kesalahan pada server backend",
  });
});

app.listen(PORT, () => {
  console.log(`🚀 JadwalKu Express Backend running on http://localhost:${PORT}`);
});

export default app;
