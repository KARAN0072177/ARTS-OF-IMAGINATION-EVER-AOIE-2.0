"use client";

import { ArrowRight, Loader2 } from "lucide-react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CompleteProfileForm() {
  const router = useRouter();
  const [username, setUsername] =
    useState("");
  const [loading, setLoading] =
    useState(false);
  const [error, setError] =
    useState("");

  async function handleSubmit(
    event: React.FormEvent
  ) {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/profile/username",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            username,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to save username."
        );
      }

      router.refresh();
      await signOut({
        callbackUrl: "/login",
      });
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md"
    >
      <div className="mb-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-700">
          One last step
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">
          Choose your username
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          This is how people will recognize
          you across AOIE. You can use
          letters, numbers, and underscores.
        </p>
      </div>

      <label
        htmlFor="username"
        className="mb-2 block text-sm font-medium text-slate-700"
      >
        Username
      </label>

      <input
        id="username"
        type="text"
        value={username}
        onChange={(event) =>
          setUsername(event.target.value)
        }
        minLength={3}
        maxLength={20}
        required
        autoFocus
        placeholder="karan_art"
        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-slate-950 outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100"
      />

      <p className="mt-2 text-xs text-slate-500">
        3-20 characters. Letters, numbers,
        and underscores only.
      </p>

      {error && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <Loader2
            size={16}
            className="animate-spin"
          />
        ) : (
          <ArrowRight size={16} />
        )}
        {loading
          ? "Saving..."
          : "Continue to AOIE"}
      </button>
    </form>
  );
}
