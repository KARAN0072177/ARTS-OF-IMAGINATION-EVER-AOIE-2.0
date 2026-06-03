import { getServerSession } from "next-auth";
import { Types } from "mongoose";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Collection from "@/models/Collection";

interface RouteProps {
  params: Promise<{
    id: string;
  }>;
}

export async function PATCH(req: Request, { params }: RouteProps) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return Response.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      return Response.json(
        { success: false, message: "Invalid collection" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const updates: Record<
      string,
      string | Types.ObjectId | null
    > = {};

    if ("name" in body) {
      const name = typeof body.name === "string" ? body.name.trim() : "";

      if (!name || name.length > 60) {
        return Response.json(
          {
            success: false,
            message: "Collection name is required and must be 60 characters or less.",
          },
          { status: 400 }
        );
      }

      updates.name = name;
    }

    if ("description" in body) {
      const description =
        typeof body.description === "string" ? body.description.trim() : "";

      if (description.length > 240) {
        return Response.json(
          {
            success: false,
            message: "Description must be 240 characters or less.",
          },
          { status: 400 }
        );
      }

      updates.description = description;
    }

    if ("coverArtwork" in body) {
      if (body.coverArtwork === null || body.coverArtwork === "") {
        updates.coverArtwork = null;
      } else if (
        typeof body.coverArtwork === "string" &&
        Types.ObjectId.isValid(body.coverArtwork)
      ) {
        updates.coverArtwork = new Types.ObjectId(body.coverArtwork);
      } else {
        return Response.json(
          { success: false, message: "Invalid cover artwork" },
          { status: 400 }
        );
      }
    }

    await connectDB();

    const collection = await Collection.findOne({
      _id: id,
      user: session.user.id,
    });

    if (!collection) {
      return Response.json(
        { success: false, message: "Collection not found" },
        { status: 404 }
      );
    }

    const nextName =
      typeof updates.name === "string"
        ? updates.name
        : "";

    if (nextName && nextName !== collection.name) {
      const existing = await Collection.findOne({
        user: session.user.id,
        name: nextName,
        _id: { $ne: collection._id },
      }).lean();

      if (existing) {
        return Response.json(
          {
            success: false,
            message: "You already have a collection with that name.",
          },
          { status: 409 }
        );
      }
    }

    if (updates.coverArtwork) {
      const coverExists = collection.artworks.some(
        (artworkId) => artworkId.toString() === updates.coverArtwork?.toString()
      );

      if (!coverExists) {
        return Response.json(
          {
            success: false,
            message: "Cover image must belong to this collection.",
          },
          { status: 400 }
        );
      }
    }

    const updatedCollection =
      await Collection.collection.findOneAndUpdate(
        {
          _id: new Types.ObjectId(id),
          user: new Types.ObjectId(session.user.id),
        },
        {
          $set: updates,
        },
        {
          returnDocument: "after",
        }
      );

    if (!updatedCollection) {
      return Response.json(
        { success: false, message: "Collection not found" },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      collection: {
        id: updatedCollection._id.toString(),
        name: String(updatedCollection.name || ""),
        description: String(
          updatedCollection.description || ""
        ),
        coverArtwork:
          updatedCollection.coverArtwork?.toString() ||
          null,
      },
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: Request, { params }: RouteProps) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return Response.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      return Response.json(
        { success: false, message: "Invalid collection" },
        { status: 400 }
      );
    }

    await connectDB();

    const result = await Collection.deleteOne({
      _id: id,
      user: session.user.id,
    });

    if (result.deletedCount === 0) {
      return Response.json(
        { success: false, message: "Collection not found" },
        { status: 404 }
      );
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error(error);

    return Response.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
