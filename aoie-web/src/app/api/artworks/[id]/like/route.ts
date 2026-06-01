import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";

import Artwork from "@/models/Artwork";
import Like from "@/models/Like";

import { createNotification }
  from "@/lib/createNotification";
import { emitNotification } from "@/lib/emitNotification";
import { recordInteraction } from "@/lib/recordInteraction";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(
  req: Request,
  { params }: RouteParams
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
        {
          status: 401,
        }
      );
    }

    const { id } = await params;

    await connectDB();

    const artwork =
      await Artwork.findById(id);

    if (!artwork) {
      return Response.json(
        {
          success: false,
          message: "Artwork not found",
        },
        {
          status: 404,
        }
      );
    }

    const existingLike =
      await Like.findOne({
        user: session.user.id,
        artwork: id,
      });

    // Unlike
    if (existingLike) {
      await Like.deleteOne({
        _id: existingLike._id,
      });

      const updatedArtwork =
        await Artwork.findByIdAndUpdate(
          id,
          {
            $inc: {
              likesCount: -1,
            },
          },
          {
            new: true,
          }
        );

      return Response.json({
        success: true,
        liked: false,
        likesCount:
          updatedArtwork?.likesCount ??
          0,
      });
    }

    // Like
    await Like.create({
      user: session.user.id,
      artwork: id,
    });

    await recordInteraction({
      userId: session.user.id,
      artworkId: id,
      type: "like",
    });

    // like notification

    const notification =
      await createNotification({
      recipient:
        artwork.artist.toString(),

      sender:
        session.user.id,

      type: "artwork_like",

      artwork: id,
    });

    if (notification) {
      await emitNotification({
        recipientId:
          artwork.artist.toString(),

        notification: {
          type: "artwork_like",
          senderId:
            session.user.id,
          artworkId: id,
        },
      });
    }

    const updatedArtwork =
      await Artwork.findByIdAndUpdate(
        id,
        {
          $inc: {
            likesCount: 1,
          },
        },
        {
          new: true,
        }
      );

    return Response.json({
      success: true,
      liked: true,
      likesCount:
        updatedArtwork?.likesCount ??
        0,
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
