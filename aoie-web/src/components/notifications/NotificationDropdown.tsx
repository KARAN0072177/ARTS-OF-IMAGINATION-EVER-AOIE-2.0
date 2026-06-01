"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import NotificationItem, {
  NotificationListItem,
} from "./NotificationItem";

export default function NotificationDropdown() {
  const [loading, setLoading] =
    useState(true);

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

  return (
    <div className="absolute right-0 top-12 z-50 w-[360px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
      <div className="border-b border-slate-200 p-4">
        <h3 className="font-semibold">
          Notifications
        </h3>
      </div>

      {loading ? (
        <div className="p-6 text-center text-sm text-slate-500">
          Loading...
        </div>
      ) : notifications.length === 0 ? (
        <div className="p-6 text-center text-sm text-slate-500">
          No notifications yet.
        </div>
      ) : (
        <div>
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
        className="block border-t border-slate-200 p-4 text-center text-sm font-medium text-cyan-700 hover:bg-slate-50"
      >
        View All Notifications
      </Link>
    </div>
  );
}
