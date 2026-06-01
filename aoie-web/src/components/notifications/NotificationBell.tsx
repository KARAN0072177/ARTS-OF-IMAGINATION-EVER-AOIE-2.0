"use client";

import Link from "next/link";
import { Bell } from "lucide-react";

export default function NotificationBell() {
  return (
    <Link
      href="/notifications"
      className="relative flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-slate-100"
    >
      <Bell className="h-5 w-5" />

      {/* TODO: unread badge */}
      {/* <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-xs font-semibold text-white">
        3
      </span> */}
    </Link>
  );
}