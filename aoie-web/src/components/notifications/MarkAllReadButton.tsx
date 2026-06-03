"use client";

import { useRouter } from "next/navigation";
import { CheckCheck } from "lucide-react";

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
      className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
    >
      <CheckCheck className="h-4 w-4" />
      Mark all read
    </button>
  );
}
