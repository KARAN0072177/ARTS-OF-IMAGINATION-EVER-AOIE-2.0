import { connectDB } from "@/lib/db";

import User from "@/models/User";
import Artwork from "@/models/Artwork";

interface SearchArtworkResult {
  _id: {
    toString(): string;
  };
  title: string;
  imageUrl: string;
  category: string;
  tags?: string[];
  artist?: {
    username?: string;
    artistProfile?: {
      displayName?: string;
    };
  };
}

function escapeRegex(value: string) {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}

export async function GET(req: Request) {
  try {
    const { searchParams } =
      new URL(req.url);

    const query =
      searchParams
        .get("q")
        ?.trim() || "";

    if (!query) {
      return Response.json({
        success: true,
        users: [],
        artists: [],
        artworks: [],
        categories: [],
        tags: [],
      });
    }

    await connectDB();

    const regex =
      new RegExp(escapeRegex(query), "i");

    const [
      users,
      artworks,
      categories,
      tags,
    ] =
      await Promise.all([
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
            "username role artistProfile.displayName artistProfile.avatar artistProfile.bio artistProfile.location"
          )
          .limit(10)
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
            "title imageUrl category tags artist"
          )
          .populate(
            "artist",
            "username artistProfile.displayName"
          )
          .sort({
            likesCount: -1,
            createdAt: -1,
          })
          .limit(16)
          .lean(),

        Artwork.distinct("category", {
          isPublished: true,
          category: regex,
        }),

        Artwork.distinct("tags", {
          isPublished: true,
          tags: regex,
        }),
      ]);

    const typedArtworks =
      artworks as unknown as SearchArtworkResult[];

    return Response.json({
      success: true,
      users: users.map((user) => ({
        id: user._id.toString(),
        username: user.username,
        role: user.role,
        displayName:
          user.artistProfile?.displayName ||
          user.username,
        avatar:
          user.artistProfile?.avatar || "",
        bio: user.artistProfile?.bio || "",
        location:
          user.artistProfile?.location || "",
      })),
      artists: users
        .filter((user) => user.role === "artist")
        .map((user) => ({
          id: user._id.toString(),
          username: user.username,
          displayName:
            user.artistProfile?.displayName ||
            user.username,
          avatar:
            user.artistProfile?.avatar || "",
        })),
      artworks: typedArtworks.map((artwork) => ({
        id: artwork._id.toString(),
        title: artwork.title,
        imageUrl: artwork.imageUrl,
        category: artwork.category,
        tags: artwork.tags || [],
        artistName:
          artwork.artist?.artistProfile
            ?.displayName ||
          artwork.artist?.username ||
          "",
        artistUsername:
          artwork.artist?.username || "",
      })),
      categories: categories.slice(0, 8),
      tags: tags.slice(0, 12),
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
