import { connectDB } from "@/lib/db";

import User from "@/models/User";
import Artwork from "@/models/Artwork";

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
        artists: [],
        artworks: [],
      });
    }

    await connectDB();

    const regex =
      new RegExp(query, "i");

    const artists =
      await User.find({
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
        .select(
          "username artistProfile"
        )
        .limit(10)
        .lean();

    const artworks =
      await Artwork.find({
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
          "title imageUrl category artist"
        )
        .limit(20)
        .lean();

    return Response.json({
      success: true,
      artists,
      artworks,
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