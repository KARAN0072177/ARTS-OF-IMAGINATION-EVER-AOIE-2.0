import { getServerSession } from "next-auth";
import { Types } from "mongoose";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";

import Artwork from "@/models/Artwork";
import Save from "@/models/Save";
import { recordInteraction } from "@/lib/recordInteraction";

interface RouteProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET SAVE STATUS
 */
export async function GET(
  req: Request,
  { params }: RouteProps
) {
  try {
    const session =
      await getServerSession(
        authOptions
      );

    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
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

    const artwork =
      await Artwork.findById(id);

    if (!artwork) {
      return Response.json(
        {
          success: false,
          message:
            "Artwork not found",
        },
        {
          status: 404,
        }
      );
    }

    let saved = false;

    if (session?.user?.id) {
      const existingSave =
        await Save.findOne({
          user:
            session.user.id,

          artwork: id,
        });

      saved =
        !!existingSave;
    }

    return Response.json({
      success: true,
      saved,
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

/**
 * TOGGLE SAVE
 */
export async function POST(
  req: Request,
  { params }: RouteProps
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
          message:
            "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
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

    const artwork =
      await Artwork.findById(id);

    if (!artwork) {
      return Response.json(
        {
          success: false,
          message:
            "Artwork not found",
        },
        {
          status: 404,
        }
      );
    }

    const existingSave =
      await Save.findOne({
        user:
          session.user.id,

        artwork: id,
      });

    // UNSAVE
    if (existingSave) {
      await Save.deleteOne({
        _id:
          existingSave._id,
      });

      return Response.json({
        success: true,
        saved: false,
      });
    }

    // SAVE
    await Save.create({
      user:
        session.user.id,

      artwork: id,
    });

    await recordInteraction({
      userId: session.user.id,
      artworkId: id,
      type: "save",
    });

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
      {
        status: 500,
      }
    );
  }
}
