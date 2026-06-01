"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SearchBar() {
  const router = useRouter();

  const [query, setQuery] =
    useState("");

  function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    const value =
      query.trim();

    if (!value) return;

    router.push(
      `/search?q=${encodeURIComponent(
        value
      )}`
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex gap-2"
    >
      <input
        type="text"
        value={query}
        onChange={(e) =>
          setQuery(
            e.target.value
          )
        }
        placeholder="Search artists, artworks..."
        className="w-full rounded-md border border-slate-300 px-4 py-2"
      />

      <button
        type="submit"
        className="rounded-md bg-slate-950 px-4 py-2 text-white"
      >
        Search
      </button>
    </form>
  );
}