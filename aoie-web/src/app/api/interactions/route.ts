import { getServerSession } from "next-auth";
import { Types } from "mongoose";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import {
  InteractionType,
  recordInteraction,
} from "@/lib/recordInteraction";

const interactionTypes = new Set([
  "view",
  "click",
  "like",
  "save",
  "comment",
  "share",
  "download",
]);

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
    const artworkId =
      typeof body.artworkId === "string"
        ? body.artworkId
        : "";
    const type =
      typeof body.type === "string" &&
      interactionTypes.has(body.type)
        ? (body.type as InteractionType)
        : "view";

    if (!Types.ObjectId.isValid(artworkId)) {
      return Response.json(
        {
          success: false,
          message: "Invalid artwork id",
        },
        { status: 400 }
      );
    }

    await connectDB();

    await recordInteraction({
      userId: session.user.id,
      artworkId,
      type,
    });

    return Response.json({
      success: true,
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
