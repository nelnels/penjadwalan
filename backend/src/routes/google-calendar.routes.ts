import { Router, Request, Response } from "express";
import { google } from "googleapis";
import { prisma } from "../lib/prisma.js";

const router = Router();
const SCOPE = "https://www.googleapis.com/auth/calendar.readonly";
const states = new Set<string>();

function getClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) return null;
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

router.get("/status", async (_req: Request, res: Response) => {
  const configured = Boolean(getClient());
  const connection = configured ? await prisma.googleCalendarConnection.findUnique({ where: { provider: "google" } }) : null;
  return res.json({ configured, connected: Boolean(connection), accountEmail: connection?.accountEmail || null });
});

router.get("/connect", (req: Request, res: Response) => {
  const oauth = getClient();
  if (!oauth) return res.status(503).json({ error: "Google Calendar belum dikonfigurasi. Isi GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, dan GOOGLE_REDIRECT_URI." });
  const state = crypto.randomUUID();
  states.add(state);
  return res.redirect(oauth.generateAuthUrl({ access_type: "offline", prompt: "consent", scope: [SCOPE], state }));
});

router.get("/callback", async (req: Request, res: Response) => {
  const oauth = getClient();
  const state = String(req.query.state || "");
  const code = String(req.query.code || "");
  if (!oauth || !code || !states.delete(state)) return res.status(400).send("Autorisasi Google Calendar tidak valid atau sudah kedaluwarsa.");
  try {
    const { tokens } = await oauth.getToken(code);
    if (!tokens.access_token) throw new Error("Google tidak memberikan access token.");
    const existing = await prisma.googleCalendarConnection.findUnique({ where: { provider: "google" } });
    await prisma.googleCalendarConnection.upsert({
      where: { provider: "google" },
      create: { provider: "google", accessToken: tokens.access_token, refreshToken: tokens.refresh_token || null, expiryDate: tokens.expiry_date ? new Date(tokens.expiry_date) : null, scope: tokens.scope || SCOPE },
      update: { accessToken: tokens.access_token, refreshToken: tokens.refresh_token || existing?.refreshToken || null, expiryDate: tokens.expiry_date ? new Date(tokens.expiry_date) : null, scope: tokens.scope || SCOPE },
    });
    return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/schedules/calendar?google=connected`);
  } catch (error: any) { return res.status(500).send(`Gagal menghubungkan Google Calendar: ${error.message}`); }
});

router.get("/events", async (req: Request, res: Response) => {
  const oauth = getClient();
  if (!oauth) return res.status(503).json({ error: "Google Calendar belum dikonfigurasi." });
  const connection = await prisma.googleCalendarConnection.findUnique({ where: { provider: "google" } });
  if (!connection) return res.status(401).json({ error: "Google Calendar belum dihubungkan." });
  try {
    oauth.setCredentials({ access_token: connection.accessToken, refresh_token: connection.refreshToken || undefined, expiry_date: connection.expiryDate?.getTime() });
    const calendar = google.calendar({ version: "v3", auth: oauth });
    const events = await calendar.events.list({ calendarId: "primary", timeMin: req.query.startDate ? new Date(String(req.query.startDate)).toISOString() : new Date().toISOString(), timeMax: req.query.endDate ? new Date(String(req.query.endDate)).toISOString() : undefined, singleEvents: true, orderBy: "startTime" });
    return res.json((events.data.items || []).map((event) => ({ id: `google-${event.id}`, title: event.summary || "Tanpa judul", startDate: event.start?.dateTime || event.start?.date, endDate: event.end?.dateTime || event.end?.date || event.start?.dateTime || event.start?.date, isAllDay: Boolean(event.start?.date), color: "#4285F4", source: "google" })));
  } catch (error: any) { return res.status(502).json({ error: "Gagal membaca Google Calendar", details: error.message }); }
});

export default router;
