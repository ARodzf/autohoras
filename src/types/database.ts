export type WorkCategory = "exterior" | "interior" | "mecanica";

export interface TimeLog {
  id: string;
  vehicle_plate?: string | null;
  order_number?: string | null;
  category: WorkCategory;
  duration_minutes: number;
  duration_hours: number;
  parts: string[];
  description?: string | null;
  technician_name?: string | null;
  logged_at: string;
  created_at: string;
  user_id?: string | null;
}

export type TimeLogInsert = {
  vehicle_plate?: string | null;
  order_number?: string | null;
  category: WorkCategory;
  duration_minutes: number;
  parts: string[];
  description?: string | null;
  technician_name?: string | null;
  logged_at?: string;
  user_id?: string | null;
};

export type FilterPeriod = "today" | "week" | "month" | "all";

export interface AuthUser {
  id: string;
  name: string;
  email?: string;
  role: "tecnico" | "admin";
}

/**
 * Convierte minutos a texto amigable:
 * 30 -> "30 min"
 * 60 -> "1h"
 * 90 -> "1h 30 min"
 * 105 -> "1h 45 min"
 */
export function formatDurationHuman(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;

  if (h === 0) {
    return `${m} min`;
  }
  if (m === 0) {
    return `${h}h`;
  }
  return `${h}h ${m} min`;
}
