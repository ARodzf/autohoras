"use client";

import React, { useState, useEffect } from "react";
import { FileDown, Calendar, FileSpreadsheet, CheckCircle2, TrendingUp, Car } from "lucide-react";
import { fetchLogs } from "@/lib/time-logs-service";
import { exportLogsToPDF, exportLogsToCSV } from "@/lib/export-pdf";
import { TimeLog } from "@/types/database";

export default function ReportesView() {
  const [logs, setLogs] = useState<TimeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);

  useEffect(() => {
    fetchLogs({ period: "all" })
      .then(setLogs)
      .finally(() => setLoading(false));
  }, []);

  const handleExportDaily = async () => {
    setExporting("daily-pdf");
    try {
      const dailyLogs = await fetchLogs({ period: "today" });
      if (dailyLogs.length === 0) {
        alert("No hay registros en el día de hoy para exportar.");
        return;
      }
      exportLogsToPDF(dailyLogs, `Reporte Diario de Horas - ${new Date().toLocaleDateString("es-ES")}`);
    } finally {
      setExporting(null);
    }
  };

  const handleExportMonthly = async () => {
    setExporting("monthly-pdf");
    try {
      const monthlyLogs = await fetchLogs({ period: "month" });
      if (monthlyLogs.length === 0) {
        alert("No hay registros en este mes para exportar.");
        return;
      }
      const mesNombre = new Date().toLocaleString("es-ES", { month: "long", year: "numeric" });
      exportLogsToPDF(monthlyLogs, `Reporte Mensual de Horas - ${mesNombre}`);
    } finally {
      setExporting(null);
    }
  };

  const handleExportCSV = async () => {
    setExporting("csv");
    try {
      const all = await fetchLogs({ period: "all" });
      exportLogsToCSV(all, `historico_horas_${new Date().toISOString().slice(0, 10)}.csv`);
    } finally {
      setExporting(null);
    }
  };

  // Agrupamiento por vehículo para comprobante rápido
  const vehicleSummary = React.useMemo(() => {
    const map = new Map<string, { totalHours: number; count: number; orders: Set<string> }>();
    logs.forEach((item) => {
      const plate = item.vehicle_plate.toUpperCase();
      const existing = map.get(plate) || { totalHours: 0, count: 0, orders: new Set<string>() };
      existing.totalHours += Number(item.duration_hours);
      existing.count += 1;
      if (item.order_number) existing.orders.add(item.order_number);
      map.set(plate, existing);
    });
    return Array.from(map.entries()).sort((a, b) => b[1].totalHours - a[1].totalHours);
  }, [logs]);

  return (
    <div className="w-full max-w-2xl mx-auto pb-24 space-y-6">
      <header>
        <h2 className="text-xl font-black text-slate-100">Exportación de Comprobantes</h2>
        <p className="text-xs text-slate-400">Descarga reportes listos para facturación o nómina</p>
      </header>

      {/* Botones de 1 Clic */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <button
          onClick={handleExportDaily}
          disabled={exporting !== null}
          className="p-5 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-slate-950 text-left shadow-lg shadow-emerald-900/30 active:scale-[0.98] transition-all flex flex-col justify-between group cursor-pointer"
        >
          <div className="flex items-center justify-between w-full mb-3">
            <span className="p-2.5 bg-slate-950/20 rounded-xl text-slate-950 font-black">
              <Calendar className="w-6 h-6 stroke-[2.5]" />
            </span>
            <FileDown className="w-5 h-5 text-slate-950 opacity-70 group-hover:opacity-100 transition-opacity" />
          </div>
          <div>
            <div className="text-lg font-black tracking-tight text-slate-950">
              Reporte Diario (PDF)
            </div>
            <div className="text-xs text-slate-900/80 font-semibold mt-0.5">
              1 Clic • Registros de hoy
            </div>
          </div>
        </button>

        <button
          onClick={handleExportMonthly}
          disabled={exporting !== null}
          className="p-5 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white text-left shadow-lg shadow-blue-900/30 active:scale-[0.98] transition-all flex flex-col justify-between group cursor-pointer"
        >
          <div className="flex items-center justify-between w-full mb-3">
            <span className="p-2.5 bg-slate-950/30 rounded-xl text-white font-black">
              <TrendingUp className="w-6 h-6 stroke-[2.5]" />
            </span>
            <FileDown className="w-5 h-5 text-white opacity-70 group-hover:opacity-100 transition-opacity" />
          </div>
          <div>
            <div className="text-lg font-black tracking-tight text-white">
              Reporte Mensual (PDF)
            </div>
            <div className="text-xs text-blue-100/80 font-medium mt-0.5">
              1 Clic • Registros de este mes
            </div>
          </div>
        </button>
      </div>

      {/* Opción CSV */}
      <div className="flex items-center justify-between bg-slate-800/80 border border-slate-700 p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-200">Exportar a Excel / CSV</div>
            <div className="text-xs text-slate-400">Todo el histórico en archivo plano</div>
          </div>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={exporting !== null}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
        >
          Descargar CSV
        </button>
      </div>

      {/* Resumen Agrupado por Vehículo */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Car className="w-4 h-4 text-emerald-400" /> Horas Acumuladas por Placa
          </h3>
          <span className="text-xs text-slate-500 font-mono">{vehicleSummary.length} vehículos</span>
        </div>

        {vehicleSummary.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500 bg-slate-900/40 rounded-xl border border-slate-800">
            No hay registros para resumir.
          </div>
        ) : (
          <div className="space-y-2">
            {vehicleSummary.map(([plate, data]) => (
              <div
                key={plate}
                className="flex items-center justify-between p-3.5 bg-slate-850 bg-slate-800/60 border border-slate-700/60 rounded-xl"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-slate-100 text-base">
                      {plate}
                    </span>
                    <span className="text-[11px] bg-slate-700/60 text-slate-300 px-2 py-0.5 rounded-full font-semibold">
                      {data.count} {data.count === 1 ? "registro" : "registros"}
                    </span>
                  </div>
                  {data.orders.size > 0 && (
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Órdenes: {Array.from(data.orders).join(", ")}
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <span className="font-mono font-black text-emerald-400 text-lg">
                    {data.totalHours.toFixed(2)}h
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
