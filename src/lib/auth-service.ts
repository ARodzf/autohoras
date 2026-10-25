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

  // Fallback si no está conectado aún a Supabase
  const user: AuthUser = {
    id: "user-" + Date.now(),
    name: email.split("@")[0] || "Técnico",
    email,
    role: "tecnico",
  };
  saveStoredUser(user);
  return user;
}

export async function signUpWithCredentials(
  name: string,
  email: string,
  password: string
): Promise<{ user: AuthUser | null; requiresEmailConfirmation: boolean }> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name.trim(),
        },
      },
    });

    if (error) throw error;

    // Si Supabase tiene desactivada la confirmación por correo, la sesión viene activa
    if (data.session && data.user) {
      const user: AuthUser = {
        id: data.user.id,
        name: name.trim(),
        email: data.user.email,
        role: "tecnico",
      };
      saveStoredUser(user);
      return { user, requiresEmailConfirmation: false };
    }

    return { user: null, requiresEmailConfirmation: true };
  }

  // Modo local
  const user: AuthUser = {
    id: "user-" + Date.now(),
    name: name.trim(),
    email,
    role: "tecnico",
  };
  saveStoredUser(user);
  return { user, requiresEmailConfirmation: false };
}

export async function logout(): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    await supabase.auth.signOut().catch(() => {});
  }
  saveStoredUser(null);
}
