import { getServerSession } from "next-auth";
import { Types } from "mongoose";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";

import User from "@/models/User";
import Artwork from "@/models/Artwork";
import Like from "@/models/Like";
import Save from "@/models/Save";

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
  placeholderUrl?: string;
}

interface ArtworkLike {
  artwork: Types.ObjectId;
}

interface ArtworkSave {
  artwork: Types.ObjectId;
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

export async function GET(req: Request) {
  try {
    const session =
      await getServerSession(authOptions);
    const { searchParams } =
      new URL(req.url);

    const category =
      searchParams.get("category") || "";
    const selectedCategory =
      categories.includes(category)
        ? category
        : "";
    const page = Math.max(
      Number.parseInt(
        searchParams.get("page") || "1",
        10
      ) || 1,
      1
    );
    const limit = Math.min(
      Math.max(
        Number.parseInt(
          searchParams.get("limit") || "24",
          10
        ) || 24,
        1
      ),
      48
    );
    const skip = (page - 1) * limit;

    await connectDB();

    const query = {
      isPublished: true,
      ...(selectedCategory
        ? { category: selectedCategory }
        : {}),
    };

    const [totalCount, artworks] =
      await Promise.all([
        Artwork.countDocuments(query),
        Artwork.find(query)
          .select(
            "title imageUrl category likesCount artist placeholderUrl"
          )
          .populate(
            "artist",
            "username artistProfile.displayName artistProfile.avatar"
          )
          .sort({
            createdAt: -1,
          })
          .skip(skip)
          .limit(limit)
          .lean(),
      ]);

    const typedArtworks =
      artworks as unknown as FeedArtwork[];
    const artworkIds = typedArtworks.map(
      (artwork) => artwork._id
    );

    const [likedArtworkIds, savedArtworkIds] =
      session?.user?.id &&
      artworkIds.length > 0
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

    const totalPages = Math.max(
      Math.ceil(totalCount / limit),
      1
    );

    return Response.json({
      success: true,
      artworks: typedArtworks.map(
        (artwork) => {
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
              likedSet.has(artworkId),
            isSaved:
              savedSet.has(artworkId),
            placeholderUrl: artwork.placeholderUrl || "",
          };
        }
      ),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasMore: page < totalPages,
      },
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

export async function POST(
  req: Request
) {
  try {
    const session =
      await getServerSession(
        authOptions
      );

    if (!session?.user?.id) {
      return Response.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    await connectDB();

    const user =
      await User.findById(
        session.user.id
      );

    if (!user) {
      return Response.json(
        {
          success: false,
          message: "User not found",
        },
        { status: 404 }
      );
    }

    if (user.role !== "artist") {
      return Response.json(
        {
          success: false,
          message:
            "Only artists can upload artworks",
        },
        { status: 403 }
      );
    }

    const body =
      await req.json();

    const {
      title,
      description,
      imageUrl,
      category,
      tags,
      placeholderUrl,
    } = body;

    if (
      !title ||
      !imageUrl ||
      !category
    ) {
      return Response.json(
        {
          success: false,
          message:
            "Title, image and category are required",
        },
        { status: 400 }
      );
    }

    const artwork =
      await Artwork.create({
        artist: user._id,

        title: title.trim(),

        description:
          description?.trim() || "",

        imageUrl,

        category,

        tags: Array.isArray(tags)
          ? tags
          : [],
        placeholderUrl: placeholderUrl || "",
      });

    return Response.json(
      {
        success: true,

        message:
          "Artwork created successfully",

        artwork,
      },
      { status: 201 }
    );
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
