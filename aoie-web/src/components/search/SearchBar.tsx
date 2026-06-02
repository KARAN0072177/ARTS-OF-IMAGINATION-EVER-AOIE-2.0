"use client";

import {
  Search,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface SearchBarProps {
  initialQuery?: string;
}

export default function SearchBar({
  initialQuery = "",
}: SearchBarProps) {
  const router = useRouter();

  const [query, setQuery] =
    useState(initialQuery);

  function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    const value =
      query.trim();

    if (!value) {
      router.push("/search");
      return;
    }

    router.push(
      `/search?q=${encodeURIComponent(
        value
      )}`
    );
  }

  function handleClear() {
    setQuery("");
    router.push("/search");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full flex-col gap-3 sm:flex-row"
    >
      <div className="relative flex-1">
        <Search
          size={18}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />

        <input
          type="search"
          value={query}
          onChange={(e) =>
            setQuery(e.target.value)
          }
          placeholder="Search artists, artworks, categories..."
          className="w-full rounded-full border border-slate-300 bg-slate-50 py-3 pl-10 pr-10 text-sm font-medium text-slate-950 outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-cyan-600 focus:bg-white focus:ring-4 focus:ring-cyan-100"
        />

        {query && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <button
        type="submit"
        className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
      >
        <Search size={16} />
        Search
      </button>
    </form>
  );
}
