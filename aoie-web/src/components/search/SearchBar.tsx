"use client";

import {
  BadgeCheck,
  Hash,
  Image as ImageIcon,
  Loader2,
  Search,
  Tag,
  UserRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

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

interface SuggestionUser {
  id: string;
  username: string;
  role: string;
  displayName: string;
  avatar: string;
  bio?: string;
  location?: string;
}

interface SuggestionArtwork {
  id: string;
  title: string;
  imageUrl: string;
  category: string;
  tags?: string[];
  artistName?: string;
  artistUsername?: string;
}

interface SearchSuggestions {
  users: SuggestionUser[];
  artworks: SuggestionArtwork[];
  categories: string[];
  tags: string[];
}

const emptySuggestions: SearchSuggestions = {
  users: [],
  artworks: [],
  categories: [],
  tags: [],
};

export default function SearchBar({
  initialQuery = "",
}: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] =
    useState(initialQuery);
  const [suggestions, setSuggestions] =
    useState<SearchSuggestions>(
      emptySuggestions
    );
  const [loadingSuggestions, setLoadingSuggestions] =
    useState(false);
  const [suggestionsOpen, setSuggestionsOpen] =
    useState(false);
  const wrapperRef =
    useRef<HTMLDivElement>(null);

  const cleanSuggestionQuery = query.trim();
  const hasSuggestions =
    suggestions.users.length > 0 ||
    suggestions.artworks.length > 0 ||
    suggestions.categories.length > 0 ||
    suggestions.tags.length > 0;

  useEffect(() => {
    function handlePointerDown(
      event: MouseEvent
    ) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(
          event.target as Node
        )
      ) {
        setSuggestionsOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handlePointerDown
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handlePointerDown
      );
    };
  }, []);

  useEffect(() => {
    if (cleanSuggestionQuery.length < 2) {
      return;
    }

    const controller =
      new AbortController();
    const timeoutId = window.setTimeout(
      async () => {
        setLoadingSuggestions(true);

        try {
          const response = await fetch(
            `/api/search?q=${encodeURIComponent(
              cleanSuggestionQuery
            )}`,
            {
              signal: controller.signal,
            }
          );
          const data = await response.json();

          if (
            response.ok &&
            data.success
          ) {
            setSuggestions({
              users: data.users || [],
              artworks: data.artworks || [],
              categories:
                data.categories || [],
              tags: data.tags || [],
            });
            setSuggestionsOpen(true);
          }
        } catch (error) {
          if (
            error instanceof DOMException &&
            error.name === "AbortError"
          ) {
            return;
          }

          console.error(error);
        } finally {
          setLoadingSuggestions(false);
        }
      },
      220
    );

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [cleanSuggestionQuery]);

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
    setSuggestionsOpen(false);
  };

  return (
    <div ref={wrapperRef}>
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
            onChange={(event) => {
              const nextQuery =
                event.target.value;
              setQuery(nextQuery);

              if (
                nextQuery.trim().length < 2
              ) {
                setSuggestions(
                  emptySuggestions
                );
                setSuggestionsOpen(false);
                setLoadingSuggestions(false);
              } else {
                setSuggestionsOpen(true);
              }
            }}
            onFocus={() => {
              if (
                cleanSuggestionQuery.length >=
                  2 &&
                (hasSuggestions ||
                  loadingSuggestions)
              ) {
                setSuggestionsOpen(true);
              }
            }}
            className="h-14 w-full rounded-2xl border border-slate-200 bg-white pl-14 pr-12 text-base text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
            placeholder="Search artists, artworks, categories, tags..."
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setSuggestions(emptySuggestions);
                setSuggestionsOpen(false);
                router.push("/search");
              }}
              className="absolute right-4 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label="Clear search"
            >
              <X size={17} />
            </button>
          )}

          {suggestionsOpen &&
            cleanSuggestionQuery.length >= 2 && (
              <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                <div className="max-h-[440px] overflow-y-auto p-2">
                  {loadingSuggestions && (
                    <div className="flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold text-slate-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Searching AOIE...
                    </div>
                  )}

                  {!loadingSuggestions &&
                    !hasSuggestions && (
                      <div className="rounded-xl px-3 py-4 text-sm text-slate-500">
                        No quick suggestions.
                      </div>
                    )}

                  {suggestions.artworks.length >
                    0 && (
                    <SuggestionGroup title="Artworks">
                      {suggestions.artworks
                        .slice(0, 6)
                        .map((artwork) => (
                          <Link
                            key={artwork.id}
                            href={`/artwork/${artwork.id}`}
                            onClick={() =>
                              setSuggestionsOpen(
                                false
                              )
                            }
                            className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-slate-50"
                          >
                            <span className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                              <img
                                src={
                                  artwork.imageUrl
                                }
                                alt={artwork.title}
                                className="h-full w-full object-cover"
                              />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-bold text-slate-950">
                                {artwork.title}
                              </span>
                              <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                                <span className="font-semibold text-cyan-700">
                                  {artwork.category}
                                </span>
                                {artwork.artistName && (
                                  <span className="truncate text-slate-500">
                                    by {
                                      artwork.artistName
                                    }
                                  </span>
                                )}
                              </span>
                              {artwork.tags &&
                                artwork.tags.length >
                                  0 && (
                                  <span className="mt-1 block truncate text-xs text-slate-400">
                                    {artwork.tags
                                      .slice(0, 3)
                                      .map(
                                        (tag) =>
                                          `#${tag}`
                                      )
                                      .join(" ")}
                                  </span>
                                )}
                            </span>
                            <ImageIcon className="h-4 w-4 shrink-0 text-slate-400" />
                          </Link>
                        ))}
                    </SuggestionGroup>
                  )}

                  {suggestions.users.length > 0 && (
                    <SuggestionGroup title="People">
                      {suggestions.users
                        .slice(0, 5)
                        .map((user) => {
                          const isArtist =
                            user.role ===
                            "artist";
                          const content = (
                            <>
                              <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-950 text-white">
                                {user.avatar ? (
                                  <img
                                    src={
                                      user.avatar
                                    }
                                    alt={
                                      user.displayName
                                    }
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <UserRound
                                    size={17}
                                  />
                                )}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="flex min-w-0 items-center gap-1.5">
                                  <span className="truncate text-sm font-bold text-slate-950">
                                    {
                                      user.displayName
                                    }
                                  </span>
                                  {isArtist && (
                                    <BadgeCheck className="h-4 w-4 shrink-0 fill-cyan-500 text-white" />
                                  )}
                                </span>
                                <span className="block truncate text-xs text-slate-500">
                                  @{user.username}
                                </span>
                                {(user.location ||
                                  user.bio) && (
                                  <span className="mt-0.5 block truncate text-xs text-slate-400">
                                    {user.location ||
                                      user.bio}
                                  </span>
                                )}
                              </span>
                            </>
                          );

                          return isArtist ? (
                            <Link
                              key={user.id}
                              href={`/artist/${user.username}`}
                              onClick={() =>
                                setSuggestionsOpen(
                                  false
                                )
                              }
                              className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-slate-50"
                            >
                              {content}
                            </Link>
                          ) : (
                            <button
                              key={user.id}
                              type="button"
                              onClick={() => {
                                setQuery(
                                  user.username
                                );
                                submitSearch(
                                  user.username
                                );
                              }}
                              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-slate-50"
                            >
                              {content}
                            </button>
                          );
                        })}
                    </SuggestionGroup>
                  )}

                  {(suggestions.categories
                    .length > 0 ||
                    suggestions.tags.length > 0) && (
                    <SuggestionGroup title="Quick filters">
                      <div className="flex flex-wrap gap-2 px-3 py-2">
                        {suggestions.categories.map(
                          (category) => (
                            <button
                              key={`category-${category}`}
                              type="button"
                              onClick={() => {
                                setQuery(category);
                                submitSearch(
                                  category
                                );
                              }}
                              className="inline-flex items-center gap-1.5 rounded-full bg-cyan-50 px-3 py-1.5 text-xs font-bold text-cyan-700 transition hover:bg-cyan-100"
                            >
                              <Tag size={13} />
                              {category}
                            </button>
                          )
                        )}
                        {suggestions.tags.map(
                          (tag) => (
                            <button
                              key={`tag-${tag}`}
                              type="button"
                              onClick={() => {
                                setQuery(tag);
                                submitSearch(tag);
                              }}
                              className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-200"
                            >
                              <Hash size={13} />
                              {tag}
                            </button>
                          )
                        )}
                      </div>
                    </SuggestionGroup>
                  )}

                  {hasSuggestions && (
                    <div className="border-t border-slate-100 p-2">
                      <button
                        type="button"
                        onClick={() =>
                          submitSearch()
                        }
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
                      >
                        View all results for “{cleanSuggestionQuery}”
                      </button>
                    </div>
                  )}
                </div>
              </div>
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

function SuggestionGroup({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="py-1">
      <p className="px-3 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
        {title}
      </p>
      {children}
    </div>
  );
}
