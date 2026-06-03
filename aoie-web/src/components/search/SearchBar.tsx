"use client";

import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface SearchBarProps {
  initialQuery?: string;
}

const quickSearches = [
  "Anime",
  "Digital Art",
  "Landscape",
  "Photography",
  "3D",
];

export default function SearchBar({
  initialQuery = "",
}: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] =
    useState(initialQuery);

  const submitSearch = (
    nextQuery = query
  ) => {
    const cleanQuery = nextQuery.trim();

    if (!cleanQuery) {
      router.push("/search");
      return;
    }

    router.push(
      `/search?q=${encodeURIComponent(cleanQuery)}`
    );
  };

  return (
    <div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submitSearch();
        }}
        className="flex flex-col gap-3 sm:flex-row"
      >
        <div className="relative min-w-0 flex-1">
          <Search
            size={22}
            className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={query}
            onChange={(event) =>
              setQuery(event.target.value)
            }
            className="h-14 w-full rounded-2xl border border-slate-200 bg-white pl-14 pr-12 text-base text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
            placeholder="Search artists, artworks, categories, tags..."
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                router.push("/search");
              }}
              className="absolute right-4 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label="Clear search"
            >
              <X size={17} />
            </button>
          )}
        </div>

        <button
          type="submit"
          className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-7 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
        >
          <Search size={18} />
          Search
        </button>
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        {quickSearches.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => {
              setQuery(item);
              submitSearch(item);
            }}
            className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-600 transition hover:bg-cyan-50 hover:text-cyan-700"
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}
