const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding JadwalKu MySQL database with realistic organization data...");

  // Clean existing data
  await prisma.notification.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.taskSubitem.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.milestone.deleteMany({});
  await prisma.eventAssignee.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.resourceRoom.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.user.deleteMany({});

  // 1. Create Rooms
  await prisma.resourceRoom.createMany({
    data: [
      { name: "Auditorium Utama Lt. 3", capacity: 250, type: "ROOM", facility: "Proyektor 4K, 4 Mic Wireless, AC Sentral, Sound Stage" },
      { name: "Ruang Rapat Eksekutif A-101", capacity: 20, type: "ROOM", facility: "Smart TV 75 inch, Conference Mic, Whiteboard, AC" },
      { name: "Ruang Diskusi & Workshop B-204", capacity: 40, type: "ROOM", facility: "Dual Projector, Podium, 10 Meja Kelompok" },
      { name: "Coworking Space Divisi", capacity: 30, type: "ROOM", facility: "High Speed WiFi, Standing Desk, Beanbags" },
      { name: "Zoom Meeting Room Pro 1 (Capacity 500)", capacity: 500, type: "ZOOM_ACCOUNT", facility: "Cloud Recording, Breakout Rooms" },
      { name: "Google Meet Enterprise Link", capacity: 250, type: "ZOOM_ACCOUNT", facility: "Live Streaming, Noise Cancellation" },
      { name: "Hybrid Hall & Webcast Studio", capacity: 100, type: "HYBRID", facility: "PTZ Cameras, Live Mixer, Green Screen" },
    ],
  });

  // Master kategori; kode dipakai oleh field Event.category dan warna dipakai Calendar View.
  await prisma.category.createMany({
    data: [
      { name: "Seminar & Workshop", code: "SEMINAR_WORKSHOP", color: "#3B82F6", description: "Pelatihan, seminar, dan workshop." },
      { name: "Rapat Koordinasi", code: "RAPAT_KOORDINASI", color: "#8B5CF6", description: "Rapat internal dan koordinasi." },
      { name: "Deadline Proyek", code: "DEADLINE_PROYEK", color: "#F59E0B", description: "Batas waktu proyek dan laporan." },
      { name: "Kegiatan Sosial", code: "KEGIATAN_SOSIAL", color: "#10B981", description: "Agenda pengabdian dan sosial." },
      { name: "Kompetisi / Lomba", code: "KOMPETISI_LOMBA", color: "#F43F5E", description: "Agenda kompetisi." },
      { name: "Internal Team", code: "INTERNAL_TEAM", color: "#64748B", description: "Aktivitas internal tim." },
    ],
  });

  const hashedPassword = await bcrypt.hash("password123", 10);

  // 2. Create Users
  const userHendra = await prisma.user.create({
    data: {
      name: "Dr. Hendra Wijaya, M.Kom",
      email: "hendra@jadwalku.org",
      password: hashedPassword,
      role: "ADMIN",
      department: "Biro Eksekutif & Pimpinan",
      position: "Ketua Dewan Eksekutif",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      phone: "+62 812-3456-7890",
    },
  });

  const userClarissa = await prisma.user.create({
    data: {
      name: "Clarissa Putri, S.I.Kom",
      email: "clarissa@jadwalku.org",
      password: hashedPassword,
      role: "MANAGER",
      department: "Divisi Acara & Program",
      position: "Koordinator Utama Acara",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
      phone: "+62 813-9876-5432",
    },
  });

  const userMaya = await prisma.user.create({
    data: {
      name: "Maya Kartika, M.M.",
      email: "maya@jadwalku.org",
      password: hashedPassword,
      role: "ADMIN",
      department: "Biro Eksekutif & Pimpinan",
      position: "Wakil Ketua Administrasi",
      phone: "+62 811-2222-3344",
    },
  });

  const userRizky = await prisma.user.create({
    data: {
      name: "Rizky Fauzan Pratama",
      email: "rizky@jadwalku.org",
      password: hashedPassword,
      role: "MANAGER",
      department: "Divisi Logistik & IT Support",
      position: "Koordinator IT & Infrastruktur",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      phone: "+62 856-1122-3344",
    },
  });

  const userAnisa = await prisma.user.create({
    data: {
      name: "Anisa Rahmawati",
      email: "anisa@jadwalku.org",
      password: hashedPassword,
      role: "MEMBER",
      department: "Divisi Humas, Publikasi & Dokumentasi",
      position: "Staff Media & Desain Kreatif",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80",
      phone: "+62 878-5544-3322",
    },
  });

  const userDimas = await prisma.user.create({
    data: {
      name: "Dimas Anggara",
      email: "dimas@jadwalku.org",
      password: hashedPassword,
      role: "MEMBER",
      department: "Divisi Sponsorship & Keuangan",
      position: "Staff Partnership & Sponsorship",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
      phone: "+62 821-6677-8899",
    },
  });

  const userSiti = await prisma.user.create({
    data: {
      name: "Siti Nurhaliza",
      email: "siti@jadwalku.org",
      password: hashedPassword,
      role: "MEMBER",
      department: "Divisi Konsumsi & Perlengkapan",
      position: "Staff Operasional & Logistik",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
      phone: "+62 819-0011-2233",
    },
  });

  // Base dates anchored around current time
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();

  const createDate = (dayOffset, hour, minute = 0) => {
    return new Date(year, month, day + dayOffset, hour, minute, 0);
  };

  // 3. Create Events
  const event1 = await prisma.event.create({
    data: {
      title: "Tech Summit & Innovation Expo 2026",
      description: "Konferensi teknologi tahunan yang menghadirkan 12 pembicara industri terkemuka, pameran 30 startup binaan organisasi, dan sesi networking dengan investor ternama.",
      category: "SEMINAR_WORKSHOP",
      priority: "URGENT",
      status: "IN_PROGRESS",
      startDate: createDate(2, 9, 0),
      endDate: createDate(3, 17, 30),
      isAllDay: false,
      isRecurring: false,
      locationType: "OFFLINE",
      locationName: "Auditorium Utama Lt. 3",
      department: "Divisi Acara & Program",
      budget: 45000000,
      progress: 68,
      color: "#3B82F6",
      createdById: userClarissa.id,
      assignees: {
        create: [
          { userId: userClarissa.id, roleInEvent: "PIC_UTAMA" },
          { userId: userRizky.id, roleInEvent: "KOORDINATOR_TEKNIS" },
          { userId: userAnisa.id, roleInEvent: "DOKUMENTASI" },
        ],
      },
      milestones: {
        create: [
          { title: "Finalisasi Rundown & Konfirmasi Pembicara", targetDate: createDate(-5, 12, 0), isCompleted: true, order: 1 },
          { title: "Gladi Resik & Setup Panggung Audio-Visual", targetDate: createDate(1, 16, 0), isCompleted: false, order: 2 },
          { title: "Hari Pelaksanaan & Live Stream Broadcasting", targetDate: createDate(2, 8, 30), isCompleted: false, order: 3 },
          { title: "LPJ & Evaluasi Pasca-Acara", targetDate: createDate(7, 14, 0), isCompleted: false, order: 4 },
        ],
      },
    },
  });

  const event2 = await prisma.event.create({
    data: {
      title: "Rapat Koordinasi Pleno Dewan & Pengurus",
      description: "Rapat evaluasi pencapaian program kerja bulanan seluruh divisi, laporan keuangan kas, dan sinkronisasi agenda strategis kuartal berikutnya.",
      category: "RAPAT_KOORDINASI",
      priority: "HIGH",
      status: "UPCOMING",
      startDate: createDate(1, 13, 30),
      endDate: createDate(1, 16, 0),
      isAllDay: false,
      isRecurring: true,
      recurrenceRule: "MONTHLY",
      locationType: "OFFLINE",
      locationName: "Ruang Rapat Eksekutif A-101",
      department: "Biro Eksekutif & Pimpinan",
      budget: 1500000,
      progress: 25,
      color: "#8B5CF6",
      createdById: userHendra.id,
      assignees: {
        create: [
          { userId: userHendra.id, roleInEvent: "PIC_UTAMA" },
          { userId: userClarissa.id, roleInEvent: "NOTULIS" },
          { userId: userDimas.id, roleInEvent: "ANGGOTA" },
        ],
      },
      milestones: {
        create: [
          { title: "Pengumpulan Slide Progress Divisi", targetDate: createDate(0, 18, 0), isCompleted: true, order: 1 },
          { title: "Pelaksanaan Rapat Pleno", targetDate: createDate(1, 13, 30), isCompleted: false, order: 2 },
        ],
      },
    },
  });

  const event3 = await prisma.event.create({
    data: {
      title: "Deadline Finalisasi Proposal Hibah Inovasi Dikti",
      description: "Batas akhir submit berkas proposal hibah pendanaan program riset dan pengabdian masyarakat ke portal Simbelmawa Kemendikbud.",
      category: "DEADLINE_PROYEK",
      priority: "URGENT",
      status: "UPCOMING",
      startDate: createDate(4, 8, 0),
      endDate: createDate(4, 23, 59),
      isAllDay: true,
      isRecurring: false,
      locationType: "ONLINE",
      locationName: "Google Meet Enterprise Link",
      locationUrl: "https://meet.google.com/jad-wlk-2026",
      department: "Divisi Sponsorship & Keuangan",
      budget: 500000,
      progress: 80,
      color: "#F59E0B",
      createdById: userDimas.id,
      assignees: {
        create: [
          { userId: userDimas.id, roleInEvent: "PIC_UTAMA" },
          { userId: userAnisa.id, roleInEvent: "REVIEWER_KONTEN" },
        ],
      },
    },
  });

  const event4 = await prisma.event.create({
    data: {
      title: "Bakti Sosial & Desa Binaan Peduli 2026",
      description: "Penyuluhan literasi digital untuk UMKM desa, pemeriksaan kesehatan gratis, dan pembagian 300 paket sembako untuk warga terdampak.",
      category: "KEGIATAN_SOSIAL",
      priority: "MEDIUM",
      status: "UPCOMING",
      startDate: createDate(8, 7, 30),
      endDate: createDate(9, 15, 0),
      isAllDay: false,
      isRecurring: false,
      locationType: "OFFLINE",
      locationName: "Ruang Diskusi & Workshop B-204",
      department: "Divisi Konsumsi & Perlengkapan",
      budget: 18500000,
      progress: 30,
      color: "#10B981",
      createdById: userSiti.id,
      assignees: {
        create: [
          { userId: userSiti.id, roleInEvent: "PIC_UTAMA" },
          { userId: userDimas.id, roleInEvent: "LOGISTIK" },
        ],
      },
    },
  });

  const event5 = await prisma.event.create({
    data: {
      title: "Hackathon Mahasiswa Nasional: AI & IoT Challenge",
      description: "Kompetisi hackathon 36 jam non-stop bagi mahasiswa seluruh Indonesia untuk merancang solusi cerdas berbasis AI generative & IoT sensorik.",
      category: "KOMPETISI_LOMBA",
      priority: "HIGH",
      status: "UPCOMING",
      startDate: createDate(12, 8, 0),
      endDate: createDate(14, 18, 0),
      isAllDay: false,
      isRecurring: false,
      locationType: "HYBRID",
      locationName: "Hybrid Hall & Webcast Studio",
      locationUrl: "https://zoom.us/j/98765432101",
      department: "Divisi Logistik & IT Support",
      budget: 32000000,
      progress: 45,
      color: "#F43F5E",
      createdById: userRizky.id,
      assignees: {
        create: [
          { userId: userRizky.id, roleInEvent: "PIC_UTAMA" },
          { userId: userClarissa.id, roleInEvent: "PANITIA_LOMBA" },
          { userId: userAnisa.id, roleInEvent: "MEDIA_PUBLIKASI" },
        ],
      },
    },
  });

  // Tambahan 15 agenda agar total seed menjadi 20 jadwal dengan status dan periode bervariasi.
  const demoSchedules = [
    ["Evaluasi Program Kerja Semester Lalu", -30, "COMPLETED", "RAPAT_KOORDINASI", "#8B5CF6"],
    ["Pelatihan Public Speaking Pengurus", -24, "COMPLETED", "SEMINAR_WORKSHOP", "#3B82F6"],
    ["Deadline Laporan Keuangan Q2", -18, "COMPLETED", "DEADLINE_PROYEK", "#F59E0B"],
    ["Kunjungan Sosial Panti Asuhan", -14, "COMPLETED", "KEGIATAN_SOSIAL", "#10B981"],
    ["Rapat Persiapan Festival Kampus", -10, "COMPLETED", "RAPAT_KOORDINASI", "#8B5CF6"],
    ["Pengumpulan Proposal Sponsorship", -6, "POSTPONED", "DEADLINE_PROYEK", "#F59E0B"],
    ["Briefing Panitia Open House", -3, "CANCELLED", "INTERNAL_TEAM", "#64748B"],
    ["Workshop Desain Konten Media Sosial", 3, "UPCOMING", "SEMINAR_WORKSHOP", "#3B82F6"],
    ["Rapat Koordinasi Divisi Mingguan", 5, "UPCOMING", "RAPAT_KOORDINASI", "#8B5CF6"],
    ["Kompetisi Debat Antar Fakultas", 7, "UPCOMING", "KOMPETISI_LOMBA", "#F43F5E"],
    ["Aksi Bersih Lingkungan Kampus", 10, "UPCOMING", "KEGIATAN_SOSIAL", "#10B981"],
    ["Deadline Registrasi Relawan", 15, "UPCOMING", "DEADLINE_PROYEK", "#F59E0B"],
    ["Rapat Finalisasi SOP Organisasi", 20, "UPCOMING", "INTERNAL_TEAM", "#64748B"],
    ["Seminar Karier Bersama Alumni", 28, "UPCOMING", "SEMINAR_WORKSHOP", "#3B82F6"],
    ["Evaluasi Akhir Tahun Organisasi", 45, "UPCOMING", "RAPAT_KOORDINASI", "#8B5CF6"],
  ];
  await prisma.event.createMany({
    data: demoSchedules.map(([title, offset, status, category, color], index) => ({
      title,
      description: `Data demo untuk ${title.toLowerCase()}.`,
      category,
      priority: index % 3 === 0 ? "HIGH" : "MEDIUM",
      status,
      startDate: createDate(offset, 9 + (index % 4), 0),
      endDate: createDate(offset, 11 + (index % 4), 0),
      locationType: "OFFLINE",
      locationName: index % 2 === 0 ? "Ruang Rapat Eksekutif A-101" : "Ruang Diskusi & Workshop B-204",
      department: "Divisi Acara & Program",
      budget: 1000000 + index * 250000,
      progress: status === "COMPLETED" ? 100 : status === "CANCELLED" ? 0 : 20 + index * 3,
      color,
      createdById: index % 2 === 0 ? userMaya.id : userClarissa.id,
    })),
  });

  // 4. Create Tasks for Events
  await prisma.task.create({
    data: {
      title: "Distribusikan Invitation & Badge VIP Pembicara",
      description: "Kirim email konfirmasi resmi beserta rundown detail dan QR akses ke 12 keynote speakers.",
      status: "DONE",
      priority: "HIGH",
      dueDate: createDate(-1, 17, 0),
      estimatedHours: 4,
      eventId: event1.id,
      assigneeId: userClarissa.id,
      order: 1,
      subtasks: {
        create: [
          { title: "Draft template email resmi", isCompleted: true },
          { title: "Generate QR pass kartu akses", isCompleted: true },
          { title: "Kirim blasting email VIP", isCompleted: true },
        ],
      },
    },
  });

  await prisma.task.create({
    data: {
      title: "Setup & Testing Sound Stage + Live Stream OBS",
      description: "Pastikan koneksi fiber optic 100 Mbps stabil, setting audio mixer, dan uji coba switch multicam.",
      status: "IN_PROGRESS",
      priority: "URGENT",
      dueDate: createDate(1, 15, 0),
      estimatedHours: 6,
      eventId: event1.id,
      assigneeId: userRizky.id,
      order: 2,
      subtasks: {
        create: [
          { title: "Cek kabel SDI & HDMI extender", isCompleted: true },
          { title: "Kalibrasi audio wireless microphone", isCompleted: false },
          { title: "Test bandwidth upload ke YouTube Live", isCompleted: false },
        ],
      },
    },
  });

  await prisma.task.create({
    data: {
      title: "Pencetakan Backdrop 6x3m & Banner Acara",
      description: "Koordinasi dengan vendor percetakan dan pastikan materi sudah terpasang di panggung H-1.",
      status: "IN_PROGRESS",
      priority: "HIGH",
      dueDate: createDate(0, 18, 0),
      estimatedHours: 3,
      eventId: event1.id,
      assigneeId: userAnisa.id,
      order: 3,
      subtasks: {
        create: [
          { title: "Approval desain final dari ketua", isCompleted: true },
          { title: "Kirim file TIFF resolusi tinggi ke vendor", isCompleted: true },
          { title: "Pengambilan dan pemasangan di auditorium", isCompleted: false },
        ],
      },
    },
  });

  await prisma.task.create({
    data: {
      title: "Review Rencana Anggaran Biaya (RAB) Proposal",
      description: "Validasi rincian harga satuan belanja bahan, honor narasumber, dan sewa alat sesuai PMK terbaru.",
      status: "REVIEW",
      priority: "URGENT",
      dueDate: createDate(3, 16, 0),
      estimatedHours: 5,
      eventId: event3.id,
      assigneeId: userDimas.id,
      order: 1,
      subtasks: {
        create: [
          { title: "Koreksi rumus spreadsheet RAB", isCompleted: true },
          { title: "Cek kepatuhan standar biaya masukan", isCompleted: true },
          { title: "Tanda tangan digital lembar pengesahan", isCompleted: false },
        ],
      },
    },
  });

  // 5. Create Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        userId: userClarissa.id,
        action: "CREATE_EVENT",
        description: "Membuat agenda baru: Tech Summit & Innovation Expo 2026 di Auditorium Utama Lt. 3",
        targetEntity: "Event",
        targetId: event1.id,
        createdAt: createDate(-3, 10, 15),
      },
      {
        userId: userHendra.id,
        action: "UPDATE_EVENT",
        description: "Menyetujui alokasi anggaran Rp 45.000.000 untuk Tech Summit 2026",
        targetEntity: "Event",
        targetId: event1.id,
        createdAt: createDate(-2, 14, 20),
      },
      {
        userId: userRizky.id,
        action: "COMPLETE_TASK",
        description: "Menyelesaikan subtask: Cek kabel SDI & HDMI extender untuk live stream",
        targetEntity: "Task",
        createdAt: createDate(-1, 16, 45),
      },
    ],
  });

  // 6. Create Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: userClarissa.id,
        title: "Event Mendatang: Tech Summit 2026",
        message: "Tech Summit & Innovation Expo akan berlangsung dalam 2 hari di Auditorium Utama Lt. 3.",
        type: "URGENT",
        isRead: false,
        link: `/events/${event1.id}`,
        createdAt: createDate(0, 8, 0),
      },
      {
        userId: userRizky.id,
        title: "Penugasan Task Baru",
        message: "Anda ditugaskan pada task 'Setup & Testing Sound Stage + Live Stream OBS'.",
        type: "INFO",
        isRead: false,
        link: `/tasks`,
        createdAt: createDate(0, 9, 15),
      },
      {
        userId: userHendra.id,
        title: "Rapat Pleno Bulanan Besok",
        message: "Rapat Koordinasi Pleno dijadwalkan besok pukul 13:30 di Ruang Rapat Eksekutif A-101.",
        type: "WARNING",
        isRead: false,
        link: `/calendar`,
        createdAt: createDate(0, 10, 0),
      },
    ],
  });

  console.log("Successfully seeded JadwalKu MySQL database!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
