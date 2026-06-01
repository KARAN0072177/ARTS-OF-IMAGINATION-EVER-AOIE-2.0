"use client";

import { Bell } from "lucide-react";

import { useEffect, useState } from "react";

import NotificationDropdown from "./NotificationDropdown";

export default function NotificationBell() {
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

  return (
    <div className="relative">
      <button
        onClick={() =>
          setOpen(!open)
        }
        className="relative flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-slate-100"
      >
        <Bell className="h-5 w-5" />

        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-xs font-semibold text-white">
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
