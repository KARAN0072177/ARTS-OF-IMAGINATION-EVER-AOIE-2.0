"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";

interface GoogleAuthButtonProps {
  label?: string;
}

export default function GoogleAuthButton({
  label = "Continue with Google",
}: GoogleAuthButtonProps) {
  const [loading, setLoading] =
    useState(false);

  return (
    <button
      type="button"
      onClick={() => {
        setLoading(true);
        signIn("google", {
          callbackUrl: "/complete-profile",
        });
      }}
      disabled={loading}
      className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <FcGoogle size={18} />
      {loading ? "Opening Google..." : label}
    </button>
  );
}
