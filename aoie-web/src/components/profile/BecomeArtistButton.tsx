"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function BecomeArtistButton() {
  const router = useRouter();

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const handleBecomeArtist =
    async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await fetch(
            "/api/profile/become-artist",
            {
              method: "POST",
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message
          );
        }

        router.refresh();
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Something went wrong"
        );
      } finally {
        setLoading(false);
      }
    };

  return (
    <div className="mt-4">
      <button
        onClick={handleBecomeArtist}
        disabled={loading}
        className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {loading
          ? "Converting..."
          : "Become Artist"}
      </button>

      {error && (
        <p className="mt-2 text-sm text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}