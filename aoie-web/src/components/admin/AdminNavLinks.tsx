"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  Bell,
  ChevronRight,
  Flag,
  Images,
  LayoutDashboard,
  ShieldAlert,
  Users,
} from "lucide-react";

import { useSocket } from "@/providers/SocketProvider";

interface AdminNavProps {
  initialPendingCount: number;
  initialPendingReportsCount: number;
  mobile?: boolean;
  isCollapsed?: boolean;
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
    label: "Moderation",
    href: "/admin/moderation",
    icon: ShieldAlert,
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
  isCollapsed = false,
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
        activeBg: "bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/30",
        inactiveBg: "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 group-hover:bg-cyan-500/25",
        dotActive: "bg-slate-950",
        dotInactive: "bg-cyan-400",
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
        activeBg: "bg-rose-500 text-white font-black shadow-md shadow-rose-500/30",
        inactiveBg: "bg-rose-500/15 text-rose-300 border border-rose-500/30 group-hover:bg-rose-500/25",
        dotActive: "bg-white",
        dotInactive: "bg-rose-400",
      };
    }
    return null;
  };

  const handleLinkClick = (badgeKey?: string) => {
    if (badgeKey === "artistApplications") setDismissedApprovals(true);
    if (badgeKey === "reports") setDismissedReports(true);
  };

  const activeIndex = navItems.findIndex((item) =>
    item.isExact
      ? pathname === item.href
      : pathname.startsWith(item.href) && item.href !== "/admin"
  );
  const currentActiveIndex = activeIndex === -1 ? 0 : activeIndex;

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
              className={`relative inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-extrabold transition ${
                isActive
                  ? "border-cyan-500/50 bg-cyan-500/20 text-cyan-300 shadow-md shadow-cyan-500/10"
                  : "border-slate-800 bg-slate-900/80 text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${isActive ? "text-cyan-400" : "text-slate-400"}`} />
              <span>{item.label}</span>
              {isActive && (
                <motion.span
                  layoutId="mobile_active_ball"
                  className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_8px_#22d3ee] shrink-0 ml-1"
                  transition={{ type: "spring", stiffness: 450, damping: 28 }}
                />
              )}
              {badge && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black ${
                    item.badgeKey === "reports"
                      ? "bg-rose-600 text-white shadow-sm"
                      : "bg-cyan-500 text-slate-950 shadow-sm"
                  }`}
                >
                  <span className="h-1 w-1 rounded-full bg-current animate-pulse" />
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
    <nav
      className={`relative mt-8 flex flex-col gap-2 transition-all duration-300 ease-in-out ${
        isCollapsed ? "px-1 items-center" : "w-full"
      }`}
    >
      {/* SINGLE ANIMATED ACTIVE BACKGROUND PILL */}
      {!isCollapsed ? (
        <motion.div
          initial={false}
          animate={{
            y: currentActiveIndex * 52,
          }}
          transition={{
            type: "spring",
            stiffness: 320,
            damping: 30,
          }}
          className="absolute left-0 right-0 top-0 h-11 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 border border-cyan-400/50 shadow-lg shadow-cyan-600/25 pointer-events-none z-0"
        />
      ) : (
        <motion.div
          initial={false}
          animate={{
            y: currentActiveIndex * 52,
          }}
          transition={{
            type: "spring",
            stiffness: 320,
            damping: 30,
          }}
          className="absolute left-0 top-0 h-11 w-11 rounded-2xl bg-gradient-to-br from-cyan-600 to-blue-600 border border-cyan-400/50 shadow-lg shadow-cyan-600/30 pointer-events-none z-0"
        />
      )}

      {/* SINGLE ANIMATED GLOWING DOT PLACED ON THE RIGHT SIDE (REPLACING THE ARROW) */}
      {!isCollapsed ? (
        <motion.span
          initial={false}
          animate={{
            y: currentActiveIndex * 52 + 18,
          }}
          transition={{
            type: "spring",
            stiffness: 380,
            damping: 26,
          }}
          className="absolute right-4 top-0 h-2.5 w-2.5 rounded-full bg-cyan-200 shadow-[0_0_12px_#67e8f9] pointer-events-none z-20"
        />
      ) : (
        <motion.span
          initial={false}
          animate={{
            y: currentActiveIndex * 52 + 37,
          }}
          transition={{
            type: "spring",
            stiffness: 380,
            damping: 26,
          }}
          className="absolute left-1/2 -translate-x-1/2 top-0 h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_#22d3ee] pointer-events-none z-20"
        />
      )}

      {navItems.map((item, index) => {
        const Icon = item.icon;
        const isActive = index === currentActiveIndex;
        const badge = getBadgeInfo(item.badgeKey);

        return (
          <Link
            key={item.label}
            href={item.href}
            title={isCollapsed ? item.label : undefined}
            onClick={() => handleLinkClick(item.badgeKey)}
            className={`group relative z-10 flex h-11 items-center justify-between rounded-2xl transition-colors duration-200 ${
              isCollapsed ? "w-11 justify-center p-0" : "w-full px-3.5"
            } ${
              isActive
                ? "text-white font-extrabold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            {/* Content Container */}
            <span className="flex items-center gap-3.5 min-w-0">
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-300 border ${
                  isActive
                    ? "bg-slate-950/40 border-cyan-300/30 text-white shadow-inner"
                    : "bg-slate-900 border-slate-800 text-slate-400 group-hover:bg-slate-800 group-hover:text-cyan-400 group-hover:border-slate-700"
                }`}
              >
                <Icon className="h-4 w-4" />
              </span>

              <span
                className={`overflow-hidden transition-all duration-300 ease-in-out whitespace-nowrap font-extrabold text-sm ${
                  isCollapsed ? "max-w-0 opacity-0 pointer-events-none hidden" : "max-w-[160px] opacity-100"
                }`}
              >
                {item.label}
              </span>
            </span>

            {/* Badge and Right Side Indicator / Chevron */}
            <div className={`flex items-center gap-2 shrink-0 ${isCollapsed ? "absolute -top-1 -right-1" : ""}`}>
              {badge && (
                <span
                  className={`inline-flex items-center justify-center rounded-full transition-all duration-300 font-black ${
                    isCollapsed
                      ? `h-4.5 w-4.5 text-[9px] text-white shadow-md ${
                          item.badgeKey === "reports" ? "bg-rose-600 animate-bounce" : "bg-cyan-500 text-slate-950 animate-bounce"
                        }`
                      : `px-2.5 py-0.5 text-xs gap-1.5 ${isActive ? badge.activeBg : badge.inactiveBg}`
                  }`}
                >
                  {!isCollapsed && (
                    <span
                      className={`h-1.5 w-1.5 rounded-full animate-pulse ${
                        isActive ? badge.dotActive : badge.dotInactive
                      }`}
                    />
                  )}
                  {isCollapsed ? badge.count : String(badge.count).padStart(2, "0")}
                </span>
              )}

              {!isCollapsed && !isActive && (
                <ChevronRight
                  className="h-4 w-4 text-slate-500 opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-100 group-hover:text-cyan-400"
                />
              )}

              {!isCollapsed && isActive && (
                <div className="w-3 h-3" /> /* Placeholder space for the right-aligned animated glowing dot */
              )}
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
