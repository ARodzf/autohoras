"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Search, Calendar, Clock, Wrench, Trash2, FileText, X } from "lucide-react";
import { fetchLogs, deleteTimeLog } from "@/lib/time-logs-service";
import { TimeLog, FilterPeriod } from "@/types/database";

export default function BitacoraView() {
  const [logs, setLogs] = useState<TimeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [period, setPeriod] = useState<FilterPeriod>("all");
  const [selectedPartFilter, setSelectedPartFilter] = useState<string>("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchLogs({
        searchTerm,
        period,
        selectedPart: selectedPartFilter,
      });
      setLogs(data);
    } catch (err) {
      console.error("Error al cargar registros:", err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, period, selectedPartFilter]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      loadData();
    }, 200);
    return () => clearTimeout(debounceTimer);
  }, [loadData]);

  const handleDelete = async (id: string, plate: string) => {
    if (confirm(`¿Eliminar registro de la placa ${plate}?`)) {
      await deleteTimeLog(id);
      setLogs((prev) => prev.filter((l) => l.id !== id));
    }
  };

  // Cálculo de totales instantáneos
  const totalHours = useMemo(() => {
    return logs.reduce((sum, item) => sum + Number(item.duration_hours), 0);
  }, [logs]);

  const uniquePlatesCount = useMemo(() => {
    return new Set(logs.map((l) => l.vehicle_plate)).size;
  }, [logs]);

  return (
    <div className="w-full max-w-2xl mx-auto pb-24 space-y-4">
      {/* Buscador Universal Omnipresente */}
      <div className="sticky top-0 z-30 pt-2 pb-3 bg-slate-950/90 backdrop-blur-md">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por placa, orden, sistema o notas..."
            className="w-full pl-12 pr-10 py-3.5 bg-slate-800 border-2 border-slate-700 rounded-2xl text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none text-base shadow-lg transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filtros Rápidos de Periodo */}
        <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto pb-1 scrollbar-none">
          {(
            [
              { id: "today", label: "Hoy" },
              { id: "week", label: "Esta Semana" },
              { id: "month", label: "Este Mes" },
              { id: "all", label: "Todo" },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              onClick={() => setPeriod(item.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                period === item.id
                  ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                  : "bg-slate-800/80 text-slate-400 border border-slate-700/60 hover:text-slate-200"
              }`}
            >
              {item.label}
            </button>
          ))}

          {selectedPartFilter && (
            <button
              onClick={() => setSelectedPartFilter("")}
              className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-blue-600/30 text-blue-300 border border-blue-500/40 flex items-center gap-1"
            >
              <span>{selectedPartFilter}</span>
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Barra de Estadísticas Rápidas */}
      <div className="grid grid-cols-3 gap-2 bg-slate-900/90 border border-slate-800 p-3 rounded-2xl">
        <div className="text-center border-r border-slate-800">
          <div className="text-xs uppercase text-slate-400 font-bold">Registros</div>
          <div className="text-xl font-black text-slate-100 font-mono">{logs.length}</div>
        </div>
        <div className="text-center border-r border-slate-800">
          <div className="text-xs uppercase text-slate-400 font-bold">Vehículos</div>
          <div className="text-xl font-black text-slate-100 font-mono">{uniquePlatesCount}</div>
        </div>
        <div className="text-center">
          <div className="text-xs uppercase text-emerald-400 font-bold">Total Horas</div>
          <div className="text-xl font-black text-emerald-400 font-mono">{totalHours.toFixed(2)}h</div>
        </div>
      </div>

      {/* Lista de Tarjetas de Registros */}
      {loading ? (
        <div className="text-center py-12 text-slate-500">Cargando bitácora...</div>
      ) : logs.length === 0 ? (
        <div className="text-center py-16 px-4 bg-slate-900/50 rounded-2xl border border-dashed border-slate-800">
          <Clock className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-300">No se encontraron registros</h3>
          <p className="text-xs text-slate-500 mt-1">
            Prueba ajustando los filtros o realiza un nuevo registro desde la pestaña principal.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => {
            const dateObj = new Date(log.logged_at);
            const dateFormatted = dateObj.toLocaleDateString("es-ES", {
              day: "2-digit",
              month: "short",
            });
            const timeFormatted = dateObj.toLocaleTimeString("es-ES", {
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={log.id}
                className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 shadow-md transition-all hover:border-slate-600"
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Badge de Placa estilo matrícula */}
                  <div className="flex items-center gap-2.5">
                    <div className="bg-amber-400/10 border border-amber-400/40 text-amber-300 font-mono font-black text-lg px-3 py-1 rounded-lg tracking-wider">
                      {log.vehicle_plate}
                    </div>
                    {log.order_number && (
                      <span className="text-xs bg-slate-700/60 text-slate-300 px-2 py-1 rounded-md font-medium">
                        #{log.order_number}
                      </span>
                    )}
                  </div>

                  {/* Badge de Horas */}
                  <div className="text-right">
                    <span className="inline-block bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-black font-mono text-base px-2.5 py-1 rounded-xl">
                      {Number(log.duration_hours).toFixed(2)} h
                    </span>
                  </div>
                </div>

                {/* Partes / Tags */}
                {log.parts && log.parts.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {log.parts.map((p) => (
                      <button
                        key={p}
                        onClick={() => setSelectedPartFilter(p)}
                        className="text-[11px] font-semibold bg-blue-950/60 text-blue-300 border border-blue-800/50 px-2 py-0.5 rounded-md hover:bg-blue-900/60 transition-colors"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                )}

                {/* Descripción / Notas */}
                {log.description && (
                  <p className="text-xs text-slate-300 mt-2 bg-slate-900/50 p-2 rounded-lg border border-slate-750">
                    {log.description}
                  </p>
                )}

                {/* Pie de tarjeta con fecha y botón de eliminar */}
                <div className="flex items-center justify-between text-xs text-slate-400 mt-3 pt-2.5 border-t border-slate-750/70">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>{dateFormatted} a las {timeFormatted}</span>
                  </div>

                  <button
                    onClick={() => handleDelete(log.id, log.vehicle_plate)}
                    className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                    title="Eliminar registro"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
