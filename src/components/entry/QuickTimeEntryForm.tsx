"use client";

import React, { useState, useEffect, useRef } from "react";
import { Plus, Minus, Check, Car, Clock, Wrench, Play, Pause, RotateCcw, Hash, Layers } from "lucide-react";
import { createTimeLog, getDistinctIdentifiers } from "@/lib/time-logs-service";
import { WorkCategory, formatDurationHuman, AuthUser } from "@/types/database";

const CATEGORIES: { id: WorkCategory; label: string; icon: string; desc: string }[] = [
  { id: "exterior", label: "Exterior (Estética)", icon: "🚗", desc: "Desarme de piezas por fuera" },
  { id: "interior", label: "Interior", icon: "🛋️", desc: "Desarme de habitáculo y paneles" },
  { id: "mecanica", label: "Mecánica", icon: "🔧", desc: "Tren motriz, frenos y componentes" },
];

const PARTS_BY_CATEGORY: Record<WorkCategory, string[]> = {
  exterior: [
    "Parachoques Delantero",
    "Parachoques Trasero",
    "Capó",
    "Maletero / Compuerta",
    "Puerta Del. Izq.",
    "Puerta Del. Der.",
    "Puerta Tras. Izq.",
    "Puerta Tras. Der.",
    "Guardabarros",
    "Faros / Ópticas",
    "Espejos Retrovisores",
    "Molduras / Estribos",
    "Techo / Parrilla",
  ],
  interior: [
    "Paneles de Puerta",
    "Tablero Principal",
    "Consola Central",
    "Asientos Delanteros",
    "Asientos Traseros",
    "Tapicería Techo",
    "Guantera y Molduras",
  ],
  mecanica: [
    "Frenos",
    "Suspensión",
    "Motor",
    "Escape",
    "Transmisión",
    "Batería / Eléctrico",
    "Radiador / Enfriamiento",
  ],
};

const PRESET_MINUTES = [
  { label: "15 min", value: 15 },
  { label: "30 min", value: 30 },
  { label: "45 min", value: 45 },
  { label: "1h", value: 60 },
  { label: "1h 30 min", value: 90 },
  { label: "2h", value: 120 },
  { label: "3h", value: 180 },
  { label: "4h", value: 240 },
];

interface QuickTimeEntryFormProps {
  currentUser?: AuthUser | null;
  onSuccess?: () => void;
}

