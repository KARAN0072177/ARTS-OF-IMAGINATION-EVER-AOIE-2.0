"use client";

import { useRouter } from "next/navigation";

export default function MarkAllReadButton() {
  const router = useRouter();

  async function handleMarkAllRead() {
    try {
      await fetch(
        "/api/notifications/read-all",
        {
          method: "PATCH",
        }
      );

      router.refresh();
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <button
      onClick={handleMarkAllRead}
      className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium transition hover:bg-slate-50"
    >
      Mark all read
    </button>
  );
}