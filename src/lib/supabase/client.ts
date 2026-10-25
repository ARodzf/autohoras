import { createClient, SupabaseClient } from "@supabase/supabase-js";

let rawUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
// Normalizar en caso de que venga con /rest/v1 o trailing slash
if (rawUrl.includes(".supabase.co")) {
  rawUrl = rawUrl.split(".supabase.co")[0] + ".supabase.co";
}

const supabaseUrl = rawUrl;
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith("http") &&
  !supabaseUrl.includes("tu-proyecto")
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;
