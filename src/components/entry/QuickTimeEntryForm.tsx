"use client";

import React, { useState, useEffect } from "react";
import { Check, Car, Clock, Hash, FileText } from "lucide-react";
import { createTimeLog, getDistinctIdentifiers } from "@/lib/time-logs-service";
import { AuthUser, formatDurationHuman, parseHoursToMinutes } from "@/types/database";

interface QuickTimeEntryFormProps {
  currentUser?: AuthUser | null;
  onSuccess?: () => void;
}

export default function QuickTimeEntryForm({ currentUser, onSuccess }: QuickTimeEntryFormProps) {
  // Identificación del vehículo: Placa o Nº de Orden
  const [idType, setIdType] = useState<"plate" | "order">("plate");
  const [plate, setPlate] = useState("");
  const [orderNumber, setOrderNumber] = useState("");

  // Entrada de horas a mano con teclado numérico
  const [hoursInput, setHoursInput] = useState<string>("1");
  const [description, setDescription] = useState("");

  // Sugerencias de vehículos previos
  const [historySuggestions, setHistorySuggestions] = useState<{ plates: string[]; orders: string[] }>({
    plates: [],
    orders: [],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    getDistinctIdentifiers().then(setHistorySuggestions).catch(console.error);
  }, []);

  // Calcular minutos en tiempo real mientras el mecánico escribe
  const calculatedMinutes = parseHoursToMinutes(hoursInput);

  const hasValidIdentifier = Boolean(plate.trim() || orderNumber.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasValidIdentifier) {
      alert("Por favor ingresa la Placa o el Número de Orden del vehículo.");
      return;
    }

    if (!calculatedMinutes || calculatedMinutes <= 0) {
      alert("Por favor introduce las horas trabajadas con el teclado numérico.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createTimeLog({
        vehicle_plate: plate.trim() ? plate.trim().toUpperCase() : null,
        order_number: orderNumber.trim() ? orderNumber.trim().toUpperCase() : null,
        duration_minutes: calculatedMinutes,
        description: description.trim() || null,
        technician_name: currentUser?.name || null,
        logged_at: new Date().toISOString(),
      });

      // Vibración táctil si el teléfono lo permite
      if (typeof window !== "undefined" && window.navigator?.vibrate) {
        window.navigator.vibrate([35, 45, 35]);
      }

      // Limpiar formulario inmediatamente
      setPlate("");
      setOrderNumber("");
      setDescription("");
      setHoursInput("1");

      setToastMessage("¡Registro guardado con éxito!");
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
      {/* Toast de confirmación */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-zinc-950 font-black px-6 py-3 rounded-2xl shadow-xl flex items-center gap-2 border border-emerald-300 animate-in fade-in slide-in-from-top-4 duration-200">
          <Check className="w-5 h-5 stroke-[3]" />
          <span>{toastMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 1. IDENTIFICACIÓN: PLACA O NÚMERO DE ORDEN */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Car className="w-4 h-4 text-blue-400" /> Vehículo
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
                Nº de Orden
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
            </div>
          )}
        </div>

        {/* 2. ENTRADA MANUAL DE HORAS CON TECLADO NUMÉRICO NATIVO */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-400" /> Horas Invertidas (A mano)
            </span>
            <span className="text-xs text-zinc-400 font-mono">Teclado numérico</span>
          </div>

          <div className="bg-zinc-950 border-2 border-zinc-800 focus-within:border-amber-400 rounded-2xl p-4 transition-colors">
            {/* Input con teclado numérico nativo del dispositivo */}
            <div className="flex items-center justify-center gap-2">
              <input
                type="text"
                inputMode="decimal"
                pattern="[0-9]*[.,:]?[0-9]*"
                autoComplete="off"
                value={hoursInput}
                onChange={(e) => setHoursInput(e.target.value)}
                placeholder="1.5"
                className="w-40 text-center text-5xl sm:text-6xl font-black text-amber-400 font-mono bg-transparent focus:outline-none tracking-tight"
              />
              <span className="text-2xl font-bold text-zinc-500 font-mono">hrs</span>
            </div>

            {/* Traducción automática a tiempo entendible (30 min, 1h, 1h 30 min...) */}
            <div className="text-center mt-3 pt-3 border-t border-zinc-850 border-zinc-800/80">
              <span className="text-xs text-zinc-400 uppercase tracking-wider font-semibold mr-2">
                Equivale a:
              </span>
              <span className="inline-block bg-amber-400/10 text-amber-400 border border-amber-400/30 px-3 py-1 rounded-xl text-base font-black font-mono">
                {formatDurationHuman(calculatedMinutes)}
              </span>
            </div>
          </div>

          {/* Accesos rápidos de 1 toque para horas comunes (opcional y cómodo) */}
          <div className="grid grid-cols-4 gap-1.5 pt-1">
            {[
              { label: "0.5 (30m)", val: "0.5" },
              { label: "1.0 (1h)", val: "1" },
              { label: "1.5 (1h30m)", val: "1.5" },
              { label: "2.0 (2h)", val: "2" },
            ].map((preset) => (
              <button
                key={preset.val}
                type="button"
                onClick={() => setHoursInput(preset.val)}
                className={`py-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                  hoursInput === preset.val
                    ? "bg-amber-400 text-zinc-950 font-black"
                    : "bg-zinc-800/60 text-zinc-300 hover:bg-zinc-800"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3. NOTAS / DETALLE DEL TRABAJO (OPCIONAL) */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 shadow-sm space-y-2">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-zinc-500" /> Notas o Trabajo Realizado (Opcional)
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ej. Desarme de piezas frontales, alineación o detalle breve..."
            className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-2xl text-xs text-zinc-200 focus:border-blue-500 focus:outline-none placeholder:text-zinc-600 resize-none transition-colors"
          />
        </div>

        {/* 4. BOTÓN PRINCIPAL: GUARDAR REGISTRO */}
        <button
          type="submit"
          disabled={isSubmitting || !hasValidIdentifier || calculatedMinutes <= 0}
          className="w-full py-4 sm:py-5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-lg font-black shadow-xl shadow-blue-600/25 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer tracking-wide"
        >
          {isSubmitting ? "GUARDANDO..." : "GUARDAR REGISTRO"}
        </button>
      </form>
    </div>
  );
}
