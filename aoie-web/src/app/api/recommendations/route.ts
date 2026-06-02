import { getServerSession } from "next-auth";
import { Types } from "mongoose";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";

import Artwork from "@/models/Artwork";
import Like from "@/models/Like";
import Save from "@/models/Save";
import UserInteraction from "@/models/UserInteraction";

interface RecommendationArtwork {
  _id: Types.ObjectId;
  artist?: {
    username?: string;
    artistProfile?: {
      displayName?: string;
    };
  };
  title: string;
  imageUrl: string;
  category: string;
  tags: string[];
  likesCount: number;
  createdAt: Date;
}

function addWeight(
  map: Map<string, number>,
  key: string,
  weight: number
) {
  map.set(key, (map.get(key) || 0) + weight);
}

function getRankedKeys(
  map: Map<string, number>,
  limit: number
) {
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key]) => key);
}

function getRecentBoost(createdAt: Date) {
  const ageInDays =
    (Date.now() -
      new Date(createdAt).getTime()) /
    (1000 * 60 * 60 * 24);

  return Math.max(0, 8 - ageInDays * 0.4);
}

function toRecommendation(
  artwork: RecommendationArtwork,
  likedSet: Set<string>,
  savedSet: Set<string>
) {
  const id = artwork._id.toString();

  return {
    id,
    title: artwork.title,
    imageUrl: artwork.imageUrl,
    category: artwork.category,
    likesCount: artwork.likesCount || 0,
    artistUsername:
      artwork.artist?.username || "",
    artistName:
      artwork.artist?.artistProfile
        ?.displayName ||
      artwork.artist?.username ||
      "",
    isLiked: likedSet.has(id),
    isSaved: savedSet.has(id),
  };
}

