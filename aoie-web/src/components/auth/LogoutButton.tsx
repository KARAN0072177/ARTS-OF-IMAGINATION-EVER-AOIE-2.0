"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { useState } from "react";

interface LogoutButtonProps {
  variant?: "nav" | "full";
}

export default function LogoutButton({
  variant = "nav",
}: LogoutButtonProps) {
  const [loading, setLoading] =
    useState(false);

  const handleLogout = async () => {
    setLoading(true);

    await signOut({
      callbackUrl: "/login",
    });
  };

  const isFull = variant === "full";

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className={
        isFull
          ? "inline-flex w-full items-center justify-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
          : "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
      }
    >
      <LogOut size={16} />
      {loading ? "Logging out..." : "Logout"}
    </button>
  );
}
