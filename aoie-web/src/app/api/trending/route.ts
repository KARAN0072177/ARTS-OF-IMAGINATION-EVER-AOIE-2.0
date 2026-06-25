import { getServerSession } from "next-auth";
import { Types } from "mongoose";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";

import Artwork from "@/models/Artwork";
import Like from "@/models/Like";
import Save from "@/models/Save";
import UserInteraction from "@/models/UserInteraction";

interface TrendingArtist {
  username?: string;
  artistProfile?: {
    displayName?: string;
    avatar?: string;
  };
}

interface TrendingArtwork {
  _id: Types.ObjectId;
  title: string;
  imageUrl: string;
  category: string;
  likesCount: number;
  artist?: TrendingArtist;
}

interface ArtworkLike {
  artwork: Types.ObjectId;
}

interface ArtworkSave {
  artwork: Types.ObjectId;
}

const rangeHours = {
  today: 24,
  week: 24 * 7,
  month: 24 * 30,
};

function getRange(value: string | null) {
  if (
    value === "today" ||
    value === "month"
  ) {
    return value;
  }

  return "week";
}

export async function GET(req: Request) {
  try {
    const session =
      await getServerSession(authOptions);
    const { searchParams } =
      new URL(req.url);
    const range = getRange(
      searchParams.get("range")
    );
    const limit = Math.min(
      Math.max(
        Number.parseInt(
          searchParams.get("limit") || "12",
          10
        ) || 12,
        1
      ),
      24
    );
    const since = new Date(
      Date.now() -
        rangeHours[range] *
          60 *
          60 *
          1000
    );

    await connectDB();

    const ranked =
      await UserInteraction.aggregate([
        {
          $match: {
            createdAt: {
              $gte: since,
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
                      $eq: [
                        "$_id.type",
                        "click",
                      ],
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
          $limit: limit * 3,
        },
      ]);

    let artworkIds: Types.ObjectId[] = ranked
      .map((item) => item._id)
      .filter((id): id is Types.ObjectId =>
        Types.ObjectId.isValid(id)
      );

    if (artworkIds.length < limit) {
      const remainingCount = limit - artworkIds.length;
      const fallbackArtworks = await Artwork.find({
        _id: { $nin: artworkIds },
        isPublished: true,
      })
        .select("_id")
        .sort({ likesCount: -1, createdAt: -1 })
        .limit(remainingCount)
        .lean();
      
      const fallbackIds = fallbackArtworks.map((art) => art._id as Types.ObjectId);
      artworkIds = [...artworkIds, ...fallbackIds];
    }

    if (artworkIds.length === 0) {
      return Response.json({
        success: true,
        artworks: [],
      });
    }

    const artworks =
      (await Artwork.find({
        _id: {
          $in: artworkIds,
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
        .lean()) as unknown as TrendingArtwork[];

    const scoreMap = new Map(
      ranked.map((item) => [
        item._id.toString(),
        item.score,
      ])
    );
    const artworkMap = new Map(
      artworks.map((artwork) => [
        artwork._id.toString(),
        artwork,
      ])
    );
    const sortedArtworks = artworkIds
      .map((id) => artworkMap.get(id.toString()))
      .filter(
        (artwork): artwork is TrendingArtwork =>
          Boolean(artwork)
      )
      .slice(0, limit);
    const sortedArtworkIds =
      sortedArtworks.map((artwork) =>
        artwork._id.toString()
      );

    const [likedArtworkIds, savedArtworkIds] =
      session?.user?.id &&
      sortedArtworkIds.length > 0
        ? await Promise.all([
            Like.find({
              user: session.user.id,
              artwork: {
                $in: sortedArtworkIds,
              },
            })
              .select("artwork")
              .lean(),
            Save.find({
              user: session.user.id,
              artwork: {
                $in: sortedArtworkIds,
              },
            })
              .select("artwork")
              .lean(),
          ])
        : [[], []];

    const likedSet = new Set(
      (
        likedArtworkIds as unknown as ArtworkLike[]
      ).map((like) =>
        like.artwork.toString()
      )
    );
    const savedSet = new Set(
      (
        savedArtworkIds as unknown as ArtworkSave[]
      ).map((save) =>
        save.artwork.toString()
      )
    );

    return Response.json({
      success: true,
      artworks: sortedArtworks.map(
        (artwork) => {
          const id = artwork._id.toString();
          const artistUsername =
            artwork.artist?.username;

          return {
            id,
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
            trendingScore:
              scoreMap.get(id) || 0,
            isLiked: likedSet.has(id),
            isSaved: savedSet.has(id),
          };
        }
      ),
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        success: false,
        message:
          "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
