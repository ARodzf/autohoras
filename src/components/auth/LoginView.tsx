"use client";

import React, { useState } from "react";
import { Lock, Mail, Wrench, Shield, ArrowRight, UserPlus, UserCheck } from "lucide-react";
import { AuthUser } from "@/types/database";
import {
  DEFAULT_PRESET_USERS,
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

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const handleQuickSelect = async (user: AuthUser) => {
    setLoading(true);
    try {
      const logged = await loginWithQuickProfile(user);
      onLoginSuccess(logged);
    } finally {
      setLoading(false);
    }
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
            "Cuenta creada. Por favor revisa tu bandeja de entrada o activa 'Disable Email Confirmations' en Supabase para entrar directamente."
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
          <p className="text-xs text-zinc-400 mt-1">Control de horas e intervenciones por técnico</p>
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
            Técnicos (1 Clic)
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

        {/* Modo 1: Selección Rápida de Técnico */}
        {mode === "quick" ? (
          <div className="space-y-2.5">
            <p className="text-xs text-zinc-400 font-medium mb-3 text-center">
              Selecciona tu perfil de taller para entrar directo:
            </p>
            {DEFAULT_PRESET_USERS.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => handleQuickSelect(user)}
                disabled={loading}
                className="w-full p-4 rounded-2xl bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/60 text-left flex items-center justify-between group active:scale-[0.98] transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-sm border border-blue-500/20 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    {user.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-zinc-100 group-hover:text-blue-300 transition-colors">
                      {user.name}
                    </div>
                    <div className="text-[11px] text-zinc-500 capitalize">
                      {user.role === "admin" ? "Supervisor" : "Técnico"}
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
              </button>
            ))}
          </div>
        ) : (
          /* Modo 2: Correo y Contraseña (Login / Registro) */
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
          <span>Compatible con Supabase Auth & Vercel</span>
        </div>
      </div>
    </div>
  );
}
