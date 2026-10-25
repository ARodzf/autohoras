import { supabase, isSupabaseConfigured } from "./supabase/client";
import { TimeLog, TimeLogInsert, FilterPeriod } from "@/types/database";

const LOCAL_STORAGE_KEY = "autohoras_time_logs_local";

const INITIAL_MOCK_LOGS: TimeLog[] = [
  {
    id: "mock-1",
    vehicle_plate: "ABC-123",
    order_number: "ORD-101",
    duration_hours: 2.5,
    parts: ["Frenos", "Suspensión"],
    description: "Cambio de pastillas delanteras y rectificado de discos",
    logged_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
  },
  {
    id: "mock-2",
    vehicle_plate: "XYZ-789",
    order_number: "ORD-102",
    duration_hours: 1.5,
    parts: ["Motor", "Mantenimiento"],
    description: "Cambio de aceite sintético 5W-30 y filtro de aire",
    logged_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: "mock-3",
    vehicle_plate: "MNP-456",
    order_number: "ORD-103",
    duration_hours: 4.0,
    parts: ["Transmisión"],
    description: "Desmontaje de caja y cambio de kit de embrague",
    logged_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
  {
    id: "mock-4",
    vehicle_plate: "ABC-123",
    order_number: "ORD-104",
    duration_hours: 0.5,
    parts: ["Diagnóstico", "Eléctrico"],
    description: "Diagnóstico OBD2 por testigo de batería",
    logged_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
];

function getLocalLogs(): TimeLog[] {
  if (typeof window === "undefined") return INITIAL_MOCK_LOGS;
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_MOCK_LOGS));
    return INITIAL_MOCK_LOGS;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return INITIAL_MOCK_LOGS;
  }
}

function saveLocalLogs(logs: TimeLog[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(logs));
  }
}

export async function createTimeLog(entry: TimeLogInsert): Promise<TimeLog> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from("time_logs")
      .insert([entry])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Fallback LocalStorage
  const newLog: TimeLog = {
    ...entry,
    id: "local-" + Date.now(),
    created_at: new Date().toISOString(),
  };
  const current = getLocalLogs();
  saveLocalLogs([newLog, ...current]);
  return newLog;
}

export async function getDistinctPlates(): Promise<string[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from("time_logs")
      .select("vehicle_plate")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.warn("Error cargando placas de Supabase, usando locales:", error);
      return Array.from(new Set(getLocalLogs().map((l) => l.vehicle_plate)));
    }
    return Array.from(new Set(data.map((d) => d.vehicle_plate.toUpperCase())));
  }

  const logs = getLocalLogs();
  return Array.from(new Set(logs.map((l) => l.vehicle_plate.toUpperCase())));
}

export interface FetchFilterOptions {
  searchTerm?: string;
  period?: FilterPeriod;
  selectedPart?: string;
}

export async function fetchLogs(options: FetchFilterOptions = {}): Promise<TimeLog[]> {
  const { searchTerm = "", period = "all", selectedPart = "" } = options;

  if (isSupabaseConfigured && supabase) {
    let query = supabase
      .from("time_logs")
      .select("*")
      .order("logged_at", { ascending: false });

    const now = new Date();
    if (period === "today") {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      query = query.gte("logged_at", startOfDay);
    } else if (period === "week") {
      const startOfWeek = new Date(now);
      const day = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Lunes
      startOfWeek.setDate(diff);
      startOfWeek.setHours(0, 0, 0, 0);
      query = query.gte("logged_at", startOfWeek.toISOString());
    } else if (period === "month") {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      query = query.gte("logged_at", startOfMonth);
    }

    if (selectedPart) {
      query = query.contains("parts", [selectedPart]);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.trim();
      query = query.or(
        `vehicle_plate.ilike.%${term}%,order_number.ilike.%${term}%,description.ilike.%${term}%`
      );
    }

    const { data, error } = await query;
    if (error) {
      console.error("Error al consultar Supabase:", error);
      throw error;
    }
    return data || [];
  }

  // Filtrado en memoria / LocalStorage
  let logs = getLocalLogs();

  const now = new Date();
  if (period === "today") {
    const todayStr = now.toISOString().slice(0, 10);
    logs = logs.filter((l) => l.logged_at.slice(0, 10) === todayStr);
  } else if (period === "week") {
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    logs = logs.filter((l) => new Date(l.logged_at) >= sevenDaysAgo);
  } else if (period === "month") {
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    logs = logs.filter((l) => new Date(l.logged_at) >= thirtyDaysAgo);
  }

  if (selectedPart) {
    logs = logs.filter((l) => l.parts && l.parts.includes(selectedPart));
  }

  if (searchTerm.trim()) {
    const term = searchTerm.toLowerCase().trim();
    logs = logs.filter(
      (l) =>
        l.vehicle_plate.toLowerCase().includes(term) ||
        (l.order_number && l.order_number.toLowerCase().includes(term)) ||
        (l.description && l.description.toLowerCase().includes(term)) ||
        (l.parts && l.parts.some((p) => p.toLowerCase().includes(term)))
    );
  }

  return logs.sort(
    (a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime()
  );
}

export async function deleteTimeLog(id: string): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from("time_logs").delete().eq("id", id);
    if (error) throw error;
    return true;
  }

  const logs = getLocalLogs().filter((l) => l.id !== id);
  saveLocalLogs(logs);
  return true;
}
