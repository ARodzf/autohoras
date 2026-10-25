"use client";

import React, { useState, useEffect, useRef } from "react";
import { Plus, Minus, Check, Car, Clock, Wrench, Play, Pause, RotateCcw, AlertCircle } from "lucide-react";
import { createTimeLog, getDistinctPlates } from "@/lib/time-logs-service";
import { isSupabaseConfigured } from "@/lib/supabase/client";

const PART_OPTIONS = [
  "Motor",
  "Transmisión",
  "Frenos",
  "Suspensión",
  "Eléctrico",
  "Climatización",
  "Diagnóstico",
  "Mantenimiento",
];

const QUICK_HOURS = [0.5, 1.0, 1.5, 2.0, 3.0, 4.0];

interface QuickTimeEntryFormProps {
  onSuccess?: () => void;
}

export default function QuickTimeEntryForm({ onSuccess }: QuickTimeEntryFormProps) {
  const [plate, setPlate] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [hours, setHours] = useState<number>(1.0);
  const [selectedParts, setSelectedParts] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [historicalPlates, setHistoricalPlates] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modo Cronómetro Opcional
  const [stopwatchActive, setStopwatchActive] = useState(false);
  const [stopwatchSeconds, setStopwatchSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    getDistinctPlates().then(setHistoricalPlates).catch(console.error);
  }, []);

  // Manejo de Cronómetro
  useEffect(() => {
    if (stopwatchActive) {
      timerRef.current = setInterval(() => {
        setStopwatchSeconds((prev) => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [stopwatchActive]);

  const applyStopwatchToHours = () => {
    setStopwatchActive(false);
    const calculated = Math.max(0.25, parseFloat((stopwatchSeconds / 3600).toFixed(2)));
    setHours(calculated);
  };

  const resetStopwatch = () => {
    setStopwatchActive(false);
    setStopwatchSeconds(0);
  };

  const formatStopwatch = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const togglePart = (part: string) => {
    setSelectedParts((prev) =>
      prev.includes(part) ? prev.filter((p) => p !== part) : [...prev, part]
    );
  };

  const adjustHours = (delta: number) => {
    setHours((prev) => Math.max(0.25, parseFloat((prev + delta).toFixed(2))));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plate.trim()) return;

    setIsSubmitting(true);
    try {
      await createTimeLog({
        vehicle_plate: plate.trim().toUpperCase(),
        order_number: orderNumber.trim() || null,
        duration_hours: hours,
        parts: selectedParts,
        description: description.trim() || null,
        logged_at: new Date().toISOString(),
      });

      // Vibración táctil si el dispositivo lo permite
      if (typeof window !== "undefined" && window.navigator?.vibrate) {
        window.navigator.vibrate([40, 60, 40]);
      }

      // Actualizar sugerencias de placas
      const cleanPlate = plate.trim().toUpperCase();
      if (!historicalPlates.includes(cleanPlate)) {
        setHistoricalPlates((prev) => [cleanPlate, ...prev]);
      }

      // Limpiar formulario inmediatamente
      setPlate("");
      setOrderNumber("");
      setHours(1.0);
      setSelectedParts([]);
      setDescription("");
      resetStopwatch();

      setToastMessage("¡Registro guardado con éxito!");
      setTimeout(() => setToastMessage(null), 3000);

      if (onSuccess) onSuccess();
    } catch (err: any) {
      alert("Error al registrar: " + (err.message || err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto pb-24">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-slate-950 font-bold px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce border-2 border-emerald-300">
          <Check className="w-5 h-5 stroke-[3]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Banner de estado Supabase */}
      {!isSupabaseConfigured && (
        <div className="mb-4 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-start gap-2.5 text-amber-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
          <div>
            <span className="font-bold">Modo Almacenamiento Local Activo:</span> Puedes registrar y probar todas las funciones ahora. Cuando configures tu <code className="bg-amber-950/40 px-1 py-0.5 rounded">.env.local</code> con Supabase, los datos se sincronizarán en la nube.
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Placa y Orden */}
        <div className="space-y-2.5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Placa del Vehículo <span className="text-emerald-400">*</span>
            </label>
            <div className="relative">
              <Car className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-6 h-6" />
              <input
                type="text"
                required
                autoComplete="off"
                list="recent-plates-list"
                value={plate}
                onChange={(e) => setPlate(e.target.value.toUpperCase())}
                placeholder="EJ. ABC-123"
                className="w-full pl-13 pr-4 py-3.5 text-2xl font-black bg-slate-800/90 border-2 border-slate-700/80 rounded-2xl focus:border-emerald-500 focus:outline-none uppercase tracking-widest text-slate-100 placeholder:text-slate-600 transition-colors shadow-inner"
              />
              <datalist id="recent-plates-list">
                {historicalPlates.map((item) => (
                  <option key={item} value={item} />
                ))}
              </datalist>
            </div>
          </div>

          <div>
            <input
              type="text"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="Nº de Orden de Trabajo (Opcional)"
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-sm text-slate-200 focus:border-slate-500 focus:outline-none placeholder:text-slate-500"
            />
          </div>
        </div>

        {/* Selector de Horas Táctil */}
        <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-400" /> Horas Invertidas
            </span>
            <span className="text-xs text-slate-400 font-mono">Paso de ±0.5h</span>
          </div>

          {/* Stepper Principal */}
          <div className="flex items-center justify-between gap-3 mb-3">
            <button
              type="button"
              onClick={() => adjustHours(-0.5)}
              aria-label="Restar 30 minutos"
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-700 hover:bg-slate-600 active:scale-95 text-slate-100 flex items-center justify-center transition-transform shadow-md"
            >
              <Minus className="w-7 h-7 stroke-[2.5]" />
            </button>

            <div className="flex-1 text-center py-1 bg-slate-900/60 rounded-xl border border-slate-700/40">
              <div className="text-4xl sm:text-5xl font-black text-emerald-400 font-mono tracking-tight">
                {hours.toFixed(2)}
              </div>
              <div className="text-[11px] uppercase tracking-wider font-bold text-slate-400">
                Horas ({Math.round(hours * 60)} min)
              </div>
            </div>

            <button
              type="button"
              onClick={() => adjustHours(0.5)}
              aria-label="Sumar 30 minutos"
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-700 hover:bg-slate-600 active:scale-95 text-slate-100 flex items-center justify-center transition-transform shadow-md"
            >
              <Plus className="w-7 h-7 stroke-[2.5]" />
            </button>
          </div>

          {/* Presets de un toque */}
          <div className="grid grid-cols-6 gap-1.5 mb-3">
            {QUICK_HOURS.map((qh) => (
              <button
                key={qh}
                type="button"
                onClick={() => setHours(qh)}
                className={`py-2 rounded-xl text-xs font-bold transition-all ${
                  hours === qh
                    ? "bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20"
                    : "bg-slate-700/50 text-slate-300 hover:bg-slate-700"
                }`}
              >
                {qh}h
              </button>
            ))}
          </div>

          {/* Cronómetro Integrado Opcional */}
          <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-semibold text-slate-200">
                ⏱ {formatStopwatch(stopwatchSeconds)}
              </span>
              {stopwatchSeconds > 0 && !stopwatchActive && (
                <button
                  type="button"
                  onClick={applyStopwatchToHours}
                  className="text-[11px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md hover:bg-emerald-500/30 transition-colors font-semibold"
                >
                  Usar tiempo
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {!stopwatchActive ? (
                <button
                  type="button"
                  onClick={() => setStopwatchActive(true)}
                  className="px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 flex items-center gap-1 font-medium transition-colors"
                >
                  <Play className="w-3 h-3 fill-current" /> Iniciar
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setStopwatchActive(false)}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 flex items-center gap-1 font-medium transition-colors"
                >
                  <Pause className="w-3 h-3 fill-current" /> Pausar
                </button>
              )}
              {stopwatchSeconds > 0 && (
                <button
                  type="button"
                  onClick={resetStopwatch}
                  title="Reiniciar cronómetro"
                  className="p-1 rounded-lg bg-slate-700/60 hover:bg-slate-600 text-slate-400 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Chips de Partes Trabajadas (Un Solo Toque) */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
            <Wrench className="w-4 h-4 text-emerald-400" /> Sistema / Partes Trabajadas (1-clic)
          </label>
          <div className="flex flex-wrap gap-2">
            {PART_OPTIONS.map((part) => {
              const active = selectedParts.includes(part);
              return (
                <button
                  key={part}
                  type="button"
                  onClick={() => togglePart(part)}
                  className={`px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all select-none active:scale-95 ${
                    active
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-2 ring-blue-400"
                      : "bg-slate-800 text-slate-300 border border-slate-700/80 hover:bg-slate-750"
                  }`}
                >
                  {part}
                </button>
              );
            })}
          </div>
        </div>

        {/* Descripción / Notas */}
        <div>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detalles adicionales del trabajo (opcional)..."
            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-sm text-slate-200 focus:border-slate-500 focus:outline-none placeholder:text-slate-500 resize-none"
          />
        </div>

        {/* Botón Principal Gigante */}
        <button
          type="submit"
          disabled={isSubmitting || !plate.trim()}
          className="w-full py-4 sm:py-5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xl font-black shadow-xl shadow-emerald-500/20 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          {isSubmitting ? "Guardando..." : "GUARDAR REGISTRO"}
        </button>
      </form>
    </div>
  );
}
