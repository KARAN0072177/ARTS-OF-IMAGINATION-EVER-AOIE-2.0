"use client";

import { Bell } from "lucide-react";

import { useEffect, useState } from "react";

import NotificationDropdown from "./NotificationDropdown";
import { useSocket } from "@/providers/SocketProvider";

export default function NotificationBell() {
  const socket = useSocket();

  const [open, setOpen] =
    useState(false);

  const [unreadCount, setUnreadCount] =
    useState(0);

  useEffect(() => {
    let isMounted = true;

    async function fetchUnreadCount() {
      try {
        const response =
          await fetch(
            "/api/notifications"
          );

        const data =
          await response.json();

        if (data.success && isMounted) {
          setUnreadCount(
            data.unreadCount
          );
        }
      } catch (error) {
        console.error(error);
      }
    }

    fetchUnreadCount();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    async function refreshUnreadCount() {
      try {
        const response =
          await fetch(
            "/api/notifications"
          );

        const data =
          await response.json();

        if (data.success) {
          setUnreadCount(
            data.unreadCount
          );
        }
      } catch (error) {
        console.error(error);
      }
    }

    socket.on(
      "notification:new",
      refreshUnreadCount
    );

    return () => {
      socket.off(
        "notification:new",
        refreshUnreadCount
      );
    };
  }, [socket]);

  return (
    <div className="relative">
      <button
        onClick={() =>
          setOpen(!open)
        }
        className={`relative flex h-10 w-10 items-center justify-center rounded-full border transition ${
          open
            ? "border-cyan-200 bg-cyan-50 text-cyan-700"
            : "border-transparent hover:border-slate-200 hover:bg-slate-100"
        }`}
        aria-label="Open notifications"
      >
        <Bell className="h-5 w-5" />

        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1 text-xs font-bold text-white shadow-sm ring-2 ring-white">
            {unreadCount > 99
              ? "99+"
              : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <NotificationDropdown
          onMarkAllRead={() =>
            setUnreadCount(0)
          }
        />
      )}
    </div>
  );
}
