"use client";

import React, { useState, useEffect } from "react";
import { FileDown, Calendar, FileSpreadsheet, TrendingUp, Car } from "lucide-react";
import { fetchLogs } from "@/lib/time-logs-service";
import { exportLogsToPDF, exportLogsToCSV } from "@/lib/export-pdf";
import { TimeLog, formatDurationHuman } from "@/types/database";

export default function ReportesView() {
  const [logs, setLogs] = useState<TimeLog[]>([]);
  const [exporting, setExporting] = useState<string | null>(null);

  useEffect(() => {
    fetchLogs({ period: "all" }).then(setLogs);
  }, []);

  const handleExportDaily = async () => {
    setExporting("daily");
    try {
      const daily = await fetchLogs({ period: "today" });
      if (daily.length === 0) {
        alert("No hay registros en el día de hoy.");
        return;
      }
      exportLogsToPDF(daily, `Comprobante Diario - ${new Date().toLocaleDateString("es-ES")}`);
    } finally {
      setExporting(null);
    }
  };

  const handleExportMonthly = async () => {
    setExporting("monthly");
    try {
      const monthly = await fetchLogs({ period: "month" });
      if (monthly.length === 0) {
        alert("No hay registros en este mes.");
        return;
      }
      const mes = new Date().toLocaleString("es-ES", { month: "long", year: "numeric" });
      exportLogsToPDF(monthly, `Reporte Mensual - ${mes}`);
    } finally {
      setExporting(null);
    }
  };

  const handleExportCSV = async () => {
    setExporting("csv");
    try {
      const all = await fetchLogs({ period: "all" });
      exportLogsToCSV(all, `historico_taller_${new Date().toISOString().slice(0, 10)}.csv`);
    } finally {
      setExporting(null);
    }
  };

  // Resumen agrupado por vehículo u orden
  const vehicleSummary = React.useMemo(() => {
    const map = new Map<string, { totalMinutes: number; count: number; techs: Set<string> }>();
    logs.forEach((item) => {
      const key = item.vehicle_plate || (item.order_number ? `ORD: ${item.order_number}` : "S/P");
      const existing = map.get(key) || { totalMinutes: 0, count: 0, techs: new Set<string>() };
      existing.totalMinutes += item.duration_minutes || Math.round(Number(item.duration_hours) * 60);
      existing.count += 1;
      if (item.technician_name) existing.techs.add(item.technician_name);
      map.set(key, existing);
    });
    return Array.from(map.entries()).sort((a, b) => b[1].totalMinutes - a[1].totalMinutes);
  }, [logs]);

  return (
    <div className="w-full max-w-2xl mx-auto pb-28 space-y-5">
      <header>
        <h2 className="text-xl font-black text-zinc-100">Comprobantes y Reportes</h2>
        <p className="text-xs text-zinc-400">Genera comprobantes oficiales listos para imprimir o liquidar</p>
      </header>

      {/* Botones de 1 Clic */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={handleExportDaily}
          disabled={exporting !== null}
          className="p-5 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white text-left shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all flex flex-col justify-between group cursor-pointer"
        >
          <div className="flex items-center justify-between w-full mb-3">
            <span className="p-2.5 bg-white/10 rounded-2xl text-white">
              <Calendar className="w-5 h-5" />
            </span>
            <FileDown className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" />
          </div>
          <div>
            <div className="text-base font-black text-white">Reporte Diario (PDF)</div>
            <div className="text-xs text-blue-100/80 font-medium mt-0.5">
              1 Clic • Trabajos y desarmes de hoy
            </div>
          </div>
        </button>

        <button
          onClick={handleExportMonthly}
          disabled={exporting !== null}
          className="p-5 rounded-3xl bg-gradient-to-br from-zinc-800 to-zinc-900 hover:bg-zinc-800 text-white text-left border border-zinc-700/80 shadow-md active:scale-[0.98] transition-all flex flex-col justify-between group cursor-pointer"
        >
          <div className="flex items-center justify-between w-full mb-3">
            <span className="p-2.5 bg-amber-400/10 text-amber-400 rounded-2xl">
              <TrendingUp className="w-5 h-5" />
            </span>
            <FileDown className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors" />
          </div>
          <div>
            <div className="text-base font-black text-white">Reporte Mensual (PDF)</div>
            <div className="text-xs text-zinc-400 font-medium mt-0.5">
              1 Clic • Resumen completo del mes
            </div>
          </div>
        </button>
      </div>

      {/* Exportar CSV */}
      <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-zinc-200">Exportar a Excel / CSV</div>
            <div className="text-xs text-zinc-400">Descarga directa de todas las filas</div>
          </div>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={exporting !== null}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
        >
          Descargar CSV
        </button>
      </div>

      {/* Resumen Agrupado */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Car className="w-4 h-4 text-blue-400" /> Horas Acumuladas por Vehículo / Orden
          </h3>
          <span className="text-xs text-zinc-500 font-mono">{vehicleSummary.length} registros</span>
        </div>

        {vehicleSummary.length === 0 ? (
          <div className="text-center py-8 text-xs text-zinc-500 bg-zinc-900/40 rounded-2xl border border-zinc-800">
            No hay registros para resumir.
          </div>
        ) : (
          <div className="space-y-2">
            {vehicleSummary.map(([identificador, data]) => (
              <div
                key={identificador}
                className="flex items-center justify-between p-3.5 bg-zinc-900 border border-zinc-800/80 rounded-2xl"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-zinc-100 text-base">
                      {identificador}
                    </span>
                    <span className="text-[11px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full font-semibold">
                      {data.count} {data.count === 1 ? "intervención" : "intervenciones"}
                    </span>
                  </div>
                  {data.techs.size > 0 && (
                    <div className="text-[11px] text-zinc-400 mt-0.5">
                      Técnicos: {Array.from(data.techs).join(", ")}
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <span className="font-mono font-black text-amber-400 text-base">
                    {formatDurationHuman(data.totalMinutes)}
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
