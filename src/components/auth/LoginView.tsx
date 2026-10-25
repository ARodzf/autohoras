"use client";

import React, { useState, useEffect } from "react";
import { Lock, Mail, Wrench, Shield, ArrowRight, UserPlus, Trash2, Plus } from "lucide-react";
import { AuthUser } from "@/types/database";
import {
  getWorkshopTechnicians,
  addWorkshopTechnician,
  loginWithQuickProfile,
  loginWithCredentials,
  signUpWithCredentials,
} from "@/lib/auth-service";

interface LoginViewProps {
  onLoginSuccess: (user: AuthUser) => void;
}

export default function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [mode, setMode] = useState<"quick" | "credentials">("quick");
  const [isRegistering, setIsRegistering] = useState(false);
  const [technicians, setTechnicians] = useState<AuthUser[]>([]);
  const [showAddTech, setShowAddTech] = useState(false);
  const [newTechName, setNewTechName] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  useEffect(() => {
    // Limpiar restos de versiones de prueba viejas si existieran
    if (typeof window !== "undefined") {
      localStorage.removeItem("autohoras_time_logs_local");
    }
    setTechnicians(getWorkshopTechnicians());
  }, []);

  const handleQuickSelect = async (user: AuthUser) => {
    setLoading(true);
    try {
      const logged = await loginWithQuickProfile(user);
      onLoginSuccess(logged);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNewTech = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTechName.trim()) return;
    const added = addWorkshopTechnician(newTechName.trim());
    setTechnicians((prev) => [...prev, added]);
    setNewTechName("");
    setShowAddTech(false);
    handleQuickSelect(added);
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setLoading(true);
    setErrorMsg(null);
    setSuccessNotice(null);

    try {
      if (isRegistering) {
        if (!name.trim()) {
          setErrorMsg("Por favor ingresa tu nombre y apellido");
          setLoading(false);
          return;
        }

        const result = await signUpWithCredentials(name, email, password);
        if (result.user) {
          onLoginSuccess(result.user);
        } else if (result.requiresEmailConfirmation) {
          setSuccessNotice(
            "Cuenta creada con éxito. Por favor confirma tu correo o desactiva 'Confirm email' en Supabase para entrar directamente."
          );
          setIsRegistering(false);
        }
      } else {
        const user = await loginWithCredentials(email.trim(), password);
        onLoginSuccess(user);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Error al procesar la solicitud");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-zinc-950 text-zinc-100">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Glow de fondo */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Encabezado */}
        <div className="text-center mb-6 relative">
          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-600/30">
            <Wrench className="w-8 h-8 stroke-[2.2]" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">AutoHoras</h1>
          <p className="text-xs text-zinc-400 mt-1">Control de horas e intervenciones de taller</p>
        </div>

        {/* Selector de Modo */}
        <div className="flex bg-zinc-950 p-1 rounded-2xl mb-6 border border-zinc-800">
          <button
            type="button"
            onClick={() => setMode("quick")}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              mode === "quick"
                ? "bg-blue-600 text-white shadow-md"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Técnicos de Taller
          </button>
          <button
            type="button"
            onClick={() => setMode("credentials")}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              mode === "credentials"
                ? "bg-blue-600 text-white shadow-md"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Correo Electrónico
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-center">
            {errorMsg}
          </div>
        )}

        {successNotice && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs text-center">
            {successNotice}
          </div>
        )}

        {/* Modo 1: Técnicos del Taller (Totalmente en blanco para tus técnicos reales) */}
        {mode === "quick" ? (
          <div className="space-y-3">
            {technicians.length === 0 && !showAddTech ? (
              <div className="text-center py-6 px-4 bg-zinc-950/60 rounded-2xl border border-dashed border-zinc-800">
                <p className="text-xs text-zinc-400 font-medium mb-3">
                  No hay técnicos registrados todavía. Agrega el nombre del primer técnico para comenzar:
                </p>
                <button
                  type="button"
                  onClick={() => setShowAddTech(true)}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 mx-auto transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Agregar Técnico
                </button>
              </div>
            ) : (
              <>
                <p className="text-xs text-zinc-400 font-medium text-center mb-2">
                  Selecciona tu nombre para ingresar:
                </p>
                <div className="space-y-2">
                  {technicians.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleQuickSelect(user)}
                      disabled={loading}
                      className="w-full p-3.5 rounded-2xl bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/60 text-left flex items-center justify-between group active:scale-[0.98] transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-xs border border-blue-500/20 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          {user.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-zinc-100 group-hover:text-blue-300 transition-colors">
                            {user.name}
                          </div>
                          <div className="text-[10px] text-zinc-500 capitalize">Técnico</div>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                    </button>
                  ))}
                </div>

                {!showAddTech ? (
                  <button
                    type="button"
                    onClick={() => setShowAddTech(true)}
                    className="w-full py-2.5 rounded-xl border border-dashed border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer mt-2"
                  >
                    <Plus className="w-3.5 h-3.5" /> Agregar otro técnico
                  </button>
                ) : null}
              </>
            )}

            {/* Formulario rápido para agregar técnico */}
            {showAddTech && (
              <form onSubmit={handleAddNewTech} className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-3 mt-2">
                <label className="block text-xs font-semibold text-zinc-300">
                  Nombre del Técnico
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newTechName}
                  onChange={(e) => setNewTechName(e.target.value)}
                  placeholder="Ej. Roberto Gómez"
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-750 rounded-xl text-sm text-zinc-100 focus:border-blue-500 focus:outline-none placeholder:text-zinc-600"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Guardar y Entrar
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddTech(false)}
                    className="px-3 py-2 bg-zinc-800 text-zinc-400 text-xs font-medium rounded-xl cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          /* Modo 2: Correo y Contraseña */
          <form onSubmit={handleCredentialsSubmit} className="space-y-3.5">
            {isRegistering && (
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Nombre Completo del Técnico
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Roberto Gómez"
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:border-blue-500 focus:outline-none placeholder:text-zinc-600"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tecnico@taller.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:border-blue-500 focus:outline-none placeholder:text-zinc-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:border-blue-500 focus:outline-none placeholder:text-zinc-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 mt-2"
            >
              {loading
                ? "Procesando..."
                : isRegistering
                ? "Crear Cuenta de Técnico"
                : "Iniciar Sesión"}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setErrorMsg(null);
                }}
                className="text-xs text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
              >
                {isRegistering
                  ? "¿Ya tienes cuenta? Inicia sesión aquí"
                  : "¿Nuevo técnico? Crear cuenta aquí"}
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-zinc-800/80 text-center text-[11px] text-zinc-500 flex items-center justify-center gap-1">
          <Shield className="w-3.5 h-3.5 text-zinc-500" />
          <span>Producción • Base de Datos Supabase</span>
        </div>
      </div>
    </div>
  );
}
