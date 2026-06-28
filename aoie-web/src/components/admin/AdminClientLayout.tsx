"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Brush,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Shield,
  Sparkles,
} from "lucide-react";
import AdminNavLinks from "./AdminNavLinks";

interface AdminClientLayoutProps {
  children: React.ReactNode;
  userRole: string;
  pendingCount: number;
  pendingReportsCount: number;
}

export default function AdminClientLayout({
  children,
  userRole,
  pendingCount,
  pendingReportsCount,
}: AdminClientLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem("admin_sidebar_collapsed");
    if (saved === "true") {
      setIsCollapsed(true);
    }
  }, []);

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("admin_sidebar_collapsed", String(next));
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-slate-950">
      {/* Ambient background glow elements */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-purple-500/10 blur-[120px]" />
      </div>

      {/* Desktop Sidebar (Dark Glassmorphism with Smooth Transitions) */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden border-r border-slate-800/80 bg-slate-950/80 backdrop-blur-2xl transition-all duration-300 ease-in-out lg:block ${
          isCollapsed ? "w-20 px-3 py-6" : "w-72 px-5 py-6"
        } shadow-2xl shadow-cyan-950/20`}
      >
        {/* Top Header & Toggle */}
        <div className={`flex items-center gap-2 transition-all duration-300 ${isCollapsed ? "flex-col justify-center" : "justify-between"}`}>
          <Link
            href="/admin"
            title="AOIE Admin Overview"
            className={`flex items-center gap-3 rounded-3xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-md transition-all duration-300 hover:bg-slate-900 hover:border-slate-700 shadow-lg ${
              isCollapsed ? "h-11 w-11 justify-center p-0" : "flex-1 p-2.5"
            }`}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/30">
              <Shield className="h-5 w-5" />
            </span>
            <div className={`overflow-hidden transition-all duration-300 ease-in-out whitespace-nowrap ${
              isCollapsed ? "max-w-0 opacity-0 pointer-events-none hidden" : "max-w-[200px] opacity-100"
            }`}>
              <span className="block text-base font-black tracking-tight text-white flex items-center gap-1.5">
                AOIE Admin <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
              </span>
              <span className="block text-[11px] font-bold text-slate-400">
                Operations workspace
              </span>
            </div>
          </Link>

          <button
            type="button"
            onClick={toggleSidebar}
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/80 text-slate-400 transition-all duration-300 hover:bg-slate-800 hover:text-white"
          >
            {isCollapsed ? <PanelLeftOpen className="h-5 w-5 text-cyan-400" /> : <PanelLeftClose className="h-5 w-5" />}
          </button>
        </div>

        {/* Navigation Links */}
        <div className="mt-6">
          <AdminNavLinks
            initialPendingCount={pendingCount}
            initialPendingReportsCount={pendingReportsCount}
            isCollapsed={isCollapsed}
          />
        </div>

        {/* Bottom User Card */}
        <div
          className={`absolute bottom-6 border border-slate-800/80 bg-slate-900/80 backdrop-blur-md text-slate-100 transition-all duration-300 ease-in-out shadow-xl overflow-hidden ${
            isCollapsed
              ? "left-3 right-3 rounded-2xl p-2 flex flex-col items-center gap-2"
              : "left-5 right-5 rounded-3xl p-4"
          }`}
        >
          <div className="flex items-center gap-3 w-full">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-800 text-cyan-400 border border-slate-700 shadow-inner">
              <Brush className="h-4 w-4" />
            </div>
            <div className={`overflow-hidden transition-all duration-300 ease-in-out whitespace-nowrap min-w-0 ${
              isCollapsed ? "max-w-0 opacity-0 pointer-events-none hidden" : "max-w-[180px] opacity-100"
            }`}>
              <p className="truncate text-sm font-extrabold capitalize text-white">{userRole}</p>
              <p className="truncate text-xs font-bold text-cyan-400">Admin active</p>
            </div>
          </div>

          <Link
            href="/feed"
            title="Back to site"
            className={`inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-800/80 border border-slate-700 text-slate-200 transition-all duration-300 hover:bg-cyan-600 hover:text-white hover:border-cyan-500 shadow-md ${
              isCollapsed ? "h-10 w-10 p-0 mt-0" : "w-full px-3 py-2 mt-4 text-sm font-extrabold"
            }`}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span className={`overflow-hidden transition-all duration-300 ease-in-out whitespace-nowrap ${
              isCollapsed ? "max-w-0 opacity-0 pointer-events-none hidden" : "max-w-[150px] opacity-100"
            }`}>
              Back to site
            </span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area with Dynamic Padding */}
      <div
        className={`relative z-10 transition-all duration-300 ease-in-out ${
          isMounted && isCollapsed ? "lg:pl-20" : "lg:pl-72"
        }`}
      >
        {/* Mobile Header Bar (Dark Glass) */}
        <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 px-5 py-4 backdrop-blur-2xl lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-md">
                <Shield className="h-5 w-5" />
              </span>
              <div>
                <p className="font-extrabold text-white">AOIE Admin</p>
                <p className="text-xs font-bold text-cyan-400 capitalize">{userRole}</p>
              </div>
            </div>
          </div>
          <AdminNavLinks
            initialPendingCount={pendingCount}
            initialPendingReportsCount={pendingReportsCount}
            mobile
          />
        </header>

        <main className="mx-auto max-w-7xl px-5 py-6 sm:px-8 lg:px-10 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
