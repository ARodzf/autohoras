"use client";

import React from "react";
import { Wrench, LogOut, User } from "lucide-react";
import { AuthUser } from "@/types/database";

interface AppHeaderProps {
  currentUser?: AuthUser | null;
  onLogout?: () => void;
}

export default function AppHeader({ currentUser, onLogout }: AppHeaderProps) {
  return (
    <header className="flex items-center justify-between py-3.5 mb-3 border-b border-zinc-800/80">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-600/20">
          <Wrench className="w-5 h-5 stroke-[2.2]" />
        </div>
        <div>
          <h1 className="text-base font-black tracking-tight text-zinc-100 flex items-center gap-1.5">
            AutoHoras
            <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/30 px-1.5 py-0.2 rounded font-mono">
              PRO
            </span>
          </h1>
          <p className="text-[10px] text-zinc-500 font-medium">Desarme y Registro de Taller</p>
        </div>
      </div>

      {currentUser && (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-xl text-xs text-zinc-300">
            <User className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-semibold text-zinc-200">{currentUser.name.split(" ")[0]}</span>
          </div>

          <button
            onClick={onLogout}
            title="Cerrar sesión / Cambiar de técnico"
            className="p-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-rose-400 border border-zinc-800 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      )}
    </header>
  );
}
