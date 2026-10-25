import { supabase, isSupabaseConfigured } from "./supabase/client";
import { TimeLog, TimeLogInsert, FilterPeriod, WorkCategory } from "@/types/database";

const LOCAL_STORAGE_KEY = "autohoras_time_logs_v2";

const INITIAL_MOCK_LOGS: TimeLog[] = [
  {
    id: "mock-1",
    vehicle_plate: "ABC-123",
    order_number: "ORD-101",
    category: "exterior",
    duration_minutes: 90, // 1h 30 min
    duration_hours: 1.5,
    parts: ["Parachoques Delantero", "Faros"],
    description: "Desarme para pintura y alineación",
    technician_name: "Carlos Mendoza",
    logged_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: "mock-2",
    vehicle_plate: null,
    order_number: "ORD-102",
    category: "interior",
    duration_minutes: 60, // 1h
    duration_hours: 1.0,
    parts: ["Paneles de Puerta", "Consola"],
    description: "Desmontaje completo de molduras internas",
    technician_name: "Andrés Silva",
    logged_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: "mock-3",
    vehicle_plate: "XYZ-789",
    order_number: null,
    category: "mecanica",
    duration_minutes: 30, // 30 min
    duration_hours: 0.5,
    parts: ["Frenos"],
    description: "Revisión rápida de pastillas y discos",
    technician_name: "Carlos Mendoza",
    logged_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
  {
    id: "mock-4",
    vehicle_plate: "MNP-456",
    order_number: "ORD-105",
    category: "exterior",
    duration_minutes: 120, // 2h
    duration_hours: 2.0,
    parts: ["Capó", "Guardabarros"],
    description: "Desarme estético de piezas frontales",
    technician_name: "Javier Morales",
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
  const duration_hours = parseFloat((entry.duration_minutes / 60).toFixed(2));

  if (isSupabaseConfigured && supabase) {
    const payload = {
      vehicle_plate: entry.vehicle_plate || null,
      order_number: entry.order_number || null,
      category: entry.category,
      duration_minutes: entry.duration_minutes,
      parts: entry.parts,
      description: entry.description || null,
      technician_name: entry.technician_name || null,
      logged_at: entry.logged_at || new Date().toISOString(),
      user_id: entry.user_id || null,
    };

    const { data, error } = await supabase
      .from("time_logs")
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Modo LocalStorage
  const newLog: TimeLog = {
    id: "local-" + Date.now(),
    vehicle_plate: entry.vehicle_plate || null,
    order_number: entry.order_number || null,
    category: entry.category,
    duration_minutes: entry.duration_minutes,
    duration_hours,
    parts: entry.parts,
    description: entry.description || null,
    technician_name: entry.technician_name || null,
    logged_at: entry.logged_at || new Date().toISOString(),
    created_at: new Date().toISOString(),
  };

  const current = getLocalLogs();
  saveLocalLogs([newLog, ...current]);
  return newLog;
}

export async function getDistinctIdentifiers(): Promise<{ plates: string[]; orders: string[] }> {
  if (isSupabaseConfigured && supabase) {
    const { data } = await supabase
      .from("time_logs")
      .select("vehicle_plate, order_number")
      .order("created_at", { ascending: false })
      .limit(50);

    if (data) {
      const plates = Array.from(new Set(data.map((d) => d.vehicle_plate).filter(Boolean)));
      const orders = Array.from(new Set(data.map((d) => d.order_number).filter(Boolean)));
      return { plates: plates as string[], orders: orders as string[] };
    }
  }

  const logs = getLocalLogs();
  const plates = Array.from(new Set(logs.map((l) => l.vehicle_plate).filter(Boolean))) as string[];
  const orders = Array.from(new Set(logs.map((l) => l.order_number).filter(Boolean))) as string[];
  return { plates, orders };
}

export interface FetchFilterOptions {
  searchTerm?: string;
  period?: FilterPeriod;
  category?: WorkCategory | "all";
}

export async function fetchLogs(options: FetchFilterOptions = {}): Promise<TimeLog[]> {
  const { searchTerm = "", period = "all", category = "all" } = options;

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
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
      startOfWeek.setDate(diff);
      startOfWeek.setHours(0, 0, 0, 0);
      query = query.gte("logged_at", startOfWeek.toISOString());
    } else if (period === "month") {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      query = query.gte("logged_at", startOfMonth);
    }

    if (category !== "all") {
      query = query.eq("category", category);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.trim();
      query = query.or(
        `vehicle_plate.ilike.%${term}%,order_number.ilike.%${term}%,description.ilike.%${term}%,technician_name.ilike.%${term}%`
      );
    }

    const { data, error } = await query;
    if (error) {
      console.error("Error al consultar Supabase:", error);
      throw error;
    }
    return (data || []).map((d) => ({
      ...d,
      duration_hours: Number(d.duration_hours) || parseFloat((d.duration_minutes / 60).toFixed(2)),
    }));
  }

  // Filtrado en LocalStorage
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

  if (category !== "all") {
    logs = logs.filter((l) => l.category === category);
  }

  if (searchTerm.trim()) {
    const term = searchTerm.toLowerCase().trim();
    logs = logs.filter(
      (l) =>
        (l.vehicle_plate && l.vehicle_plate.toLowerCase().includes(term)) ||
        (l.order_number && l.order_number.toLowerCase().includes(term)) ||
        (l.description && l.description.toLowerCase().includes(term)) ||
        (l.technician_name && l.technician_name.toLowerCase().includes(term)) ||
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
