"use client";

import React, { useState } from "react";
import AppHeader from "@/components/layout/AppHeader";
import BottomNavigation, { ActiveTab } from "@/components/layout/BottomNavigation";
import QuickTimeEntryForm from "@/components/entry/QuickTimeEntryForm";
import BitacoraView from "@/components/bitacora/BitacoraView";
import ReportesView from "@/components/reportes/ReportesView";

export default function Home() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("entry");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6">
        <AppHeader />

        {activeTab === "entry" && (
          <div className="animate-in fade-in duration-150">
            <QuickTimeEntryForm onSuccess={() => setActiveTab("bitacora")} />
          </div>
        )}

        {activeTab === "bitacora" && (
          <div className="animate-in fade-in duration-150">
            <BitacoraView />
          </div>
        )}

        {activeTab === "reportes" && (
          <div className="animate-in fade-in duration-150">
            <ReportesView />
          </div>
        )}
      </main>

      <BottomNavigation activeTab={activeTab} onChangeTab={setActiveTab} />
    </div>
  );
}
