import { getServerSession } from "next-auth";
import { Types } from "mongoose";
import Link from "next/link";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";

import Artwork from "@/models/Artwork";
import Like from "@/models/Like";
import Save from "@/models/Save";
import UserInteraction from "@/models/UserInteraction";

import GalleryFeed, {
  GalleryArtwork,
} from "@/components/artwork/GalleryFeed";
import TrendingSection from "@/components/artwork/TrendingSection";

interface FeedArtwork {
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

interface TrendingAggregate {
  _id: Types.ObjectId;
  score: number;
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
      "title imageUrl category likesCount artist"
    )
    .populate(
      "artist",
      "username artistProfile.displayName artistProfile.avatar"
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

  const trendingRanked =
    (await UserInteraction.aggregate([
      {
        $match: {
          $expr: {
            $gte: [
              "$createdAt",
              {
                $dateSubtract: {
                  startDate: "$$NOW",
                  unit: "day",
                  amount: 7,
                },
              },
            ],
          },
        },
      },
      {
        $group: {
          _id: {
            artwork: "$artwork",
            user: "$user",
            type: "$type",
          },
          count: {
            $sum: 1,
          },
          latestActivity: {
            $max: "$createdAt",
          },
        },
      },
      {
        $project: {
          artwork: "$_id.artwork",
          latestActivity: 1,
          cappedCount: {
            $min: [
              "$count",
              {
                $switch: {
                  branches: [
                    {
                      case: {
                        $eq: [
                          "$_id.type",
                          "view",
                        ],
                      },
                      then: 10,
                    },
                    {
                      case: {
                        $eq: [
                          "$_id.type",
                          "click",
                        ],
                      },
                      then: 5,
                    },
                    {
                      case: {
                        $eq: [
                          "$_id.type",
                          "comment",
                        ],
                      },
                      then: 5,
                    },
                    {
                      case: {
                        $eq: [
                          "$_id.type",
                          "share",
                        ],
                      },
                      then: 3,
                    },
                    {
                      case: {
                        $eq: [
                          "$_id.type",
                          "download",
                        ],
                      },
                      then: 2,
                    },
                  ],
                  default: 1,
                },
              },
            ],
          },
          weight: {
            $switch: {
              branches: [
                {
                  case: {
                    $eq: ["$_id.type", "view"],
                  },
                  then: 1,
                },
                {
                  case: {
                    $eq: ["$_id.type", "click"],
                  },
                  then: 2,
                },
                {
                  case: {
                    $eq: ["$_id.type", "like"],
                  },
                  then: 5,
                },
                {
                  case: {
                    $eq: ["$_id.type", "save"],
                  },
                  then: 6,
                },
                {
                  case: {
                    $eq: [
                      "$_id.type",
                      "comment",
                    ],
                  },
                  then: 4,
                },
                {
                  case: {
                    $eq: ["$_id.type", "share"],
                  },
                  then: 8,
                },
                {
                  case: {
                    $eq: [
                      "$_id.type",
                      "download",
                    ],
                  },
                  then: 10,
                },
              ],
              default: 1,
            },
          },
        },
      },
      {
        $group: {
          _id: "$artwork",
          score: {
            $sum: {
              $multiply: [
                "$cappedCount",
                "$weight",
              ],
            },
          },
          latestActivity: {
            $max: "$latestActivity",
          },
        },
      },
      {
        $sort: {
          score: -1,
          latestActivity: -1,
        },
      },
      {
        $limit: 12,
      },
    ])) as TrendingAggregate[];
  const trendingIds = trendingRanked.map(
    (item) => item._id
  );
  const trendingArtworks =
    trendingIds.length > 0
      ? ((await Artwork.find({
          _id: {
            $in: trendingIds,
          },
          isPublished: true,
        })
          .select(
            "title imageUrl category likesCount artist"
          )
          .populate(
            "artist",
            "username artistProfile.displayName artistProfile.avatar"
          )
          .lean()) as unknown as FeedArtwork[])
      : [];
  const [
    trendingLikedArtworkIds,
    trendingSavedArtworkIds,
  ] =
    session?.user?.id && trendingIds.length > 0
      ? await Promise.all([
          Like.find({
            user: session.user.id,
            artwork: {
              $in: trendingIds,
            },
          })
            .select("artwork")
            .lean(),
          Save.find({
            user: session.user.id,
            artwork: {
              $in: trendingIds,
            },
          })
            .select("artwork")
            .lean(),
        ])
      : [[], []];
  const trendingLikedSet = new Set(
    (
      trendingLikedArtworkIds as unknown as ArtworkLike[]
    ).map((like) => like.artwork.toString())
  );
  const trendingSavedSet = new Set(
    (
      trendingSavedArtworkIds as unknown as ArtworkSave[]
    ).map((save) => save.artwork.toString())
  );
  const trendingMap = new Map(
    trendingArtworks.map((artwork) => [
      artwork._id.toString(),
      artwork,
    ])
  );
  const trendingGalleryArtworks =
    trendingIds
      .map((id) =>
        trendingMap.get(id.toString())
      )
      .filter(
        (artwork): artwork is FeedArtwork =>
          Boolean(artwork)
      )
      .map((artwork) => {
        const artworkId =
          artwork._id.toString();
        const artistUsername =
          artwork.artist?.username;

        return {
          id: artworkId,
          title: artwork.title,
          imageUrl: artwork.imageUrl,
          category: artwork.category,
          artistUsername,
          artistName:
            artwork.artist?.artistProfile
              ?.displayName ||
            artistUsername,
          artistAvatar:
            artwork.artist?.artistProfile
              ?.avatar || "",
          likesCount:
            artwork.likesCount || 0,
          isLiked:
            trendingLikedSet.has(artworkId),
          isSaved:
            trendingSavedSet.has(artworkId),
        };
      });

  const galleryArtworks: GalleryArtwork[] =
    artworks.map((artwork) => {
      const artworkId =
        artwork._id.toString();
      const artistUsername =
        artwork.artist?.username;

      return {
        id: artworkId,
        title: artwork.title,
        imageUrl: artwork.imageUrl,
        category: artwork.category,
        artistUsername,
        artistName:
          artwork.artist?.artistProfile
            ?.displayName ||
          artistUsername,
        artistAvatar:
          artwork.artist?.artistProfile
            ?.avatar || "",
        likesCount:
          artwork.likesCount || 0,
        isLiked: likedSet.has(artworkId),
        isSaved: savedSet.has(artworkId),
      };
    });

  return (
    <section className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-950 sm:text-3xl">
              {selectedCategory ||
                "Artwork Feed"}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {totalCount}{" "}
              {totalCount === 1
                ? "artwork"
                : "artworks"}{" "}
              available
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/upload"
              className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Upload artwork
            </Link>
          </div>
        </div>

        <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
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
          {!selectedCategory && (
            <TrendingSection
              artworks={
                trendingGalleryArtworks
              }
            />
          )}

          <GalleryFeed
            initialArtworks={galleryArtworks}
            category={selectedCategory}
            initialPage={currentPage}
            totalCount={totalCount}
            totalPages={totalPages}
          />
        </>
      )}
    </section>
  );
}
