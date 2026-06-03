"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, Loader2 } from "lucide-react";

import NotificationItem, {
  NotificationListItem,
} from "./NotificationItem";
import { useSocket } from "@/providers/SocketProvider";

interface NotificationDropdownProps {
  onMarkAllRead?: () => void;
}

export default function NotificationDropdown({
  onMarkAllRead,
}: NotificationDropdownProps) {
  const socket = useSocket();

  const [loading, setLoading] =
    useState(true);

  const [markingRead, setMarkingRead] =
    useState(false);

  const [notifications, setNotifications] =
    useState<NotificationListItem[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function fetchNotifications() {
      try {
        const response =
          await fetch(
            "/api/notifications?limit=5"
          );

        const data =
          await response.json();

        if (data.success && isMounted) {
          setNotifications(
            data.notifications
          );
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchNotifications();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    async function refreshNotifications() {
      try {
        const response =
          await fetch(
            "/api/notifications?limit=5"
          );

        const data =
          await response.json();

        if (data.success) {
          setNotifications(
            data.notifications
          );
        }
      } catch (error) {
        console.error(error);
      }
    }

    socket.on(
      "notification:new",
      refreshNotifications
    );

    return () => {
      socket.off(
        "notification:new",
        refreshNotifications
      );
    };
  }, [socket]);

  async function handleMarkAllRead() {
    try {
      setMarkingRead(true);

      const response = await fetch(
        "/api/notifications/read-all",
        {
          method: "PATCH",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        return;
      }

      setNotifications(
        (currentNotifications) =>
          currentNotifications.map(
            (notification) => ({
              ...notification,
              isRead: true,
            })
          )
      );

      onMarkAllRead?.();
    } catch (error) {
      console.error(error);
    } finally {
      setMarkingRead(false);
    }
  }

  const hasUnread = notifications.some(
    (notification) =>
      !notification.isRead
  );

  const unreadCount = notifications.filter(
    (notification) => !notification.isRead
  ).length;

  return (
    <div className="absolute right-0 top-12 z-50 w-[380px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
      <div className="flex items-start justify-between gap-3 border-b border-slate-200 bg-slate-50/70 p-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700">
              <Bell className="h-4 w-4" />
            </span>
            <div>
              <h3 className="font-bold text-slate-950">
                Notifications
              </h3>
              <p className="text-xs text-slate-500">
                {unreadCount > 0
                  ? `${unreadCount} unread`
                  : "All caught up"}
              </p>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={handleMarkAllRead}
          disabled={
            !hasUnread || markingRead
          }
          className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-2 text-xs font-bold text-cyan-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-cyan-50 disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:bg-white"
        >
          {markingRead ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <CheckCheck className="h-3.5 w-3.5" />
          )}
          Read
        </button>
      </div>

      {loading ? (
        <div className="space-y-3 p-4">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="flex animate-pulse items-center gap-3 rounded-2xl bg-slate-50 p-3"
            >
              <div className="h-11 w-11 rounded-full bg-slate-200" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-4/5 rounded bg-slate-200" />
                <div className="h-3 w-1/3 rounded bg-slate-200" />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <Bell className="h-5 w-5" />
          </div>
          <p className="mt-3 text-sm font-semibold text-slate-900">
            No notifications yet
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Likes, comments, follows, and replies will appear here.
          </p>
        </div>
      ) : (
        <div className="max-h-[420px] overflow-y-auto">
          {notifications.map(
            (notification) => (
              <NotificationItem
                key={
                  notification._id
                }
                notification={
                  notification
                }
              />
            )
          )}
        </div>
      )}

      <Link
        href="/notifications"
        className="block border-t border-slate-200 bg-white p-4 text-center text-sm font-bold text-cyan-700 transition hover:bg-cyan-50"
      >
        View all notifications
      </Link>
    </div>
  );
}