export async function GET(req: Request) {
  try {
    const session =
      await getServerSession(authOptions);
    const { searchParams } =
      new URL(req.url);
    const artworkId =
      searchParams.get("artworkId") || "";

    if (
      artworkId &&
      !Types.ObjectId.isValid(artworkId)
    ) {
      return Response.json(
        {
          success: false,
          message: "Invalid artwork id",
        },
        {
          status: 400,
        }
      );
    }

    await connectDB();

    const currentArtwork = artworkId
      ? await Artwork.findById(artworkId)
          .select("category tags")
          .lean()
      : null;

    const userInteractions =
      session?.user?.id
        ? await UserInteraction.find({
            user: session.user.id,
          })
            .sort({ createdAt: -1 })
            .limit(100)
            .lean()
        : [];

    const categoryWeights =
      new Map<string, number>();
    const tagWeights =
      new Map<string, number>();
    const interactedArtworkIds = new Set<
      string
    >();

    userInteractions.forEach(
      (interaction, index) => {
        const recencyMultiplier = Math.max(
          0.35,
          1 - index / 140
        );
        const weight =
          interaction.weight *
          recencyMultiplier;

        interactedArtworkIds.add(
          interaction.artwork.toString()
        );

        addWeight(
          categoryWeights,
          interaction.category,
          weight
        );

        for (const tag of interaction.tags || []) {
          addWeight(
            tagWeights,
            tag,
            weight
          );
        }
      }
    );

    const preferredCategories =
      getRankedKeys(categoryWeights, 6);
    const strongestCategories =
      preferredCategories.slice(0, 3);
    const preferredTags = getRankedKeys(
      tagWeights,
      10
    );

    const currentArtworkId =
      artworkId || "";
    const excludedIds = Array.from(
      new Set([
        currentArtworkId,
        ...interactedArtworkIds,
      ].filter(Boolean))
    );

    const excludeQuery =
      excludedIds.length > 0
        ? {
            _id: {
              $nin: excludedIds,
            },
          }
        : {};

    if (currentArtwork?.category) {
      addWeight(
        categoryWeights,
        currentArtwork.category,
        8
      );

      if (
        !preferredCategories.includes(
          currentArtwork.category
        )
      ) {
        preferredCategories.unshift(
          currentArtwork.category
        );
      }
    }

    for (const tag of currentArtwork?.tags || []) {
      addWeight(tagWeights, tag, 4);

      if (!preferredTags.includes(tag)) {
        preferredTags.unshift(tag);
      }
    }

    const personalizedQuery =
      preferredCategories.length > 0 ||
      preferredTags.length > 0
        ? {
            isPublished: true,
            ...excludeQuery,
            $or: [
              ...preferredCategories.map(
                (category) => ({
                  category,
                })
              ),
              ...(preferredTags.length > 0
                ? [
                    {
                      tags: {
                        $in: preferredTags,
                      },
                    },
                  ]
                : []),
            ],
          }
        : {
            isPublished: true,
            ...excludeQuery,
          };

    const exploreQuery = {
      isPublished: true,
      ...excludeQuery,
      ...(strongestCategories.length > 0
        ? {
            category: {
              $nin: strongestCategories,
            },
          }
        : {}),
    };

    const [personalized, explore, popular] =
      (await Promise.all([
        Artwork.find(personalizedQuery)
          .select(
            "artist title imageUrl category tags likesCount createdAt"
          )
          .populate(
            "artist",
            "username artistProfile.displayName"
          )
          .sort({ createdAt: -1 })
          .limit(80)
          .lean(),

        Artwork.find(exploreQuery)
          .select(
            "artist title imageUrl category tags likesCount createdAt"
          )
          .populate(
            "artist",
            "username artistProfile.displayName"
          )
          .sort({ createdAt: -1 })
          .limit(50)
          .lean(),

        Artwork.find({
          isPublished: true,
          ...excludeQuery,
        })
          .select(
            "artist title imageUrl category tags likesCount createdAt"
          )
          .populate(
            "artist",
            "username artistProfile.displayName"
          )
          .sort({
            likesCount: -1,
            createdAt: -1,
          })
          .limit(50)
          .lean(),
      ])) as unknown as [
        RecommendationArtwork[],
        RecommendationArtwork[],
        RecommendationArtwork[],
      ];

    const currentTags = new Set(
      currentArtwork?.tags || []
    );

    const scoreArtwork = (
      artwork: RecommendationArtwork,
      mode: "personalized" | "explore" | "popular"
    ) => {
      let score =
        (artwork.likesCount || 0) * 0.7 +
        getRecentBoost(artwork.createdAt);

      if (
        currentArtwork?.category ===
        artwork.category
      ) {
        score += 10;
      }

      score +=
        categoryWeights.get(
          artwork.category
        ) || 0;

      for (const tag of artwork.tags || []) {
        if (currentTags.has(tag)) {
          score += 5;
        }

        score += tagWeights.get(tag) || 0;
      }

      if (
        mode === "explore" &&
        !strongestCategories.includes(
          artwork.category
        )
      ) {
        score += 14;
      }

      if (mode === "popular") {
        score += 4;
      }

      return score;
    };

    const rank = (
      artworks: RecommendationArtwork[],
      mode: "personalized" | "explore" | "popular"
    ) =>
      artworks
        .map((artwork) => ({
          artwork,
          score: scoreArtwork(artwork, mode),
        }))
        .sort((a, b) => b.score - a.score)
        .map(({ artwork }) => artwork);

    const selected =
      new Map<string, RecommendationArtwork>();

    const addUnique = (
      artworks: RecommendationArtwork[],
      limit: number
    ) => {
      for (const artwork of artworks) {
        if (selected.size >= limit) {
          return;
        }

        selected.set(
          artwork._id.toString(),
          artwork
        );
      }
    };

    addUnique(
      rank(personalized, "personalized").slice(
        0,
        7
      ),
      12
    );

    addUnique(
      rank(explore, "explore").slice(0, 4),
      12
    );

    addUnique(rank(popular, "popular"), 12);

    const selectedArtworks = Array.from(
      selected.values()
    ).slice(0, 12);
    const selectedIds =
      selectedArtworks.map((artwork) =>
        artwork._id.toString()
      );

    const [likedItems, savedItems] =
      session?.user?.id &&
      selectedIds.length > 0
        ? await Promise.all([
            Like.find({
              user: session.user.id,
              artwork: {
                $in: selectedIds,
              },
            })
              .select("artwork")
              .lean(),
            Save.find({
              user: session.user.id,
              artwork: {
                $in: selectedIds,
              },
            })
              .select("artwork")
              .lean(),
          ])
        : [[], []];

    const likedSet = new Set(
      likedItems.map((item) =>
        item.artwork.toString()
      )
    );
    const savedSet = new Set(
      savedItems.map((item) =>
        item.artwork.toString()
      )
    );

    const recommendations =
      selectedArtworks.map((artwork) =>
        toRecommendation(
          artwork,
          likedSet,
          savedSet
        )
      );

    return Response.json({
      success: true,
      recommendations,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        success: false,
        message:
          "Internal Server Error",
      },
      {
        status: 500,
      }
    );
  }
}