export default function QuickTimeEntryForm({ currentUser, onSuccess }: QuickTimeEntryFormProps) {
  // Identificación del vehículo: Placa o Nº de Orden
  const [idType, setIdType] = useState<"plate" | "order">("plate");
  const [plate, setPlate] = useState("");
  const [orderNumber, setOrderNumber] = useState("");

  // Categoría activa
  const [category, setCategory] = useState<WorkCategory>("exterior");

  // Tiempo en minutos exactos (por defecto 60 min = 1h)
  const [durationMinutes, setDurationMinutes] = useState<number>(60);

  // Partes seleccionadas y notas
  const [selectedParts, setSelectedParts] = useState<string[]>([]);
  const [description, setDescription] = useState("");

  // Sugerencias históricas
  const [historySuggestions, setHistorySuggestions] = useState<{ plates: string[]; orders: string[] }>({
    plates: [],
    orders: [],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Cronómetro opcional
  const [stopwatchActive, setStopwatchActive] = useState(false);
  const [stopwatchSeconds, setStopwatchSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    getDistinctIdentifiers().then(setHistorySuggestions).catch(console.error);
  }, []);

  // Cronómetro
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

  const applyStopwatch = () => {
    setStopwatchActive(false);
    const mins = Math.max(15, Math.round(stopwatchSeconds / 60));
    setDurationMinutes(mins);
  };

  const adjustMinutes = (delta: number) => {
    setDurationMinutes((prev) => Math.max(15, prev + delta));
  };

  const togglePart = (part: string) => {
    setSelectedParts((prev) =>
      prev.includes(part) ? prev.filter((p) => p !== part) : [...prev, part]
    );
  };

  const hasValidIdentifier = Boolean(plate.trim() || orderNumber.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasValidIdentifier) {
      alert("Por favor ingresa la Placa o el Número de Orden.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createTimeLog({
        vehicle_plate: plate.trim() ? plate.trim().toUpperCase() : null,
        order_number: orderNumber.trim() ? orderNumber.trim().toUpperCase() : null,
        category,
        duration_minutes: durationMinutes,
        parts: selectedParts,
        description: description.trim() || null,
        technician_name: currentUser?.name || null,
        logged_at: new Date().toISOString(),
      });

      if (typeof window !== "undefined" && window.navigator?.vibrate) {
        window.navigator.vibrate([35, 45, 35]);
      }

      // Limpiar formulario suavemente
      setPlate("");
      setOrderNumber("");
      setSelectedParts([]);
      setDescription("");
      setDurationMinutes(60);
      setStopwatchSeconds(0);
      setStopwatchActive(false);

      setToastMessage("¡Registro guardado!");
      setTimeout(() => setToastMessage(null), 2500);

      if (onSuccess) onSuccess();
    } catch (err: any) {
      alert("Error al guardar: " + (err.message || err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto pb-28">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-zinc-950 font-black px-6 py-3 rounded-2xl shadow-xl flex items-center gap-2 border border-emerald-300 animate-in fade-in slide-in-from-top-4 duration-200">
          <Check className="w-5 h-5 stroke-[3]" />
          <span>{toastMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 1. SELECCIÓN DE VEHÍCULO (Placa o Nº de Orden) */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Car className="w-4 h-4 text-blue-400" /> Identificación del Vehículo
            </span>
            {/* Alternador rápido Placa / Orden */}
            <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800">
              <button
                type="button"
                onClick={() => setIdType("plate")}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  idType === "plate"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Placa
              </button>
              <button
                type="button"
                onClick={() => setIdType("order")}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  idType === "order"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Nº Orden
              </button>
            </div>
          </div>

          {idType === "plate" ? (
            <div>
              <input
                type="text"
                autoComplete="off"
                list="plate-suggestions"
                value={plate}
                onChange={(e) => setPlate(e.target.value.toUpperCase())}
                placeholder="EJ. ABC-123"
                className="w-full px-4 py-3.5 text-2xl font-black bg-zinc-950 border-2 border-zinc-800 rounded-2xl focus:border-blue-500 focus:outline-none uppercase tracking-widest text-zinc-100 placeholder:text-zinc-600 text-center"
              />
              <datalist id="plate-suggestions">
                {historySuggestions.plates.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
              <div className="flex justify-between items-center mt-2 px-1 text-[11px] text-zinc-500">
                <span>¿No tiene placa?</span>
                <button
                  type="button"
                  onClick={() => setIdType("order")}
                  className="text-blue-400 hover:underline font-semibold"
                >
                  Usar Número de Orden
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="relative">
                <Hash className="w-5 h-5 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  autoComplete="off"
                  list="order-suggestions"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                  placeholder="EJ. ORD-1054"
                  className="w-full pl-11 pr-4 py-3.5 text-2xl font-black bg-zinc-950 border-2 border-zinc-800 rounded-2xl focus:border-blue-500 focus:outline-none uppercase tracking-wider text-zinc-100 placeholder:text-zinc-600 text-center"
                />
                <datalist id="order-suggestions">
                  {historySuggestions.orders.map((o) => (
                    <option key={o} value={o} />
                  ))}
                </datalist>
              </div>
              <div className="flex justify-between items-center mt-2 px-1 text-[11px] text-zinc-500">
                <span>¿Tiene placa identificable?</span>
                <button
                  type="button"
                  onClick={() => setIdType("plate")}
                  className="text-blue-400 hover:underline font-semibold"
                >
                  Usar Placa
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 2. APARTADO DE HORAS Y MINUTOS ENTENDIBLE */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-400" /> Tiempo Invertido
            </span>
            <span className="text-xs text-zinc-400 font-mono">
              {(durationMinutes / 60).toFixed(2)}h equivalentes
            </span>
          </div>

          {/* Display Grande y Claro de Horas y Minutos */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => adjustMinutes(-15)}
                className="w-12 h-14 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-300 font-bold text-xs flex flex-col items-center justify-center transition-all cursor-pointer active:scale-95"
                title="Restar 15 min"
              >
                <Minus className="w-4 h-4 mb-0.5" />
                <span>15m</span>
              </button>
              <button
                type="button"
                onClick={() => adjustMinutes(-30)}
                className="w-12 h-14 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-300 font-bold text-xs flex flex-col items-center justify-center transition-all cursor-pointer active:scale-95"
                title="Restar 30 min"
              >
                <Minus className="w-4 h-4 mb-0.5" />
                <span>30m</span>
              </button>
            </div>

            {/* Tiempo en texto humano: "30 min", "1h", "1h 30 min" */}
            <div className="flex-1 text-center py-2 px-3 bg-zinc-950 rounded-2xl border border-zinc-800 shadow-inner">
              <div className="text-3xl sm:text-4xl font-black text-amber-400 font-mono tracking-tight">
                {formatDurationHuman(durationMinutes)}
              </div>
              <div className="text-[11px] uppercase tracking-wider font-semibold text-zinc-500 mt-0.5">
                {durationMinutes} minutos totales
              </div>
            </div>

            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => adjustMinutes(15)}
                className="w-12 h-14 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-300 font-bold text-xs flex flex-col items-center justify-center transition-all cursor-pointer active:scale-95"
                title="Sumar 15 min"
              >
                <Plus className="w-4 h-4 mb-0.5" />
                <span>15m</span>
              </button>
              <button
                type="button"
                onClick={() => adjustMinutes(30)}
                className="w-12 h-14 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-300 font-bold text-xs flex flex-col items-center justify-center transition-all cursor-pointer active:scale-95"
                title="Sumar 30 min"
              >
                <Plus className="w-4 h-4 mb-0.5" />
                <span>30m</span>
              </button>
            </div>
          </div>

          {/* Botones rápidos de selección directa */}
          <div className="grid grid-cols-4 gap-2">
            {PRESET_MINUTES.map((item) => {
              const isSelected = durationMinutes === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setDurationMinutes(item.value)}
                  className={`py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer select-none active:scale-95 ${
                    isSelected
                      ? "bg-amber-400 text-zinc-950 font-black shadow-md shadow-amber-400/20"
                      : "bg-zinc-800/80 text-zinc-300 hover:bg-zinc-800 border border-zinc-750"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Cronómetro Opcional Rápido */}
          <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
            <span className="font-mono text-zinc-300">
              ⏱ {Math.floor(stopwatchSeconds / 60)}m {stopwatchSeconds % 60}s
            </span>
            <div className="flex items-center gap-1.5">
              {!stopwatchActive ? (
                <button
                  type="button"
                  onClick={() => setStopwatchActive(true)}
                  className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 flex items-center gap-1 font-medium transition-colors cursor-pointer"
                >
                  <Play className="w-3 h-3 fill-current" /> Iniciar
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setStopwatchActive(false)}
                  className="px-2.5 py-1 rounded-lg bg-amber-400/20 text-amber-300 hover:bg-amber-400/30 flex items-center gap-1 font-medium transition-colors cursor-pointer"
                >
                  <Pause className="w-3 h-3 fill-current" /> Pausar
                </button>
              )}
              {stopwatchSeconds > 0 && (
                <>
                  <button
                    type="button"
                    onClick={applyStopwatch}
                    className="text-[11px] bg-blue-600/30 text-blue-300 px-2 py-1 rounded-lg font-bold hover:bg-blue-600/40 transition-colors cursor-pointer"
                  >
                    Usar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStopwatchActive(false);
                      setStopwatchSeconds(0);
                    }}
                    className="p-1 text-zinc-500 hover:text-zinc-300"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 3. CATEGORÍAS (Exterior Desarme / Interior / Mecánica) */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 sm:p-5 shadow-sm space-y-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-blue-400" /> Área de Intervención
          </span>

          <div className="grid grid-cols-3 gap-2">
            {CATEGORIES.map((cat) => {
              const active = category === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setCategory(cat.id);
                    setSelectedParts([]);
                  }}
                  className={`p-3 rounded-2xl text-center transition-all cursor-pointer select-none active:scale-95 border ${
                    active
                      ? "bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-600/30 font-black"
                      : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200"
                  }`}
                >
                  <div className="text-xl mb-1">{cat.icon}</div>
                  <div className="text-xs font-bold leading-tight">{cat.label}</div>
                </button>
              );
            })}
          </div>

          {/* Chips de Partes de Desarme Estético / Piezas */}
          <div className="pt-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-blue-400" /> Piezas desarmadas / intervenidas (1-clic)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PARTS_BY_CATEGORY[category].map((part) => {
                const active = selectedParts.includes(part);
                return (
                  <button
                    key={part}
                    type="button"
                    onClick={() => togglePart(part)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all select-none cursor-pointer active:scale-95 ${
                      active
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20 ring-1 ring-indigo-400"
                        : "bg-zinc-950 text-zinc-300 border border-zinc-800 hover:border-zinc-700"
                    }`}
                  >
                    {part}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 4. NOTAS ADICIONALES */}
        <div>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Observaciones de desmontaje, estado de piezas o grapas..."
            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-xs text-zinc-200 focus:border-blue-500 focus:outline-none placeholder:text-zinc-500 resize-none"
          />
        </div>

        {/* BOTÓN PRINCIPAL */}
        <button
          type="submit"
          disabled={isSubmitting || !hasValidIdentifier}
          className="w-full py-4 sm:py-5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white text-lg font-black shadow-xl shadow-blue-600/25 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer tracking-wide"
        >
          {isSubmitting ? "GUARDANDO REGISTRO..." : "GUARDAR REGISTRO"}
        </button>
      </form>
    </div>
  );
}
