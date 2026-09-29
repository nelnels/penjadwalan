const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding JadwalKu database with realistic organization data...");

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

  const defaultPasswordHash = bcrypt.hashSync("password123", 10);

  // 0. Create Master Categories
  await prisma.category.createMany({
    data: [
      { name: "Seminar & Workshop", code: "SEMINAR_WORKSHOP", color: "#3B82F6", description: "Agenda pelatihan, workshop teknis, dan seminar" },
      { name: "Rapat Koordinasi", code: "RAPAT_KOORDINASI", color: "#8B5CF6", description: "Rapat kerja internal, evaluasi, dan penyelarasan divisi" },
      { name: "Deadline Proyek", code: "DEADLINE_PROYEK", color: "#EF4444", description: "Batas akhir penyerahan berkas, milestone, atau laporan proyek" },
      { name: "Kegiatan Sosial", code: "KEGIATAN_SOSIAL", color: "#10B981", description: "Bakti sosial, kunjungan lapangan, dan pengabdian masyarakat" },
      { name: "Kompetisi & Lomba", code: "KOMPETISI_LOMBA", color: "#F59E0B", description: "Partisipasi lomba, pembinaan delegasi, dan kejuaraan" },
      { name: "Internal Team", code: "INTERNAL_TEAM", color: "#6366F1", description: "Bonding, rapat rutin mingguan divisi, dan koordinasi internal" },
    ],
  });

  // 1. Create Rooms

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

  // 2. Create Users
  const userHendra = await prisma.user.create({
    data: {
      name: "Dr. Hendra Wijaya, M.Kom",
      email: "hendra@jadwalku.org",
      password: defaultPasswordHash,
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
      password: defaultPasswordHash,
      role: "MANAGER",
      department: "Divisi Acara & Program",
      position: "Koordinator Utama Acara",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
      phone: "+62 813-9876-5432",
    },
  });

  const userRizky = await prisma.user.create({
    data: {
      name: "Rizky Fauzan Pratama",
      email: "rizky@jadwalku.org",
      password: defaultPasswordHash,
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
      password: defaultPasswordHash,
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
      password: defaultPasswordHash,
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
      password: defaultPasswordHash,
      role: "USER",
      department: "Divisi Konsumsi & Perlengkapan",
      position: "Staff Operasional & Logistik",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
      phone: "+62 819-0011-2233",
    },
  });

  // Dedicated test accounts for portfolio evaluation
  await prisma.user.create({
    data: {
      name: "Administrator Utama",
      email: "admin@jadwalku.com",
      password: defaultPasswordHash,
      role: "ADMIN",
      department: "Biro Eksekutif & Pimpinan",
      position: "Super Administrator",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      phone: "+62 811-2233-4455",
    },
  });

  await prisma.user.create({
    data: {
      name: "Budi Pratama (Standard User)",
      email: "user@jadwalku.com",
      password: defaultPasswordHash,
      role: "USER",
      department: "Divisi Acara & Program",
      position: "Staff Pelaksana",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
      phone: "+62 812-9988-7766",
    },
  });

  // Base dates anchored around current time
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();

  // Helper date creator
  const createDate = (dayOffset, hour, minute = 0) => {
    const d = new Date(year, month, day + dayOffset, hour, minute, 0);
    return d;
  };

  // 3. Create Events
  // Event 1: Tech Summit & Innovation Expo 2026
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

  // Event 2: Rapat Koordinasi Pleno Bulanan
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

  // Event 3: Deadline Pengumpulan Proposal Hibah Dikti
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

  // Event 4: Bakti Sosial & Desa Binaan Peduli 2026
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

  // Event 5: Hackathon Mahasiswa Nasional: AI & IoT
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

  // Event 6: Internal Sync & Standup Mingguan IT
  const event6 = await prisma.event.create({
    data: {
      title: "Weekly Sync & Sprint Planning IT Dev",
      description: "Sinkronisasi mingguan progress pengembangan website, maintenance server, dan konfigurasi peralatan streaming live event.",
      category: "INTERNAL_TEAM",
      priority: "MEDIUM",
      status: "UPCOMING",
      startDate: createDate(0, 10, 0),
      endDate: createDate(0, 11, 30),
      isAllDay: false,
      isRecurring: true,
      recurrenceRule: "WEEKLY",
      locationType: "OFFLINE",
      locationName: "Coworking Space Divisi",
      department: "Divisi Logistik & IT Support",
      budget: 300000,
      progress: 50,
      color: "#06B6D4",
      createdById: userRizky.id,
      assignees: {
        create: [
          { userId: userRizky.id, roleInEvent: "PIC_UTAMA" },
          { userId: userAnisa.id, roleInEvent: "ANGGOTA" },
        ],
      },
    },
  });

  // Event 7: Workshop UI/UX Design (Completed)
  const event7 = await prisma.event.create({
    data: {
      title: "Workshop UI/UX Design & Frontend Prototyping",
      description: "Pelatihan intensif 1 hari penggunaan Figma, Design System tokens, dan konversi desain ke Tailwind CSS untuk seluruh anggota humas.",
      category: "SEMINAR_WORKSHOP",
      priority: "LOW",
      status: "COMPLETED",
      startDate: createDate(-4, 9, 0),
      endDate: createDate(-4, 16, 0),
      isAllDay: false,
      isRecurring: false,
      locationType: "OFFLINE",
      locationName: "Ruang Diskusi & Workshop B-204",
      department: "Divisi Humas, Publikasi & Dokumentasi",
      budget: 4500000,
      progress: 100,
      color: "#3B82F6",
      createdById: userAnisa.id,
      assignees: {
        create: [
          { userId: userAnisa.id, roleInEvent: "PIC_UTAMA" },
          { userId: userRizky.id, roleInEvent: "CO_TRAINER" },
        ],
      },
    },
  });

  // 4. Create Tasks for Events
  // Tasks for Event 1 (Tech Summit)
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
      title: "Pemesanan Catering & Snack Box 300 Porsi",
      description: "Konfirmasi menu makan siang prasmanan VIP dan 300 snack box untuk seluruh peserta seminar.",
      status: "TODO",
      priority: "MEDIUM",
      dueDate: createDate(1, 11, 0),
      estimatedHours: 2,
      eventId: event1.id,
      assigneeId: userSiti.id,
      order: 4,
      subtasks: {
        create: [
          { title: "Pilih menu sehat non-alergen", isCompleted: false },
          { title: "Pembayaran DP 50% catering", isCompleted: false },
        ],
      },
    },
  });

  // Tasks for Event 3 (Hibah Proposal)
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

  // General Standalone Task
  await prisma.task.create({
    data: {
      title: "Audit & Pembaruan Inventaris Perlengkapan Audio-Visual",
      description: "Pengecekan kondisi fisik kabel, microphone, proyektor, dan update kartu stok logistik.",
      status: "TODO",
      priority: "LOW",
      dueDate: createDate(5, 17, 0),
      estimatedHours: 3,
      assigneeId: userRizky.id,
      order: 5,
      subtasks: {
        create: [
          { title: "Labeling barcode alat baru", isCompleted: false },
          { title: "Pisahkan unit yang perlu servis", isCompleted: false },
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
      {
        userId: userClarissa.id,
        action: "ASSIGN_PIC",
        description: "Menugaskan Rizky Fauzan Pratama sebagai Koordinator Teknis Tech Summit",
        targetEntity: "EventAssignee",
        createdAt: createDate(-2, 11, 0),
      },
      {
        userId: userDimas.id,
        action: "CREATE_EVENT",
        description: "Menjadwalkan Deadline Finalisasi Proposal Hibah Inovasi Dikti",
        targetEntity: "Event",
        targetId: event3.id,
        createdAt: createDate(-1, 9, 30),
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
      {
        userId: userDimas.id,
        title: "Review Proposal Hibah",
        message: "Subtask Rencana Anggaran Biaya telah diupdate oleh reviewer.",
        type: "SUCCESS",
        isRead: true,
        link: `/events/${event3.id}`,
        createdAt: createDate(-1, 15, 30),
      },
    ],
  });

  console.log("Successfully seeded JadwalKu database!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
