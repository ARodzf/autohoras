"use client";

import React from "react";
import { Wrench, ShieldCheck, Database } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export default function AppHeader() {
  return (
    <header className="flex items-center justify-between py-4 mb-4 border-b border-slate-800">
      <div className="flex items-center gap-2.5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black shadow-md shadow-emerald-500/20">
          <Wrench className="w-5 h-5 stroke-[2.5]" />
        </div>
        <div>
          <h1 className="text-lg font-black tracking-tight text-slate-100 flex items-center gap-1.5">
            AutoHoras
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded-md font-mono">
              MVP
            </span>
          </h1>
          <p className="text-[11px] text-slate-400 font-medium">Control de Tiempo de Taller</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {isSupabaseConfigured ? (
          <span className="flex items-center gap-1 text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full">
            <Database className="w-3 h-3" /> Supabase
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[11px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2.5 py-1 rounded-full">
            <ShieldCheck className="w-3 h-3" /> Local / Offline
          </span>
        )}
      </div>
    </header>
  );
}
