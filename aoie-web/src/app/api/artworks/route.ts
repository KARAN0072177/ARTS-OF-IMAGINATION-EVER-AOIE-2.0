import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";

import User from "@/models/User";
import Artwork from "@/models/Artwork";

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