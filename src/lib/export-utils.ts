import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { EventDTO } from "./types";
import { formatDateIndo, formatTimeRange, formatRupiah, CATEGORY_META } from "./utils";

export interface ExportFilterInfo {
  search?: string;
  category?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  owner?: string;
}

export function exportToExcel(
  events: EventDTO[],
  filters?: ExportFilterInfo,
  filenamePrefix: string = "Laporan_JadwalKu"
) {
  if (!events || events.length === 0) {
    throw new Error("Tidak ada data agenda untuk diekspor ke Excel.");
  }

  const rows = events.map((e, index) => {
    const picNames = e.assignees?.map((a) => a.user?.name).filter(Boolean).join(", ") || "—";
    const categoryLabel = (CATEGORY_META as any)[e.category]?.label || e.category;

    return {
      No: index + 1,
      "Judul Agenda": e.title,
      Kategori: categoryLabel,
      Status: e.status,
      Prioritas: e.priority,
      "Tanggal Mulai": formatDateIndo(e.startDate, "dd/MM/yyyy HH:mm"),
      "Tanggal Selesai": formatDateIndo(e.endDate, "dd/MM/yyyy HH:mm"),
      "Lokasi / Ruangan": e.locationName,
      "Tipe Lokasi": e.locationType,
      Divisi: e.department,
      "PIC / Peserta": picNames,
      "Anggaran (Rp)": e.budget || 0,
      "Progress (%)": `${e.progress || 0}%`,
      Deskripsi: e.description || "",
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Set column widths
  const colWidths = [
    { wch: 5 },  // No
    { wch: 30 }, // Judul
    { wch: 20 }, // Kategori
    { wch: 15 }, // Status
    { wch: 12 }, // Prioritas
    { wch: 20 }, // Tgl Mulai
    { wch: 20 }, // Tgl Selesai
    { wch: 25 }, // Lokasi
    { wch: 20 }, // Tipe Lokasi
    { wch: 25 }, // Divisi
    { wch: 30 }, // PIC
    { wch: 15 }, // Anggaran
    { wch: 12 }, // Progress
    { wch: 35 }, // Deskripsi
  ];
  worksheet["!cols"] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Data Agenda");

  const todayStr = new Date().toISOString().split("T")[0];
  XLSX.writeFile(workbook, `${filenamePrefix}_${todayStr}.xlsx`);
}

export function exportToPDF(
  events: EventDTO[],
  filters?: ExportFilterInfo,
  generatedBy?: string,
  filenamePrefix: string = "Laporan_JadwalKu"
) {
  if (!events || events.length === 0) {
    throw new Error("Tidak ada data agenda untuk diekspor ke PDF.");
  }

  // Create landscape document for roomy table
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const todayStr = formatDateIndo(new Date(), "EEEE, d MMMM yyyy HH:mm");

  // App Header
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 28, "F");

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("JADWALKU — LAPORAN REKAPITULASI AGENDA ORGANISASI", 14, 12);

  // Subtitle
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text("Enterprise Event Scheduling & Timeline Productivity Platform", 14, 18);

  // Generation timestamp & user
  const metaText = `Dicetak: ${todayStr} | Oleh: ${generatedBy || "Administrator"}`;
  doc.text(metaText, 14, 23);

  // Active Filter Summary Box
  let startY = 34;
  const filterParts: string[] = [];
  if (filters?.category && filters.category !== "ALL") filterParts.push(`Kategori: ${filters.category}`);
  if (filters?.status && filters.status !== "ALL") filterParts.push(`Status: ${filters.status}`);
  if (filters?.search) filterParts.push(`Pencarian: "${filters.search}"`);
  if (filters?.startDate && filters.endDate) {
    filterParts.push(`Periode: ${formatDateIndo(filters.startDate, "d MMM yyyy")} s/d ${formatDateIndo(filters.endDate, "d MMM yyyy")}`);
  }
  if (filters?.owner && filters.owner !== "ALL") filterParts.push(`User: ${filters.owner}`);

  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105); // slate-600
  if (filterParts.length > 0) {
    doc.setFillColor(241, 245, 249); // slate-100
    doc.roundedRect(14, startY - 4, pageWidth - 28, 8, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.text(`Filter Aktif: ${filterParts.join("  |  ")}`, 18, startY + 1.5);
    startY += 10;
  } else {
    doc.setFont("helvetica", "italic");
    doc.text("Menampilkan semua data agenda (tanpa filter)", 14, startY);
    startY += 6;
  }

  // Table Body Rows
  const tableData = events.map((e, index) => {
    const picNames = e.assignees?.map((a) => a.user?.name).filter(Boolean).join(", ") || "—";
    const categoryLabel = (CATEGORY_META as any)[e.category]?.label || e.category;
    const timeDisplay = `${formatDateIndo(e.startDate, "d MMM yyyy")}\n${formatTimeRange(e.startDate, e.endDate, e.isAllDay)}`;

    return [
      String(index + 1),
      e.title,
      categoryLabel,
      e.status,
      timeDisplay,
      e.locationName,
      e.department,
      picNames,
      e.budget ? formatRupiah(e.budget) : "Rp 0",
      `${e.progress || 0}%`,
    ];
  });

  autoTable(doc, {
    startY,
    head: [[
      "No",
      "Judul Agenda",
      "Kategori",
      "Status",
      "Waktu Pelaksanaan",
      "Ruangan / Lokasi",
      "Divisi",
      "PIC / Peserta",
      "Anggaran",
      "Progress",
    ]],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: [30, 41, 59], // slate-800
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
      halign: "center",
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
      cellPadding: 2.5,
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 10 },
      1: { cellWidth: 45, fontStyle: "bold" },
      2: { cellWidth: 28 },
      3: { halign: "center", cellWidth: 22 },
      4: { cellWidth: 35 },
      5: { cellWidth: 32 },
      6: { cellWidth: 28 },
      7: { cellWidth: 35 },
      8: { halign: "right", cellWidth: 23 },
      9: { halign: "center", cellWidth: 16 },
    },
    didDrawPage: (data) => {
      // Footer with page number
      const pageCount = (doc.internal as any).getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Halaman ${data.pageNumber} dari ${pageCount} — Dokumen Resmi Penjadwalan JadwalKu`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 8,
        { align: "center" }
      );
    },
  });

  const fileDate = new Date().toISOString().split("T")[0];
  doc.save(`${filenamePrefix}_${fileDate}.pdf`);
}
