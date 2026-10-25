export interface TimeLog {
  id: string;
  vehicle_plate: string;
  order_number: string | null;
  duration_hours: number;
  parts: string[];
  description: string | null;
  logged_at: string;
  created_at: string;
  user_id?: string | null;
}

export type TimeLogInsert = Omit<TimeLog, "id" | "created_at">;

export type FilterPeriod = "today" | "week" | "month" | "all";
