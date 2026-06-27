"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BadgeCheck,
  Bell,
  ChevronRight,
  Flag,
  Images,
  LayoutDashboard,
  Users,
} from "lucide-react";

import { useSocket } from "@/providers/SocketProvider";

interface AdminNavProps {
  initialPendingCount: number;
  initialPendingReportsCount: number;
  mobile?: boolean;
}

const navItems = [
  {
    label: "Overview",
    href: "/admin",
    icon: LayoutDashboard,
    isExact: true,
  },
  {
    label: "Artist approvals",
    href: "/admin/artist-applications",
    icon: BadgeCheck,
    badgeKey: "artistApplications",
  },
  {
    label: "Artworks",
    href: "/admin/artworks",
    icon: Images,
  },
  {
    label: "Reports",
    href: "/admin/reports",
    icon: Flag,
    badgeKey: "reports",
  },
  {
    label: "Users",
    href: "/admin/users",
    icon: Users,
  },
  {
    label: "Activity",
    href: "/admin/activity",
    icon: Bell,
  },
];

export default function AdminNavLinks({
  initialPendingCount,
  initialPendingReportsCount,
  mobile = false,
}: AdminNavProps) {
  const pathname = usePathname();
  const socket = useSocket();
  const [pendingCount, setPendingCount] = useState<number>(initialPendingCount);
  const [pendingReportsCount, setPendingReportsCount] = useState<number>(initialPendingReportsCount);
  const [dismissedApprovals, setDismissedApprovals] = useState<boolean>(false);
  const [dismissedReports, setDismissedReports] = useState<boolean>(false);

  const isViewingApprovals = pathname.startsWith("/admin/artist-applications");
  const isViewingReports = pathname.startsWith("/admin/reports");

  useEffect(() => {
    if (!socket) return;

    if (!socket.connected) {
      socket.connect();
    }

    socket.emit("join_admin_global");

    const handleApprovalsUpdate = (data: { pendingCount: number }) => {
      if (typeof data?.pendingCount === "number") {
        setPendingCount(data.pendingCount);
        if (!window.location.pathname.startsWith("/admin/artist-applications")) {
          setDismissedApprovals(false);
        }
      }
    };

    const handleReportsUpdate = (data: { pendingCount: number }) => {
      if (typeof data?.pendingCount === "number") {
        setPendingReportsCount(data.pendingCount);
        if (!window.location.pathname.startsWith("/admin/reports")) {
          setDismissedReports(false);
        }
      }
    };

    socket.on("artist_applications:count_update", handleApprovalsUpdate);
    socket.on("reports:count_update", handleReportsUpdate);

    return () => {
      socket.off("artist_applications:count_update", handleApprovalsUpdate);
      socket.off("reports:count_update", handleReportsUpdate);
    };
  }, [socket]);

  const getBadgeInfo = (badgeKey?: string) => {
    if (
      badgeKey === "artistApplications" &&
      pendingCount > 0 &&
      !isViewingApprovals &&
      !dismissedApprovals
    ) {
      return {
        count: pendingCount,
        activeBg: "bg-cyan-500 text-white shadow-xs",
        inactiveBg: "bg-cyan-100 text-cyan-800 border border-cyan-200/60 group-hover:bg-cyan-200/70",
        dotActive: "bg-white",
        dotInactive: "bg-cyan-600",
      };
    }
    if (
      badgeKey === "reports" &&
      pendingReportsCount > 0 &&
      !isViewingReports &&
      !dismissedReports
    ) {
      return {
        count: pendingReportsCount,
        activeBg: "bg-rose-500 text-white shadow-xs",
        inactiveBg: "bg-rose-100 text-rose-800 border border-rose-200/60 group-hover:bg-rose-200/70",
        dotActive: "bg-white",
        dotInactive: "bg-rose-600",
      };
    }
    return null;
  };

  const handleLinkClick = (badgeKey?: string) => {
    if (badgeKey === "artistApplications") setDismissedApprovals(true);
    if (badgeKey === "reports") setDismissedReports(true);
  };

  if (mobile) {
    return (
      <nav className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.isExact
            ? pathname === item.href
            : pathname.startsWith(item.href) && item.href !== "/admin";

          const badge = getBadgeInfo(item.badgeKey);

          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => handleLinkClick(item.badgeKey)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold transition ${
                isActive
                  ? "border-cyan-500 bg-cyan-50 text-cyan-900 shadow-xs"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${isActive ? "text-cyan-600" : "text-slate-500"}`} />
              <span>{item.label}</span>
              {badge && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-extrabold ${
                    item.badgeKey === "reports"
                      ? "bg-rose-600 text-white"
                      : "bg-cyan-600 text-white"
                  }`}
                >
                  <span className="h-1 w-1 rounded-full bg-white animate-pulse" />
                  {String(badge.count).padStart(2, "0")}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className="mt-8 space-y-1.5">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = item.isExact
          ? pathname === item.href
          : pathname.startsWith(item.href) && item.href !== "/admin";

        const badge = getBadgeInfo(item.badgeKey);

        return (
          <Link
            key={item.label}
            href={item.href}
            onClick={() => handleLinkClick(item.badgeKey)}
            className={`group flex items-center justify-between rounded-2xl px-3 py-3 text-sm font-semibold transition ${
              isActive
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:bg-cyan-50 hover:text-cyan-800"
            }`}
          >
            <span className="flex items-center gap-3 min-w-0">
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition ${
                  isActive
                    ? "bg-slate-800 text-cyan-400"
                    : "bg-slate-100 text-slate-600 group-hover:bg-white group-hover:text-cyan-700"
                }`}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="truncate">{item.label}</span>
            </span>

            <div className="flex items-center gap-2 shrink-0">
              {badge && (
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-bold transition ${
                    isActive ? badge.activeBg : badge.inactiveBg
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full animate-pulse ${
                      isActive ? badge.dotActive : badge.dotInactive
                    }`}
                  />
                  {String(badge.count).padStart(2, "0")}
                </span>
              )}
              <ChevronRight
                className={`h-4 w-4 transition group-hover:translate-x-0.5 ${
                  isActive
                    ? "text-slate-400 opacity-100"
                    : "text-slate-400 opacity-0 group-hover:opacity-100"
                }`}
              />
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
