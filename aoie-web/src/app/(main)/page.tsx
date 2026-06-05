import { getServerSession } from "next-auth";
import { Types } from "mongoose";

import HomeExperience, {
  HomeArtist,
  HomeArtwork,
  HomeCollection,
} from "@/components/home/HomeExperience";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";

import Artwork from "@/models/Artwork";
import User from "@/models/User";
import UserInteraction from "@/models/UserInteraction";

interface RawArtistProfile {
  displayName?: string;
  bio?: string;
  location?: string;
  avatar?: string;
  banner?: string;
}

interface RawArtist {
  _id?: Types.ObjectId;
  username?: string | null;
  artistProfile?: RawArtistProfile;
}

interface RawArtwork {
  _id: Types.ObjectId;
  title: string;
  imageUrl: string;
  category: string;
  tags?: string[];
  likesCount?: number;
  views?: number;
  artist?: RawArtist;
}

interface RankedArtwork {
  _id: Types.ObjectId;
  score: number;
}

const defaultArtist =
  "AOIE artist";

function getArtistName(
  artist?: RawArtist
) {
  return (
    artist?.artistProfile?.displayName ||
    artist?.username ||
    defaultArtist
  );
}

function serializeArtwork(
  artwork: RawArtwork
): HomeArtwork {
  return {
    id: artwork._id.toString(),
    title: artwork.title,
    imageUrl: artwork.imageUrl,
    category: artwork.category,
    tags: artwork.tags || [],
    likesCount: artwork.likesCount || 0,
    views: artwork.views || 0,
    artistUsername:
      artwork.artist?.username || "",
    artistName: getArtistName(
      artwork.artist
    ),
    artistAvatar:
      artwork.artist?.artistProfile
        ?.avatar || "",
  };
}

function serializeArtist(
  artist: RawArtist
): HomeArtist {
  const username =
    artist.username || "artist";
  const profile =
    artist.artistProfile || {};

  return {
    id:
      artist._id?.toString() ||
      username,
    username,
    displayName:
      profile.displayName || username,
    avatar: profile.avatar || "",
    banner: profile.banner || "",
    bio: profile.bio || "",
    location: profile.location || "",
  };
}

function uniqueArtworks(
  artworks: HomeArtwork[]
) {
  const seen = new Set<string>();

  return artworks.filter((artwork) => {
    if (seen.has(artwork.id)) {
      return false;
    }

    seen.add(artwork.id);
    return true;
  });
}

function buildCollections(
  artworks: HomeArtwork[]
) {
  const grouped = new Map<
    string,
    HomeArtwork[]
  >();

  artworks.forEach((artwork) => {
    const category =
      artwork.category || "Inspiration";
    const current =
      grouped.get(category) || [];

    grouped.set(category, [
      ...current,
      artwork,
    ]);
  });

  const boards = Array.from(
    grouped.entries()
  )
    .sort(
      (a, b) =>
        b[1].length - a[1].length
    )
    .slice(0, 3)
    .map(
      ([category, boardArtworks]) =>
        ({
          name:
            category === "Other"
              ? "Fresh visual notes"
              : `${category} board`,
          category,
          images: boardArtworks
            .slice(0, 4)
            .map((artwork) => ({
              id: artwork.id,
              title: artwork.title,
              imageUrl:
                artwork.imageUrl,
            })),
          count: boardArtworks.length,
        }) satisfies HomeCollection
    );

  if (
    boards.length === 0 &&
    artworks.length > 0
  ) {
    return [
      {
        name: "Saved inspiration",
        category: "AOIE",
        images: artworks
          .slice(0, 4)
          .map((artwork) => ({
            id: artwork.id,
            title: artwork.title,
            imageUrl:
              artwork.imageUrl,
          })),
        count: artworks.length,
      },
    ];
  }

  return boards;
}

