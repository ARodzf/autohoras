"use client";

import React from "react";
import { PlusCircle, Clock, FileBarChart2 } from "lucide-react";

export type ActiveTab = "entry" | "bitacora" | "reportes";

interface BottomNavigationProps {
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
}

export default function BottomNavigation({ activeTab, onChangeTab }: BottomNavigationProps) {
  const tabs = [
    {
      id: "entry" as ActiveTab,
      label: "Registrar",
      icon: PlusCircle,
    },
    {
      id: "bitacora" as ActiveTab,
      label: "Bitácora",
      icon: Clock,
    },
    {
      id: "reportes" as ActiveTab,
      label: "Comprobantes",
      icon: FileBarChart2,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800/80 pb-safe shadow-2xl">
      <div className="max-w-md mx-auto flex items-center justify-around px-3 py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                onChangeTab(tab.id);
                if (typeof window !== "undefined" && window.navigator?.vibrate) {
                  window.navigator.vibrate(20);
                }
              }}
              className={`flex-1 flex flex-col items-center justify-center py-2 px-3 rounded-2xl transition-all cursor-pointer select-none active:scale-95 ${
                isActive
                  ? "text-blue-400 font-bold bg-zinc-900 border border-zinc-800"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Icon className={`w-5 h-5 mb-1 ${isActive ? "stroke-[2.5]" : "stroke-[2]"}`} />
              <span className="text-[11px] tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
