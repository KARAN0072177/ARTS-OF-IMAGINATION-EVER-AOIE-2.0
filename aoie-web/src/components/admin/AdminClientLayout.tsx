"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Brush,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Shield,
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
    <div className="min-h-screen bg-[#f6f8fb] text-slate-950">
      {/* Desktop Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden border-r border-slate-200/80 bg-white transition-all duration-300 ease-in-out lg:block ${
          isCollapsed ? "w-20 px-3 py-6" : "w-72 px-5 py-6"
        } shadow-[10px_0_35px_rgba(15,23,42,0.04)]`}
      >
        {/* Top Header & Toggle */}
        {!isCollapsed ? (
          <div className="flex items-center justify-between gap-2">
            <Link
              href="/admin"
              className="flex flex-1 items-center gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-2.5 transition hover:bg-slate-100"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-sm">
                <Shield className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-base font-extrabold tracking-tight">
                  AOIE Admin
                </span>
                <span className="block truncate text-[11px] font-medium text-slate-500">
                  Operations workspace
                </span>
              </span>
            </Link>

            <button
              type="button"
              onClick={toggleSidebar}
              title="Collapse Sidebar"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
            >
              <PanelLeftClose className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Link
              href="/admin"
              title="AOIE Admin Overview"
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-sm transition hover:bg-cyan-700"
            >
              <Shield className="h-5 w-5" />
            </Link>

            <button
              type="button"
              onClick={toggleSidebar}
              title="Expand Sidebar"
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-cyan-50 text-cyan-700 transition hover:bg-cyan-100 hover:text-cyan-900 shadow-2xs"
            >
              <PanelLeftOpen className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Navigation Links */}
        <div className="mt-4">
          <AdminNavLinks
            initialPendingCount={pendingCount}
            initialPendingReportsCount={pendingReportsCount}
            isCollapsed={isCollapsed}
          />
        </div>

        {/* Bottom User Card */}
        <div
          className={`absolute bottom-6 border border-cyan-200 bg-cyan-50 text-cyan-950 transition-all duration-300 ${
            isCollapsed
              ? "left-3 right-3 rounded-2xl p-1.5 flex justify-center"
              : "left-5 right-5 rounded-3xl p-4"
          }`}
        >
          {!isCollapsed ? (
            <>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-cyan-700 shadow-sm">
                  <Brush className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold capitalize">{userRole}</p>
                  <p className="truncate text-xs text-cyan-800/70">Admin active</p>
                </div>
              </div>
              <Link
                href="/feed"
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-3 py-2 text-sm font-bold text-cyan-800 shadow-sm transition hover:bg-cyan-950 hover:text-white"
              >
                <LogOut className="h-4 w-4" />
                Back to site
              </Link>
            </>
          ) : (
            <Link
              href="/feed"
              title="Back to site"
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-cyan-800 shadow-xs transition hover:bg-cyan-950 hover:text-white"
            >
              <LogOut className="h-5 w-5" />
            </Link>
          )}
        </div>
      </aside>

      {/* Main Content Area with Dynamic Padding */}
      <div
        className={`transition-all duration-300 ease-in-out ${
          isMounted && isCollapsed ? "lg:pl-20" : "lg:pl-72"
        }`}
      >
        {/* Mobile Header Bar */}
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 px-5 py-4 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-white">
                <Shield className="h-5 w-5" />
              </span>
              <div>
                <p className="font-bold">AOIE Admin</p>
                <p className="text-xs text-slate-500 capitalize">{userRole}</p>
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
