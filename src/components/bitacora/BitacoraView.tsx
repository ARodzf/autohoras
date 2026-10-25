"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Search, Calendar, Clock, Trash2, X, User } from "lucide-react";
import { fetchLogs, deleteTimeLog } from "@/lib/time-logs-service";
import { TimeLog, FilterPeriod, WorkCategory, formatDurationHuman } from "@/types/database";

export default function BitacoraView() {
  const [logs, setLogs] = useState<TimeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [period, setPeriod] = useState<FilterPeriod>("all");
  const [categoryFilter, setCategoryFilter] = useState<WorkCategory | "all">("all");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchLogs({
        searchTerm,
        period,
        category: categoryFilter,
      });
      setLogs(data);
    } catch (err) {
      console.error("Error al cargar registros:", err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, period, categoryFilter]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      loadData();
    }, 200);
    return () => clearTimeout(debounceTimer);
  }, [loadData]);

  const handleDelete = async (id: string, identifier: string) => {
    if (confirm(`¿Eliminar registro de ${identifier}?`)) {
      await deleteTimeLog(id);
      setLogs((prev) => prev.filter((l) => l.id !== id));
    }
  };

  const totalMinutes = useMemo(() => {
    return logs.reduce((sum, item) => sum + (item.duration_minutes || Math.round(item.duration_hours * 60)), 0);
  }, [logs]);

  const uniqueVehiclesCount = useMemo(() => {
    return new Set(logs.map((l) => l.vehicle_plate || l.order_number || "Sin ID")).size;
  }, [logs]);

  return (
    <div className="w-full max-w-2xl mx-auto pb-28 space-y-4">
      {/* Buscador Universal */}
      <div className="sticky top-0 z-30 pt-1 pb-3 bg-zinc-950/95 backdrop-blur-md space-y-2">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por placa, orden, técnico o pieza..."
            className="w-full pl-11 pr-10 py-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none text-sm transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-zinc-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filtros Rápidos de Periodo y Categoría */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {(
            [
              { id: "today", label: "Hoy" },
              { id: "week", label: "Esta Semana" },
              { id: "month", label: "Este Mes" },
              { id: "all", label: "Todo el Tiempo" },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              onClick={() => setPeriod(item.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                period === item.id
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-zinc-200"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Filtros de Categoría */}
        <div className="flex items-center gap-1.5">
          {[
            { id: "all", label: "Todas las áreas" },
            { id: "exterior", label: "🚗 Exterior" },
            { id: "interior", label: "🛋️ Interior" },
            { id: "mecanica", label: "🔧 Mecánica" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id as any)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                categoryFilter === cat.id
                  ? "bg-zinc-100 text-zinc-950 font-bold"
                  : "bg-zinc-900/60 text-zinc-400 border border-zinc-800/80 hover:text-zinc-200"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Resumen Superior */}
      <div className="grid grid-cols-3 gap-2 bg-zinc-900 border border-zinc-800/80 p-3 rounded-2xl">
        <div className="text-center border-r border-zinc-800">
          <div className="text-[10px] uppercase text-zinc-500 font-bold">Intervenciones</div>
          <div className="text-lg font-black text-zinc-200 font-mono">{logs.length}</div>
        </div>
        <div className="text-center border-r border-zinc-800">
          <div className="text-[10px] uppercase text-zinc-500 font-bold">Vehículos</div>
          <div className="text-lg font-black text-zinc-200 font-mono">{uniqueVehiclesCount}</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] uppercase text-amber-400 font-bold">Tiempo Total</div>
          <div className="text-lg font-black text-amber-400 font-mono">
            {formatDurationHuman(totalMinutes)}
          </div>
        </div>
      </div>

      {/* Listado de Registros */}
      {loading ? (
        <div className="text-center py-12 text-zinc-500 text-xs">Cargando intervenciones...</div>
      ) : logs.length === 0 ? (
        <div className="text-center py-14 px-4 bg-zinc-900/40 rounded-2xl border border-dashed border-zinc-800">
          <Clock className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-zinc-300">No hay registros con estos filtros</h3>
          <p className="text-xs text-zinc-500 mt-0.5">Prueba cambiando el buscador o el periodo.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {logs.map((log) => {
            const dateObj = new Date(log.logged_at);
            const dateStr = dateObj.toLocaleDateString("es-ES", {
              day: "2-digit",
              month: "short",
            });
            const timeStr = dateObj.toLocaleTimeString("es-ES", {
              hour: "2-digit",
              minute: "2-digit",
            });

            const identificador = log.vehicle_plate || (log.order_number ? `ORD: ${log.order_number}` : "S/P");

            const duracionTexto = formatDurationHuman(
              log.duration_minutes || Math.round(Number(log.duration_hours) * 60)
            );

            return (
              <div
                key={log.id}
                className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-4 transition-all hover:border-zinc-700 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {/* Placa o Número de Orden */}
                    <div className="bg-zinc-950 border border-zinc-750 text-zinc-100 font-mono font-black text-base px-3 py-1 rounded-xl tracking-wider">
                      {identificador}
                    </div>

                    {/* Categoría Badge */}
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/20">
                      {log.category === "exterior" ? "🚗 Exterior" :
                       log.category === "interior" ? "🛋️ Interior" : "🔧 Mecánica"}
                    </span>
                  </div>

                  {/* Badge de Horas Entendible */}
                  <div className="text-right">
                    <span className="inline-block bg-amber-400/10 text-amber-400 border border-amber-400/30 font-black font-mono text-sm px-2.5 py-1 rounded-xl">
                      {duracionTexto}
                    </span>
                  </div>
                </div>

                {/* Piezas trabajadas */}
                {log.parts && log.parts.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {log.parts.map((p) => (
                      <span
                        key={p}
                        className="text-[11px] font-medium bg-zinc-950 text-zinc-300 border border-zinc-800 px-2 py-0.5 rounded-lg"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                )}

                {/* Notas */}
                {log.description && (
                  <p className="text-xs text-zinc-400 mt-2 bg-zinc-950/60 p-2 rounded-xl border border-zinc-800/60">
                    {log.description}
                  </p>
                )}

                {/* Footer de Tarjeta con Técnico y Fecha */}
                <div className="flex items-center justify-between text-[11px] text-zinc-500 mt-3 pt-2 border-t border-zinc-800/60">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                      {dateStr} {timeStr}
                    </span>
                    {log.technician_name && (
                      <span className="flex items-center gap-1 text-zinc-400">
                        <User className="w-3.5 h-3.5 text-zinc-500" />
                        {log.technician_name}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleDelete(log.id, identificador)}
                    className="p-1 text-zinc-600 hover:text-rose-400 transition-colors cursor-pointer"
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
