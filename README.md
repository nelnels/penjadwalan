# JadwalKu

JadwalKu adalah aplikasi manajemen jadwal organisasi berbasis React, Express, Prisma, dan MySQL. Aplikasi ini mendukung daftar agenda, pencarian/filter server-side, kalender interaktif, reschedule drag-and-drop, serta ekspor laporan PDF dan Excel.

## Fitur utama

- CRUD agenda/schedule, tugas, pengguna, ruangan, audit log, dan notifikasi.
- Pencarian judul/deskripsi, filter kategori/status/tanggal, sorting, pagination, dan URL yang dapat dibagikan.
- Calendar View bulanan, mingguan, dan harian berbasis FullCalendar.
- Tambah/edit agenda dari calendar; event dapat di-drag untuk reschedule.
- Export hasil filter aktif ke PDF dan Excel.
- Dark mode tersimpan di browser, tampilan responsif, skeleton loading, toast error/sukses.
- Seed demo berisi 2 admin, 5 pengguna non-admin, dan 20 agenda beragam.

## Screenshot

Setelah menjalankan aplikasi, ambil screenshot berikut untuk dokumentasi portofolio dan simpan ke `docs/screenshots/`:

| Daftar Schedule | Calendar View |
| --- | --- |
| `docs/screenshots/schedule-list.png` | `docs/screenshots/schedule-calendar.png` |

## Tech stack

| Layer | Teknologi |
| --- | --- |
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, Zustand |
| Calendar | FullCalendar React (day grid, time grid, interaction/drag-drop) |
| Backend | Node.js, Express, TypeScript |
| Database | MySQL + Prisma ORM |
| Export | jsPDF + jspdf-autotable, SheetJS (xlsx) |

## Menjalankan secara lokal

Prasyarat: Node.js 18+, npm, dan MySQL 8+.

1. Buat database MySQL:

```sql
CREATE DATABASE jadwalku CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. Salin `.env.example` menjadi `backend/.env`, lalu isi kredensial MySQL dan JWT secret.

3. Siapkan backend dan database:

```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

4. Pada terminal kedua, jalankan frontend:

```bash
cd frontend
npm install
npm run dev
```

5. Buka `http://localhost:5173/schedules`. Calendar ada di `http://localhost:5173/schedules/calendar`.

## Endpoint Schedule

`GET /api/schedules` menerima `search`, `category`, `status`, `startDate`, `endDate`, `sortBy`, `sortOrder`, `page`, dan `limit`. Filter dibangun sebagai Prisma `AND` di backend. Tambahkan `all=true` untuk keperluan calendar/export dengan filter yang sama.

Contoh:

```text
/api/schedules?search=rapat&status=upcoming&sortBy=startDate&sortOrder=asc&page=1&limit=10
```

## Struktur folder

```text
backend/
  prisma/             # schema dan seed MySQL
  src/routes/         # route Express
  src/services/       # query/filter Schedule Prisma
frontend/
  src/components/     # list, calendar, modal, toast
  src/lib/            # tipe dan export PDF/Excel
  src/services/       # Axios API client
```

## Deploy produksi

Gunakan database MySQL terkelola, set `DATABASE_URL`, `JWT_SECRET`, dan `CORS_ORIGIN` pada environment deployment, jalankan `npx prisma db push`/migrasi, lalu build backend (`npm run build`) dan frontend (`npm run build`). Sajikan `frontend/dist` pada static host atau CDN dan deploy Express di service Node.js dengan reverse proxy HTTPS.
