"use client";

import React, { useState, useEffect } from "react";
import AppHeader from "@/components/layout/AppHeader";
import BottomNavigation, { ActiveTab } from "@/components/layout/BottomNavigation";
import QuickTimeEntryForm from "@/components/entry/QuickTimeEntryForm";
import BitacoraView from "@/components/bitacora/BitacoraView";
import ReportesView from "@/components/reportes/ReportesView";
import LoginView from "@/components/auth/LoginView";
import { AuthUser } from "@/types/database";
import { getStoredUser, logout } from "@/lib/auth-service";

export default function Home() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>("entry");

  useEffect(() => {
    const user = getStoredUser();
    if (user) {
      setCurrentUser(user);
    }
    setIsLoadingAuth(false);
  }, []);

  const handleLogout = async () => {
    await logout();
    setCurrentUser(null);
  };

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-500 text-sm">
        Cargando taller...
      </div>
    );
  }

  // Si no hay técnico autenticado, mostrar Login
  if (!currentUser) {
    return <LoginView onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6">
        <AppHeader currentUser={currentUser} onLogout={handleLogout} />

        {activeTab === "entry" && (
          <div className="animate-in fade-in duration-150">
            <QuickTimeEntryForm
              currentUser={currentUser}
              onSuccess={() => setActiveTab("bitacora")}
            />
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
