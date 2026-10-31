import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { TimeLog, formatDurationHuman } from "@/types/database";

export function exportLogsToPDF(
  logs: TimeLog[],
  title: string = "Comprobante de Horas de Trabajo"
) {
  const doc = new jsPDF();

  // Encabezado estilizado en azul marino / slate oscuro elegante
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 36, "F");

  doc.setTextColor(248, 250, 252);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("AUTOHORAS - TALLER AUTOMOTRIZ", 14, 18);

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(title, 14, 27);

  const fechaGeneracion = new Date().toLocaleString("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  doc.text(`Emisión: ${fechaGeneracion}`, 196, 27, { align: "right" });

  // Resumen
  const totalMinutos = logs.reduce(
    (sum, item) => sum + (item.duration_minutes || Math.round((item.duration_hours || 0) * 60)),
    0
  );
  const totalHoras = (totalMinutos / 60).toFixed(2);
  const totalVehiculos = new Set(
    logs.map((l) => l.vehicle_plate || l.order_number || "Sin ID")
  ).size;

  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.setFont("helvetica", "bold");
  doc.text(
    `Total Registros: ${logs.length}   |   Vehículos/Órdenes: ${totalVehiculos}   |   Tiempo Total: ${formatDurationHuman(totalMinutos)} (${totalHoras} hrs)`,
    14,
    45
  );

  // Tabla
  const tableRows = logs.map((log) => {
    const identificador = log.vehicle_plate 
      ? `Placa: ${log.vehicle_plate}` 
      : log.order_number 
      ? `Orden: #${log.order_number}`
      : "S/P";

    const duracionTexto = formatDurationHuman(
      log.duration_minutes || Math.round(Number(log.duration_hours || 0) * 60)
    );

    return [
      new Date(log.logged_at).toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }),
      identificador,
      duracionTexto,
      log.technician_name || "—",
      log.description || "—",
    ];
  });

  autoTable(doc, {
    startY: 50,
    head: [["Fecha / Hora", "Vehículo / Orden", "Tiempo Invertido", "Técnico", "Notas / Trabajo"]],
    body: tableRows,
    theme: "striped",
    headStyles: {
      fillColor: [37, 99, 235], // Azul vibrante profesional
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { cellWidth: 32 },
      1: { cellWidth: 35, fontStyle: "bold" },
      2: { cellWidth: 30, fontStyle: "bold", halign: "center" },
      3: { cellWidth: 32 },
      4: { cellWidth: "auto" },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  const safeTitle = title.toLowerCase().replace(/[^a-z0-9]/g, "_");
  const fileName = `reporte_horas_${safeTitle}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
}

export function exportLogsToCSV(
  logs: TimeLog[],
  filename: string = "reporte_horas.csv"
) {
  const headers = ["ID", "Fecha", "Placa", "Orden", "Tiempo_Texto", "Minutos", "Horas", "Tecnico", "Descripcion"];
  const rows = logs.map((log) => [
    log.id,
    new Date(log.logged_at).toLocaleString("es-ES"),
    `"${log.vehicle_plate || ""}"`,
    `"${log.order_number || ""}"`,
    `"${formatDurationHuman(log.duration_minutes)}"`,
    log.duration_minutes,
    log.duration_hours,
    `"${log.technician_name || ""}"`,
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
