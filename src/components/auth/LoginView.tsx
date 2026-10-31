"use client";

import React, { useState } from "react";
import { Lock, User, Wrench, Shield, Eye, EyeOff, LogIn, UserPlus } from "lucide-react";
import { AuthUser } from "@/types/database";
import { loginWithCredentials, registerWithCredentials } from "@/lib/auth-service";

interface LoginViewProps {
  onLoginSuccess: (user: AuthUser) => void;
}

export default function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!identifier.trim() || !password.trim()) {
      setErrorMsg("Por favor ingresa usuario y contraseña.");
      return;
    }

    if (isRegistering && !name.trim()) {
      setErrorMsg("Por favor ingresa tu nombre y apellido.");
      return;
    }

    setLoading(true);
    try {
      if (isRegistering) {
        const user = await registerWithCredentials(name, identifier, password);
        onLoginSuccess(user);
      } else {
        const user = await loginWithCredentials(identifier, password);
        onLoginSuccess(user);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Error al autenticar. Verifica tus datos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-zinc-950 text-zinc-100">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Luces sutiles de fondo */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Encabezado */}
        <div className="text-center mb-6 relative">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/25">
            <Wrench className="w-7 h-7 stroke-[2.2]" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">AutoHoras</h1>
          <p className="text-xs text-zinc-400 mt-1">Registro de horas de trabajo en vehículos</p>
        </div>

        {/* Alerta de Error */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-center font-medium animate-in fade-in">
            {errorMsg}
          </div>
        )}

        {/* Formulario Principal con Contraseña */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegistering && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                Nombre y Apellido
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Roberto Gómez"
                  className="w-full pl-10 pr-4 py-3 bg-zinc-950 border border-zinc-800 rounded-2xl text-sm text-zinc-100 focus:border-blue-500 focus:outline-none placeholder:text-zinc-600 transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
              Usuario o Correo
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                autoCapitalize="none"
                autoCorrect="off"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Ej. roberto o tecnico@taller.com"
                className="w-full pl-10 pr-4 py-3 bg-zinc-950 border border-zinc-800 rounded-2xl text-sm text-zinc-100 focus:border-blue-500 focus:outline-none placeholder:text-zinc-600 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={4}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Introduce tu contraseña"
                className="w-full pl-10 pr-11 py-3 bg-zinc-950 border border-zinc-800 rounded-2xl text-sm text-zinc-100 focus:border-blue-500 focus:outline-none placeholder:text-zinc-600 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-1"
                title={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm tracking-wide shadow-lg shadow-blue-600/25 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>Verificando...</span>
            ) : isRegistering ? (
              <>
                <UserPlus className="w-4 h-4" />
                <span>REGISTRAR Y ENTRAR</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>INICIAR SESIÓN</span>
              </>
            )}
          </button>
        </form>

        {/* Alternar entre Login y Registro */}
        <div className="mt-5 pt-4 border-t border-zinc-800/80 text-center">
          <button
            type="button"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setErrorMsg(null);
            }}
            className="text-xs text-blue-400 hover:text-blue-300 font-semibold cursor-pointer transition-colors"
          >
            {isRegistering
              ? "¿Ya tienes cuenta? Iniciar Sesión aquí"
              : "¿Nuevo técnico? Crea tu cuenta con contraseña aquí"}
          </button>
        </div>

        <div className="mt-4 text-center text-[11px] text-zinc-500 flex items-center justify-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-zinc-500" />
          <span>Acceso seguro • Taller Automotriz</span>
        </div>
      </div>
    </div>
  );
}
