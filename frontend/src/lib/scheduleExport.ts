import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { EventDTO } from "./types";

const formatDate = (value: string) => new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
const dateStamp = () => new Date().toISOString().slice(0, 10);

function rows(schedules: EventDTO[]) {
  return schedules.map((item) => ({
    Judul: item.title,
    Deskripsi: item.description || "",
    Kategori: item.category,
    Status: item.status,
    "Tanggal Mulai": formatDate(item.startDate),
    "Tanggal Selesai": formatDate(item.endDate),
    Lokasi: item.locationName,
  }));
}

export function exportSchedulesToPdf(schedules: EventDTO[]) {
  const document = new jsPDF({ orientation: "landscape" });
  document.setFontSize(16);
  document.text("Laporan Schedule", 14, 16);
  document.setFontSize(9);
  document.text(`Diekspor: ${formatDate(new Date().toISOString())}`, 14, 22);
  autoTable(document, {
    startY: 28,
    head: [["Judul", "Kategori", "Status", "Tanggal Mulai", "Tanggal Selesai", "Lokasi"]],
    body: schedules.map((item) => [item.title, item.category, item.status, formatDate(item.startDate), formatDate(item.endDate), item.locationName]),
    styles: { fontSize: 8 },
    didDrawPage: (data) => {
      document.setFontSize(8);
      document.text(`Halaman ${data.pageNumber}`, document.internal.pageSize.getWidth() - 28, document.internal.pageSize.getHeight() - 8);
    },
  });
  document.save(`jadwal-export-${dateStamp()}.pdf`);
}

export function exportSchedulesToExcel(schedules: EventDTO[]) {
  const worksheet = XLSX.utils.json_to_sheet(rows(schedules));
  worksheet["!cols"] = [
    { wch: 34 }, { wch: 46 }, { wch: 22 }, { wch: 16 }, { wch: 22 }, { wch: 22 }, { wch: 30 },
  ];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Schedule");
  XLSX.writeFile(workbook, `jadwal-export-${dateStamp()}.xlsx`);
}
