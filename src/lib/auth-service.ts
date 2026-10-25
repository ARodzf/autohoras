import { AuthUser } from "@/types/database";
import { supabase, isSupabaseConfigured } from "./supabase/client";

const AUTH_STORAGE_KEY = "autohoras_session_user";

export const DEFAULT_PRESET_USERS: AuthUser[] = [
  { id: "tech-1", name: "Carlos Mendoza", role: "tecnico" },
  { id: "tech-2", name: "Andrés Silva", role: "tecnico" },
  { id: "tech-3", name: "Javier Morales", role: "tecnico" },
  { id: "tech-4", name: "Supervisor Taller", role: "admin" },
];

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function saveStoredUser(user: AuthUser | null) {
  if (typeof window === "undefined") return;
  if (!user) {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } else {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  }
}

export async function loginWithQuickProfile(user: AuthUser): Promise<AuthUser> {
  saveStoredUser(user);
  return user;
}

export async function loginWithCredentials(email: string, password: string): Promise<AuthUser> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    
    const user: AuthUser = {
      id: data.user.id,
      name: data.user.user_metadata?.name || data.user.email?.split("@")[0] || "Técnico",
      email: data.user.email,
      role: "tecnico",
    };
    saveStoredUser(user);
    return user;
  }

  // Si no hay Supabase configurado, simular autenticación rápida
  const user: AuthUser = {
    id: "user-" + Date.now(),
    name: email.split("@")[0] || "Técnico",
    email,
    role: "tecnico",
  };
  saveStoredUser(user);
  return user;
}

export async function logout(): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    await supabase.auth.signOut().catch(() => {});
  }
  saveStoredUser(null);
}
