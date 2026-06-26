import { getServerSession } from "next-auth";
import Link from "next/link";
import {
  BadgeCheck,
  Image as ImageIcon,
  Search,
  Sparkles,
  UserRound,
} from "lucide-react";
import { Types } from "mongoose";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";

import Artwork from "@/models/Artwork";
import Like from "@/models/Like";
import Save from "@/models/Save";
import User from "@/models/User";

import ArtworkCard from "@/components/artwork/ArtworkCard";
import SearchBar from "@/components/search/SearchBar";

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
  }>;
}

interface SearchUser {
  _id: Types.ObjectId;
  username?: string | null;
  role: string;
  artistProfile?: {
    displayName?: string;
    avatar?: string;
    bio?: string;
    location?: string;
  };
}

interface SearchArtwork {
  _id: Types.ObjectId;
  title: string;
  imageUrl: string;
  category: string;
  likesCount: number;
  artist?: {
    username?: string;
    artistProfile?: {
      displayName?: string;
      avatar?: string;
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
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}

export default async function SearchPage({
  searchParams,
}: SearchPageProps) {
  const session =
    await getServerSession(authOptions);
  const { q = "" } = await searchParams;
  const query = q.trim();

  await connectDB();

  const regex = query
    ? new RegExp(escapeRegex(query), "i")
    : null;

  const [users, artworks] = regex
    ? await Promise.all([
        User.find({
          username: {
            $ne: null,
          },
          $or: [
            {
              username: regex,
            },
            {
              "artistProfile.displayName":
                regex,
            },
            {
              "artistProfile.bio": regex,
            },
            {
              "artistProfile.location":
                regex,
            },
          ],
        })
          .select(
            "username role artistProfile"
          )
          .limit(8)
          .lean(),
        Artwork.find({
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
            "username artistProfile.displayName artistProfile.avatar"
          )
          .sort({
            createdAt: -1,
          })
          .limit(30)
          .lean(),
      ])
    : [[], []];

  const typedUsers =
    users as unknown as SearchUser[];
  const typedArtworks =
    artworks as unknown as SearchArtwork[];
  const artworkIds = typedArtworks.map(
    (artwork) => artwork._id
  );

  const [likedItems, savedItems] =
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
      likedItems as unknown as ArtworkLike[]
    ).map((item) => item.artwork.toString())
  );
  const savedSet = new Set(
    (
      savedItems as unknown as ArtworkSave[]
    ).map((item) => item.artwork.toString())
  );

  const hasResults =
    typedUsers.length > 0 ||
    typedArtworks.length > 0;

  return (
    <section className="space-y-8">
      <div className="relative z-20 rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="relative p-6 sm:p-8">
          <div className="pointer-events-none absolute right-0 top-0 h-36 w-36 rounded-bl-full bg-cyan-50" />
          <div className="relative">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-cyan-50 px-3 py-1.5 text-sm font-semibold text-cyan-700">
              <Sparkles size={16} />
              Discovery
            </div>

            <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
              <div>
                <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
                  Search AOIE
                </h1>
                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
                  Find artists, artwork
                  titles, categories, and
                  tags from one focused
                  search.
                </p>
              </div>

              <SearchBar
                key={query}
                initialQuery={query}
              />
            </div>
          </div>
        </div>
      </div>

      {!query ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <Search size={24} />
          </span>
          <h2 className="mt-5 text-xl font-semibold text-slate-950">
            Start exploring
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            Search by artist username,
            artwork title, category, or
            tag. Quick searches above can
            get you moving.
          </p>
        </div>
      ) : !hasResults ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600">
            <Search size={24} />
          </span>
          <h2 className="mt-5 text-xl font-semibold text-slate-950">
            No results for “{query}”
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            Try a broader category,
            another artist name, or a
            shorter tag.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {typedUsers.length > 0 && (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-700">
                    People
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                    Matching accounts
                  </h2>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">
                  {typedUsers.length}
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {typedUsers.map((user) => {
                  const username =
                    user.username || "";
                  const displayName =
                    user.artistProfile
                      ?.displayName ||
                    username;
                  const avatar =
                    user.artistProfile
                      ?.avatar || "";
                  const isArtist =
                    user.role === "artist";
                  const cardContent = (
                    <>
                      <div className="flex items-center gap-3">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-950 text-base font-semibold text-white">
                          {avatar ? (
                            <img
                              src={avatar}
                              alt={displayName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <UserRound
                              size={19}
                            />
                          )}
                        </span>
                        <span className="min-w-0">
                          <span className="flex items-center gap-1.5">
                            <span className="truncate text-sm font-semibold text-slate-950">
                              {displayName}
                            </span>
                            {isArtist && (
                              <BadgeCheck
                                size={15}
                                className="shrink-0 fill-cyan-500 text-white"
                              />
                            )}
                          </span>
                          <span className="block truncate text-xs text-slate-500">
                            @{username}
                          </span>
                        </span>
                      </div>
                      {user.artistProfile?.bio && (
                        <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">
                          {
                            user.artistProfile
                              .bio
                          }
                        </p>
                      )}
                      <span className="mt-3 inline-flex rounded-full bg-white px-2.5 py-1 text-xs font-semibold capitalize text-slate-600 ring-1 ring-slate-200">
                        {isArtist
                          ? "Artist"
                          : "User"}
                      </span>
                    </>
                  );

                  return isArtist ? (
                    <Link
                      key={user._id.toString()}
                      href={`/artist/${username}`}
                      className="group rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-cyan-200 hover:bg-cyan-50/50"
                    >
                      {cardContent}
                    </Link>
                  ) : (
                    <div
                      key={user._id.toString()}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      {cardContent}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {typedArtworks.length > 0 && (
            <section>
              <div className="mb-5 flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-700">
                    Artworks
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                    Artwork results
                  </h2>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200">
                  <ImageIcon size={16} />
                  {typedArtworks.length}
                </span>
              </div>

              <div className="columns-2 gap-4 sm:columns-3 lg:columns-4 xl:columns-5">
                {typedArtworks.map(
                  (artwork, index) => {
                    const id =
                      artwork._id.toString();
                    const artistUsername =
                      artwork.artist?.username;

                    return (
                      <ArtworkCard
                        key={id}
                        id={id}
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
                        artistAvatar={
                          artwork.artist
                            ?.artistProfile
                            ?.avatar || ""
                        }
                        likesCount={
                          artwork.likesCount
                        }
                        isLiked={likedSet.has(
                          id
                        )}
                        isSaved={savedSet.has(
                          id
                        )}
                        priority={index < 8}
                      />
                    );
                  }
                )}
              </div>
            </section>
          )}
        </div>
      )}
    </section>
  );
}
