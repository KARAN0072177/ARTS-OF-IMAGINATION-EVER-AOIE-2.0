import { getServerSession } from "next-auth";
import { Types } from "mongoose";
import Link from "next/link";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";

import Artwork from "@/models/Artwork";
import Like from "@/models/Like";

import ArtworkCard from "@/components/artwork/ArtworkCard";

interface FeedArtwork {
  _id: Types.ObjectId;
  title: string;
  imageUrl: string;
  category: string;
  likesCount: number;
  createdAt: Date;
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

interface FeedPageProps {
  searchParams: Promise<{
    category?: string;
    page?: string;
  }>;
}

const categories = [
  "Digital Art",
  "Anime",
  "Fantasy",
  "Landscape",
  "Photography",
  "3D",
  "Pixel Art",
  "Other",
];

const pageSize = 24;

function getFeedHref({
  category,
  page,
}: {
  category?: string;
  page?: number;
}) {
  const params = new URLSearchParams();

  if (category) {
    params.set("category", category);
  }

  if (page && page > 1) {
    params.set("page", String(page));
  }

  const query = params.toString();

  return `/feed${query ? `?${query}` : ""}`;
}

export default async function FeedPage({
  searchParams,
}: FeedPageProps) {
  const session =
    await getServerSession(authOptions);

  const { category = "", page = "1" } =
    await searchParams;

  const selectedCategory =
    categories.includes(category)
      ? category
      : "";
  const requestedPage = Math.max(
    Number.parseInt(page, 10) || 1,
    1
  );

  await connectDB();

  const feedQuery = {
    isPublished: true,
    ...(selectedCategory
      ? { category: selectedCategory }
      : {}),
  };

  const totalCount =
    await Artwork.countDocuments(feedQuery);
  const totalPages = Math.max(
    Math.ceil(totalCount / pageSize),
    1
  );
  const currentPage = Math.min(
    requestedPage,
    totalPages
  );
  const skip =
    (currentPage - 1) * pageSize;

  const artworks = (await Artwork.find(feedQuery)
    .select(
      "title imageUrl category likesCount createdAt artist"
    )
    .populate(
      "artist",
      "username artistProfile.displayName"
    )
    .sort({
      createdAt: -1,
    })
    .skip(skip)
    .limit(pageSize)
    .lean()) as unknown as FeedArtwork[];

  const artworkIds = artworks.map(
    (artwork) => artwork._id
  );

  const likedArtworkIds =
    session?.user?.id && artworkIds.length > 0
      ? ((await Like.find({
          user: session.user.id,
          artwork: {
            $in: artworkIds,
          },
        })
          .select("artwork")
          .lean()) as unknown as ArtworkLike[])
      : ([] as ArtworkLike[]);

  const likedSet = new Set(
    likedArtworkIds.map((like) =>
      like.artwork.toString()
    )
  );

  return (
    <section>
      <div className="mb-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-700">
              Explore
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-950">
              Artwork Feed
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Discover fresh artwork from AOIE artists and filter by the styles you want to browse.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-md bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
              {totalCount}{" "}
              {totalCount === 1
                ? "artwork"
                : "artworks"}
            </div>

            <Link
              href="/upload"
              className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Upload artwork
            </Link>
          </div>
        </div>

        <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
          <Link
            href={getFeedHref({})}
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold transition ${
              !selectedCategory
                ? "bg-slate-950 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All
          </Link>

          {categories.map((item) => (
            <Link
              key={item}
              href={getFeedHref({
                category: item,
              })}
              className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                selectedCategory === item
                  ? "bg-slate-950 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {item}
            </Link>
          ))}
        </div>
      </div>

      {artworks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <h2 className="text-lg font-semibold text-slate-900">
            No artworks found
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            {selectedCategory
              ? `No published artworks in ${selectedCategory} yet.`
              : "Artists have not uploaded any artwork yet."}
          </p>

          {selectedCategory && (
            <Link
              href="/feed"
              className="mt-5 inline-flex rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              View all artwork
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between gap-3 text-sm text-slate-500">
            <span>
              Showing {skip + 1}-
              {Math.min(
                skip + artworks.length,
                totalCount
              )}{" "}
              of {totalCount}
            </span>

            {totalPages > 1 && (
              <span>
                Page {currentPage} of{" "}
                {totalPages}
              </span>
            )}
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
                  imageUrl={artwork.imageUrl}
                  category={artwork.category}
                  artistUsername={
                    artistUsername
                  }
                  artistName={
                    artwork.artist
                      ?.artistProfile
                      ?.displayName ||
                    artistUsername
                  }
                  createdAt={artwork.createdAt.toISOString()}
                  likesCount={artwork.likesCount}
                  isLiked={likedSet.has(
                    artworkId
                  )}
                />
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-3">
              {currentPage > 1 ? (
                <Link
                  href={getFeedHref({
                    category:
                      selectedCategory,
                    page:
                      currentPage - 1,
                  })}
                  className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Previous
                </Link>
              ) : (
                <span className="rounded-md border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-400">
                  Previous
                </span>
              )}

              {currentPage < totalPages ? (
                <Link
                  href={getFeedHref({
                    category:
                      selectedCategory,
                    page:
                      currentPage + 1,
                  })}
                  className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Next
                </Link>
              ) : (
                <span className="rounded-md bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-400">
                  Next
                </span>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}
