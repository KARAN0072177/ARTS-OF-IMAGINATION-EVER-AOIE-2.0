import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";

import Collection from "@/models/Collection";

export async function GET() {
  try {
    const session =
      await getServerSession(authOptions);

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

    const collections =
      await Collection.find({
        user: session.user.id,
      })
        .select("name description artworks updatedAt")
        .select("name description artworks coverArtwork updatedAt")
        .sort({ updatedAt: -1 })
        .lean();

    return Response.json({
      success: true,
      collections: collections.map(
        (collection) => ({
          id: collection._id.toString(),
          name: collection.name,
          description:
            collection.description || "",
          count:
            collection.artworks?.length || 0,
          artworkIds: (
            collection.artworks || []
          ).map((artwork) =>
            artwork.toString()
          ),
          coverArtwork:
            collection.coverArtwork?.toString() ||
            null,
        })
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

export async function POST(req: Request) {
  try {
    const session =
      await getServerSession(authOptions);

    if (!session?.user?.id) {
      return Response.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const body = await req.json();
    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";
    const description =
      typeof body.description === "string"
        ? body.description.trim()
        : "";

    if (!name || name.length > 60) {
      return Response.json(
        {
          success: false,
          message:
            "Collection name is required and must be 60 characters or less.",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const existing =
      await Collection.findOne({
        user: session.user.id,
        name,
      }).lean();

    if (existing) {
      return Response.json(
        {
          success: false,
          message:
            "You already have a collection with that name.",
        },
        { status: 409 }
      );
    }

    const collection =
      await Collection.create({
        user: session.user.id,
        name,
        description,
        artworks: [],
      });

    return Response.json(
      {
        success: true,
        collection: {
          id: collection._id.toString(),
          name: collection.name,
          description:
            collection.description || "",
          count: 0,
          artworkIds: [],
          coverArtwork: null,
        },
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
