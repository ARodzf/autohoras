import { AuthUser } from "@/types/database";
import { supabase, isSupabaseConfigured } from "./supabase/client";

const AUTH_STORAGE_KEY = "autohoras_session_user";
const TECHNICIANS_STORAGE_KEY = "autohoras_workshop_technicians";

export function getWorkshopTechnicians(): AuthUser[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(TECHNICIANS_STORAGE_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function saveWorkshopTechnicians(techs: AuthUser[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(TECHNICIANS_STORAGE_KEY, JSON.stringify(techs));
  }
}

export function addWorkshopTechnician(name: string, role: "tecnico" | "admin" = "tecnico"): AuthUser {
  const newTech: AuthUser = {
    id: "tech-" + Date.now(),
    name: name.trim(),
    role,
  };
  const list = getWorkshopTechnicians();
  const updated = [...list, newTech];
  saveWorkshopTechnicians(updated);
  return newTech;
}

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

    if (data.session && data.user) {
      const user: AuthUser = {
        id: data.user.id,
        name: name.trim(),
        email: data.user.email,
        role: "tecnico",
      };
      saveStoredUser(user);
      // Guardar también en la lista de técnicos locales
      addWorkshopTechnician(name.trim());
      return { user, requiresEmailConfirmation: false };
    }

    return { user: null, requiresEmailConfirmation: true };
  }

  const user: AuthUser = {
    id: "user-" + Date.now(),
    name: name.trim(),
    email,
    role: "tecnico",
  };
  saveStoredUser(user);
  addWorkshopTechnician(name.trim());
  return { user, requiresEmailConfirmation: false };
}

export async function logout(): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    await supabase.auth.signOut().catch(() => {});
  }
  saveStoredUser(null);
}
