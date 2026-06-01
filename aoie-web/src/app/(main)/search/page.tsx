import Link from "next/link";
import { Types } from "mongoose";

import { connectDB } from "@/lib/db";

import User from "@/models/User";
import Artwork from "@/models/Artwork";

import SearchBar from "@/components/search/SearchBar";

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
  }>;
}

interface ArtistResult {
  _id: Types.ObjectId;
  username: string;
  artistProfile?: {
    displayName?: string;
  };
}

interface ArtworkResult {
  _id: Types.ObjectId;
  title: string;
  imageUrl: string;
  category: string;
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export default async function SearchPage({
  searchParams,
}: SearchPageProps) {
  const { q = "" } =
    await searchParams;

  const query = q.trim();
  const hasQuery = query.length > 0;

  await connectDB();

  const regex = hasQuery
    ? new RegExp(escapeRegex(query), "i")
    : null;

  const artists = regex
    ? ((await User.find({
        role: "artist",
        $or: [
          {
            username: regex,
          },
          {
            "artistProfile.displayName":
              regex,
          },
        ],
      })
        .select("username artistProfile")
        .limit(10)
        .lean()) as unknown as ArtistResult[])
    : [];

  const artworks = regex
    ? ((await Artwork.find({
        isPublished: true,
        $or: [
          {
            title: regex,
          },
          {
            category: regex,
          },
          {
            tags: regex,
          },
        ],
      })
        .select("title imageUrl category")
        .limit(20)
        .lean()) as unknown as ArtworkResult[])
    : [];

  const hasResults =
    artists.length > 0 ||
    artworks.length > 0;

  return (
    <section>
      <div className="mb-8 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-700">
          Discover
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">
          Search AOIE
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Find artists, artworks, categories, and tags from one place.
        </p>

        <div className="mt-5">
          <SearchBar initialQuery={query} />
        </div>
      </div>

      {!hasQuery ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
          <h2 className="text-lg font-semibold text-slate-950">
            Start typing to search
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Try an artist username, artwork title, category, or tag.
          </p>
        </div>
      ) : !hasResults ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
          <h2 className="text-lg font-semibold text-slate-950">
            No results found
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Nothing matched &quot;{query}&quot;. Try another search.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          <section>
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold text-slate-950">
                Artists
              </h2>
              <span className="text-sm font-medium text-slate-500">
                {artists.length}
              </span>
            </div>

            {artists.length === 0 ? (
              <p className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-500">
                No artists matched this search.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {artists.map((artist) => (
                  <Link
                    key={artist._id.toString()}
                    href={`/artist/${artist.username}`}
                    className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-cyan-200 hover:bg-cyan-50/40"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white">
                      {artist.username
                        .slice(0, 1)
                        .toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-950">
                        {artist.artistProfile
                          ?.displayName ||
                          artist.username}
                      </p>
                      <p className="truncate text-sm text-slate-500">
                        @{artist.username}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold text-slate-950">
                Artworks
              </h2>
              <span className="text-sm font-medium text-slate-500">
                {artworks.length}
              </span>
            </div>

            {artworks.length === 0 ? (
              <p className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-500">
                No artworks matched this search.
              </p>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {artworks.map((artwork) => (
                  <Link
                    key={artwork._id.toString()}
                    href={`/artwork/${artwork._id.toString()}`}
                    className="group overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
                  >
                    <div className="aspect-square overflow-hidden">
                      <img
                        src={artwork.imageUrl}
                        alt={artwork.title}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    </div>

                    <div className="p-4">
                      <h3 className="line-clamp-1 font-semibold text-slate-950">
                        {artwork.title}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {artwork.category}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </section>
  );
}
