import { getServerSession } from "next-auth";
import { Types } from "mongoose";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { recordInteraction } from "@/lib/recordInteraction";

import Artwork from "@/models/Artwork";
import Collection from "@/models/Collection";
import Save from "@/models/Save";

interface RouteProps {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(
  req: Request,
  { params }: RouteProps
) {
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

    const { id } = await params;
    const body = await req.json();
    const artworkId =
      typeof body.artworkId === "string"
        ? body.artworkId
        : "";

    if (
      !Types.ObjectId.isValid(id) ||
      !Types.ObjectId.isValid(artworkId)
    ) {
      return Response.json(
        {
          success: false,
          message: "Invalid request",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const [collection, artwork] =
      await Promise.all([
        Collection.findOne({
          _id: id,
          user: session.user.id,
        }),
        Artwork.findById(artworkId).select(
          "_id"
        ),
      ]);

    if (!collection || !artwork) {
      return Response.json(
        {
          success: false,
          message:
            "Collection or artwork not found",
        },
        { status: 404 }
      );
    }

    const exists =
      collection.artworks.some((item) =>
        item.toString() === artworkId
      );

    if (!exists) {
      collection.artworks.push(
        new Types.ObjectId(artworkId)
      );
      await collection.save();

      await Save.updateOne(
        {
          user: session.user.id,
          artwork: artworkId,
        },
        {
          $setOnInsert: {
            user: session.user.id,
            artwork: artworkId,
          },
        },
        {
          upsert: true,
        }
      );

      await recordInteraction({
        userId: session.user.id,
        artworkId,
        type: "save",
      });
    }

    return Response.json({
      success: true,
      saved: true,
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

export async function DELETE(
  req: Request,
  { params }: RouteProps
) {
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

    const { id } = await params;
    const { searchParams } =
      new URL(req.url);
    const artworkId =
      searchParams.get("artworkId") || "";
    const clearAll =
      searchParams.get("clear") === "all";
    const keepSaved =
      searchParams.get("keepSaved") === "true";

    if (
      !Types.ObjectId.isValid(id) ||
      (!clearAll &&
        !Types.ObjectId.isValid(artworkId))
    ) {
      return Response.json(
        {
          success: false,
          message: "Invalid request",
        },
        { status: 400 }
      );
    }

    await connectDB();

    if (clearAll) {
      const collection =
        await Collection.findOneAndUpdate(
          {
            _id: id,
            user: session.user.id,
          },
          {
            $set: {
              artworks: [],
              coverArtwork: null,
            },
          }
        );

      if (!collection) {
        return Response.json(
          {
            success: false,
            message: "Collection not found",
          },
          { status: 404 }
        );
      }

      if (!keepSaved) {
        await Promise.all(
          collection.artworks.map(
            async (collectionArtworkId) => {
              const stillInCollection =
                await Collection.exists({
                  user: session.user.id,
                  artworks: collectionArtworkId,
                });

              if (!stillInCollection) {
                await Save.deleteOne({
                  user: session.user.id,
                  artwork: collectionArtworkId,
                });
              }
            }
          )
        );
      }

      return Response.json({
        success: true,
        saved: keepSaved,
      });
    }

    const collection =
      await Collection.findOne({
        _id: id,
        user: session.user.id,
      }).select("coverArtwork");

    if (!collection) {
      return Response.json(
        {
          success: false,
          message: "Collection not found",
        },
        { status: 404 }
      );
    }

    const update: {
      $pull: {
        artworks: Types.ObjectId;
      };
      $set?: {
        coverArtwork: null;
      };
    } = {
      $pull: {
        artworks: new Types.ObjectId(artworkId),
      },
    };

    if (
      collection.coverArtwork?.toString() ===
      artworkId
    ) {
      update.$set = {
        coverArtwork: null,
      };
    }

    await Collection.updateOne(
      {
        _id: id,
        user: session.user.id,
      },
      update
    );

    const stillInCollection =
      await Collection.exists({
        user: session.user.id,
        artworks: artworkId,
      });

    if (!stillInCollection && !keepSaved) {
      await Save.deleteOne({
        user: session.user.id,
        artwork: artworkId,
      });
    }

    return Response.json({
      success: true,
      saved: Boolean(stillInCollection),
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
