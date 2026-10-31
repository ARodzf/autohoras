export interface TimeLog {
  id: string;
  vehicle_plate?: string | null;
  order_number?: string | null;
  duration_minutes: number;
  duration_hours: number;
  description?: string | null;
  technician_name?: string | null;
  category?: string;
  parts?: string[];
  logged_at: string;
  created_at: string;
  user_id?: string | null;
}

export type TimeLogInsert = {
  vehicle_plate?: string | null;
  order_number?: string | null;
  duration_minutes: number;
  description?: string | null;
  technician_name?: string | null;
  category?: string;
  parts?: string[];
  logged_at?: string;
  user_id?: string | null;
};

export type FilterPeriod = "today" | "week" | "month" | "all";

export interface AuthUser {
  id: string;
  username?: string;
  name: string;
  email?: string;
  role: "tecnico" | "admin";
}

/**
 * Convierte minutos a formato humano legible y natural:
 * 30 -> "30 min"
 * 60 -> "1h"
 * 90 -> "1h 30 min"
 * 120 -> "2h"
 * 135 -> "2h 15 min"
 */
export function formatDurationHuman(minutes: number): string {
  if (!minutes || minutes <= 0) return "0 min";
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);

  if (h === 0) {
    return `${m} min`;
  }
  if (m === 0) {
    return `${h}h`;
  }
  return `${h}h ${m} min`;
}

/**
 * Convierte un valor de horas decimales (ej. 1.5, "2", "0.75") a minutos enteros
 */
export function parseHoursToMinutes(val: number | string): number {
  if (typeof val === "string") {
    // Manejar formato "1:30" si el técnico escribe con dos puntos
    if (val.includes(":")) {
      const parts = val.split(":");
      const hours = parseInt(parts[0], 10) || 0;
      const mins = parseInt(parts[1], 10) || 0;
      return Math.max(1, hours * 60 + mins);
    }
    // Reemplazar comas por puntos (ej. "1,5" -> "1.5")
    const normalized = val.replace(",", ".");
    const num = parseFloat(normalized);
    if (isNaN(num) || num <= 0) return 0;
    return Math.max(1, Math.round(num * 60));
  }
  if (isNaN(val) || val <= 0) return 0;
  return Math.max(1, Math.round(val * 60));
}
