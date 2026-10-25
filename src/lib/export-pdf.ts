import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { TimeLog } from "@/types/database";

export function exportLogsToPDF(
  logs: TimeLog[],
  title: string = "Comprobante de Horas de Trabajo"
) {
  const doc = new jsPDF();

  // Encabezado
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 35, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("AUTOHORAS - TALLER MECÁNICO", 14, 18);

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(title, 14, 26);

  const fechaGeneracion = new Date().toLocaleString("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  doc.text(`Fecha de emisión: ${fechaGeneracion}`, 196, 26, { align: "right" });

  // Resumen rápido
  const totalHoras = logs.reduce((sum, item) => sum + Number(item.duration_hours), 0);
  const totalVehiculos = new Set(logs.map((l) => l.vehicle_plate)).size;

  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);
  doc.setFont("helvetica", "bold");
  doc.text(
    `Total Registros: ${logs.length}   |   Vehículos Atendidos: ${totalVehiculos}   |   Total Horas: ${totalHoras.toFixed(2)} hrs`,
    14,
    44
  );

  // Tabla de datos
  const tableRows = logs.map((log) => [
    new Date(log.logged_at).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }),
    log.vehicle_plate.toUpperCase(),
    log.order_number || "—",
    `${Number(log.duration_hours).toFixed(2)} h`,
    log.parts && log.parts.length > 0 ? log.parts.join(", ") : "General",
    log.description || "—",
  ]);

  autoTable(doc, {
    startY: 48,
    head: [["Fecha / Hora", "Placa", "Nº Orden", "Horas", "Partes / Sistema", "Detalle / Notas"]],
    body: tableRows,
    theme: "striped",
    headStyles: {
      fillColor: [16, 185, 129], // emerald-500
      textColor: [15, 23, 42],
      fontStyle: "bold",
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { cellWidth: 32 },
      1: { cellWidth: 26, fontStyle: "bold" },
      2: { cellWidth: 24 },
      3: { cellWidth: 20, fontStyle: "bold", halign: "center" },
      4: { cellWidth: 38 },
      5: { cellWidth: "auto" },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  // Nombre de archivo normalizado
  const safeTitle = title.toLowerCase().replace(/[^a-z0-9]/g, "_");
  const fileName = `reporte_horas_${safeTitle}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
}

export function exportLogsToCSV(
  logs: TimeLog[],
  filename: string = "reporte_horas.csv"
) {
  const headers = ["ID", "Fecha", "Placa", "Orden", "Horas", "Partes", "Descripcion"];
  const rows = logs.map((log) => [
    log.id,
    new Date(log.logged_at).toLocaleString("es-ES"),
    `"${log.vehicle_plate}"`,
    `"${log.order_number || ""}"`,
    log.duration_hours,
    `"${(log.parts || []).join("; ")}"`,
    `"${(log.description || "").replace(/"/g, '""')}"`,
  ]);

  const csvContent =
    "data:text/csv;charset=utf-8,\uFEFF" +
    [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
