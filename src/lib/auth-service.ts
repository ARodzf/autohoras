import { AuthUser } from "@/types/database";
import { supabase, isSupabaseConfigured } from "./supabase/client";

const AUTH_STORAGE_KEY = "autohoras_session_user";
const LOCAL_USERS_KEY = "autohoras_workshop_users_v2";

interface StoredWorkshopUser {
  id: string;
  username: string;
  name: string;
  password: string;
  role: "tecnico" | "admin";
}

function getLocalUsers(): StoredWorkshopUser[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(LOCAL_USERS_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

function saveLocalUsers(users: StoredWorkshopUser[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
  }
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

/**
 * Iniciar sesión con usuario o correo y contraseña
 */
export async function loginWithCredentials(
  identifier: string,
  password: string
): Promise<AuthUser> {
  const cleanId = identifier.trim().toLowerCase();
  const cleanPass = password.trim();

  // 1. Intentar autenticar en tabla 'workshop_users' de Supabase (si existe)
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("workshop_users")
        .select("*")
        .eq("username", cleanId)
        .eq("password", cleanPass)
        .maybeSingle();

      if (!error && data) {
        const user: AuthUser = {
          id: data.id,
          username: data.username,
          name: data.name,
          role: data.role || "tecnico",
        };
        saveStoredUser(user);
        return user;
      }

      // Si no coincidió o la tabla no existe, y parece un correo válido con @, intentar Supabase Auth
      if (cleanId.includes("@")) {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: cleanId,
          password: cleanPass,
        });

        if (!authError && authData.user) {
          const user: AuthUser = {
            id: authData.user.id,
            username: cleanId,
            name: authData.user.user_metadata?.name || cleanId.split("@")[0],
            email: authData.user.email,
            role: "tecnico",
          };
          saveStoredUser(user);
          return user;
        }
      }
    } catch (err) {
      console.warn("Consulta Supabase Auth alternativa:", err);
    }
  }

  // 2. Fallback a usuarios registrados localmente en este dispositivo
  const localUsers = getLocalUsers();
  const found = localUsers.find(
    (u) => u.username.toLowerCase() === cleanId && u.password === cleanPass
  );

  if (found) {
    const user: AuthUser = {
      id: found.id,
      username: found.username,
      name: found.name,
      role: found.role,
    };
    saveStoredUser(user);
    return user;
  }

  throw new Error("Usuario o contraseña incorrectos. Verifica tus datos o regístrate.");
}

/**
 * Registrar un nuevo técnico con contraseña
 */
export async function registerWithCredentials(
  name: string,
  identifier: string,
  password: string
): Promise<AuthUser> {
  const cleanName = name.trim();
  const cleanId = identifier.trim().toLowerCase();
  const cleanPass = password.trim();

  if (!cleanName || !cleanId || !cleanPass) {
    throw new Error("Por favor completa todos los campos requeridos.");
  }

  if (cleanPass.length < 4) {
    throw new Error("La contraseña debe tener al menos 4 caracteres.");
  }

  // 1. Intentar registrar en la tabla 'workshop_users' de Supabase
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("workshop_users")
        .insert([
          {
            username: cleanId,
            name: cleanName,
            password: cleanPass,
            role: "tecnico",
          },
        ])
        .select()
        .single();

      if (!error && data) {
        const user: AuthUser = {
          id: data.id,
          username: data.username,
          name: data.name,
          role: "tecnico",
        };
        saveStoredUser(user);
        return user;
      }
    } catch (err) {
      console.warn("Intento de guardado en workshop_users:", err);
    }
  }

  // 2. Si no hay Supabase o la tabla aún no se creó, guardar localmente para no bloquear al usuario
  const localUsers = getLocalUsers();
  const exists = localUsers.some((u) => u.username.toLowerCase() === cleanId);
  if (exists) {
    throw new Error("Este usuario ya está registrado. Por favor inicia sesión.");
  }

  const newUser: StoredWorkshopUser = {
    id: "user-" + Date.now(),
    username: cleanId,
    name: cleanName,
    password: cleanPass,
    role: "tecnico",
  };

  saveLocalUsers([...localUsers, newUser]);

  const authUser: AuthUser = {
    id: newUser.id,
    username: newUser.username,
    name: newUser.name,
    role: newUser.role,
  };
  saveStoredUser(authUser);
  return authUser;
}

export async function logout(): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    await supabase.auth.signOut().catch(() => {});
  }
  saveStoredUser(null);
}