async function getTrendingIds() {
  const ranked =
    (await UserInteraction.aggregate([
      {
        $match: {
          $expr: {
            $gte: [
              "$createdAt",
              {
                $subtract: [
                  "$$NOW",
                  7 *
                    24 *
                    60 *
                    60 *
                    1000,
                ],
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
                    $eq: [
                      "$_id.type",
                      "view",
                    ],
                  },
                  then: 1,
                },
                {
                  case: {
                    $eq: [
                      "$_id.type",
                      "click",
                    ],
                  },
                  then: 2,
                },
                {
                  case: {
                    $eq: [
                      "$_id.type",
                      "like",
                    ],
                  },
                  then: 5,
                },
                {
                  case: {
                    $eq: [
                      "$_id.type",
                      "save",
                    ],
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
                    $eq: [
                      "$_id.type",
                      "share",
                    ],
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
        $limit: 10,
      },
    ])) as RankedArtwork[];

  return ranked.map((item) =>
    item._id.toString()
  );
}

export default async function HomePage() {
  const session =
    await getServerSession(authOptions);

  await connectDB();

  const trendingIds =
    await getTrendingIds();

  const [
    featuredDocs,
    fallbackTrendingDocs,
    artistDocs,
    artworkCount,
    artistCount,
  ] = await Promise.all([
    Artwork.find({
      isPublished: true,
    })
      .select(
        "title imageUrl category tags likesCount views artist createdAt"
      )
      .populate(
        "artist",
        "username artistProfile.displayName artistProfile.avatar"
      )
      .sort({
        likesCount: -1,
        views: -1,
        createdAt: -1,
      })
      .limit(14)
      .lean(),
    Artwork.find({
      isPublished: true,
      ...(trendingIds.length > 0
        ? {
            _id: {
              $in: trendingIds,
            },
          }
        : {}),
    })
      .select(
        "title imageUrl category tags likesCount views artist createdAt"
      )
      .populate(
        "artist",
        "username artistProfile.displayName artistProfile.avatar"
      )
      .sort({
        likesCount: -1,
        views: -1,
        createdAt: -1,
      })
      .limit(10)
      .lean(),
    User.find({
      role: "artist",
      username: {
        $type: "string",
      },
    })
      .select(
        "username artistProfile.displayName artistProfile.bio artistProfile.location artistProfile.avatar artistProfile.banner artistProfile.isArtistProfileComplete createdAt"
      )
      .sort({
        "artistProfile.isArtistProfileComplete": -1,
        createdAt: -1,
      })
      .limit(8)
      .lean(),
    Artwork.countDocuments({
      isPublished: true,
    }),
    User.countDocuments({
      role: "artist",
    }),
  ]);

  const featuredArtworks =
    uniqueArtworks(
      (
        featuredDocs as unknown as RawArtwork[]
      ).map(serializeArtwork)
    );
  const fallbackTrending =
    (
      fallbackTrendingDocs as unknown as RawArtwork[]
    ).map(serializeArtwork);
  const trendingArtworks =
    trendingIds.length > 0
      ? trendingIds
          .map((id) =>
            fallbackTrending.find(
              (artwork) =>
                artwork.id === id
            )
          )
          .filter(
            (
              artwork
            ): artwork is HomeArtwork =>
              Boolean(artwork)
          )
      : fallbackTrending;
  const allArtworks =
    uniqueArtworks([
      ...featuredArtworks,
      ...fallbackTrending,
    ]);

  return (
    <HomeExperience
      featuredArtworks={
        featuredArtworks
      }
      trendingArtworks={
        trendingArtworks.length > 0
          ? trendingArtworks
          : featuredArtworks.slice(0, 8)
      }
      artists={(
        artistDocs as unknown as RawArtist[]
      ).map(serializeArtist)}
      collections={buildCollections(
        allArtworks
      )}
      artworkCount={artworkCount}
      artistCount={artistCount}
      isLoggedIn={Boolean(
        session?.user?.id
      )}
    />
  );
}