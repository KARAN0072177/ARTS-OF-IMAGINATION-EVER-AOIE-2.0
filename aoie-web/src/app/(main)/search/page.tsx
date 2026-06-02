import Link from "next/link";
import { Types } from "mongoose";
import { getServerSession } from "next-auth";
import { BadgeCheck } from "lucide-react";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";

import User from "@/models/User";
import Artwork from "@/models/Artwork";
import Like from "@/models/Like";
import Save from "@/models/Save";

import SearchBar from "@/components/search/SearchBar";
import ArtworkCard from "@/components/artwork/ArtworkCard";

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
  }>;
}

interface UserResult {
  _id: Types.ObjectId;
  username: string;
  role: "artist" | "user";
  artistProfile?: {
    displayName?: string;
  };
}

interface ArtworkResult {
  _id: Types.ObjectId;
  title: string;
  imageUrl: string;
  category: string;
  likesCount: number;
  artist?: {
    username?: string;
    artistProfile?: {
      displayName?: string;
    };
  };
}

interface ArtworkLike {
  artwork: Types.ObjectId;
}

interface ArtworkSave {
  artwork: Types.ObjectId;
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export default async function SearchPage({
  searchParams,
}: SearchPageProps) {
  const session =
    await getServerSession(authOptions);
  const { q = "" } =
    await searchParams;

  const query = q.trim();
  const hasQuery = query.length > 0;

  await connectDB();

  const regex = hasQuery
    ? new RegExp(escapeRegex(query), "i")
    : null;

  const users = regex
    ? ((await User.find({
        role: {
          $in: ["artist", "user"],
        },
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
        .select("username role artistProfile")
        .sort({
          role: 1,
          username: 1,
        })
        .limit(12)
        .lean()) as unknown as UserResult[])
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
        .select(
          "title imageUrl category likesCount artist"
        )
        .populate(
          "artist",
          "username artistProfile.displayName"
        )
        .limit(30)
        .lean()) as unknown as ArtworkResult[])
    : [];

  const artworkIds = artworks.map(
    (artwork) => artwork._id
  );

  const [likedArtworkIds, savedArtworkIds] =
    session?.user?.id && artworkIds.length > 0
      ? await Promise.all([
          Like.find({
            user: session.user.id,
            artwork: {
              $in: artworkIds,
            },
          })
            .select("artwork")
            .lean(),
          Save.find({
            user: session.user.id,
            artwork: {
              $in: artworkIds,
            },
          })
            .select("artwork")
            .lean(),
        ])
      : [[], []];

  const likedSet = new Set(
    (
      likedArtworkIds as unknown as ArtworkLike[]
    ).map((like) => like.artwork.toString())
  );
  const savedSet = new Set(
    (
      savedArtworkIds as unknown as ArtworkSave[]
    ).map((save) => save.artwork.toString())
  );

  const hasResults =
    users.length > 0 ||
    artworks.length > 0;
  const suggestions = [
    "Anime",
    "Digital Art",
    "Landscape",
    "Photography",
    "3D",
  ];

  return (
    <section className="space-y-8">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-950 sm:text-3xl">
              Search AOIE
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Find artists, artwork titles,
              categories, and tags from one
              focused search.
            </p>
          </div>

          {hasQuery && (
            <div className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-600">
              {users.length + artworks.length}{" "}
              results
            </div>
          )}
        </div>

        <div className="mt-5">
          <SearchBar initialQuery={query} />
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {suggestions.map((item) => (
            <Link
              key={item}
              href={`/search?q=${encodeURIComponent(
                item
              )}`}
              className="shrink-0 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-200"
            >
              {item}
            </Link>
          ))}
        </div>
      </div>

      {!hasQuery ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <h2 className="text-lg font-semibold text-slate-950">
            Search your gallery universe
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Try an artist username, artwork
            title, category, or tag.
          </p>
        </div>
      ) : !hasResults ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <h2 className="text-lg font-semibold text-slate-950">
            No results found
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Nothing matched &quot;{query}&quot;.
            Try another search.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-slate-950">
                Users
              </h2>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                {users.length}
              </span>
            </div>

            {users.length === 0 ? (
              <p className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-500">
                No users matched this search.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {users.map((user) => {
                  const isArtist =
                    user.role === "artist";
                  const displayName =
                    user.artistProfile
                      ?.displayName ||
                    user.username;
                  const content = (
                    <>
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white">
                        {user.username
                          .slice(0, 1)
                          .toUpperCase()}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-1.5 truncate font-semibold text-slate-950">
                          <span className="truncate">
                            {displayName}
                          </span>
                          {isArtist && (
                            <BadgeCheck
                              size={17}
                              className="shrink-0 fill-blue-500 text-white"
                              aria-label="Artist"
                            />
                          )}
                        </p>
                        <p className="truncate text-sm text-slate-500">
                          @{user.username}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          isArtist
                            ? "bg-blue-50 text-blue-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {isArtist
                          ? "Artist"
                          : "User"}
                      </span>
                    </>
                  );

                  return isArtist ? (
                    <Link
                      key={user._id.toString()}
                      href={`/artist/${user.username}`}
                      className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 transition hover:border-blue-200 hover:bg-blue-50/60"
                    >
                      {content}
                    </Link>
                  ) : (
                    <div
                      key={user._id.toString()}
                      className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4"
                    >
                      {content}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section>
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-slate-950">
                Artworks
              </h2>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                {artworks.length}
              </span>
            </div>

            {artworks.length === 0 ? (
              <p className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-500">
                No artworks matched this search.
              </p>
            ) : (
              <div className="columns-2 gap-4 sm:columns-3 lg:columns-4 xl:columns-5">
                {artworks.map((artwork) => {
                  const artworkId =
                    artwork._id.toString();
                  const artistUsername =
                    artwork.artist?.username;

                  return (
                    <ArtworkCard
                      key={artworkId}
                      id={artworkId}
                      title={artwork.title}
                      imageUrl={
                        artwork.imageUrl
                      }
                      category={
                        artwork.category
                      }
                      artistUsername={
                        artistUsername
                      }
                      artistName={
                        artwork.artist
                          ?.artistProfile
                          ?.displayName ||
                        artistUsername
                      }
                      likesCount={
                        artwork.likesCount || 0
                      }
                      isLiked={likedSet.has(
                        artworkId
                      )}
                      isSaved={savedSet.has(
                        artworkId
                      )}
                    />
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}
    </section>
  );
}
